-- Synthetic classroom only. All changes are rolled back, including on a failed assertion.
begin;
set local role service_role;
do $$
declare
  qa_code text := 'qa' || substr(md5(random()::text),1,10);
  room_id uuid;
  token_a text := md5(random()::text) || md5(random()::text);
  token_b text := md5(random()::text) || md5(random()::text);
  token_c text := md5(random()::text) || md5(random()::text);
  first_data jsonb := '{"version":1,"group":1,"artifactId":1,"members":"","points":[],"questions":[]}';
  second_data jsonb;
  result jsonb; state_a jsonb; state_b jsonb;
begin
  insert into history_ar.classrooms(code,expires_at) values(qa_code,now()+interval '1 hour') returning id into room_id;
  insert into history_ar.members(classroom_id,token_hash,name,group_no) values
    (room_id,token_a,'QA tablet A',1),(room_id,token_b,'QA tablet B',1),(room_id,token_c,'QA other group',2);
  result := public.history_ar_open_dispatch('assign',qa_code,token_a,jsonb_build_object('key','1','artifactId',1,'expectedVersion',0));
  if result->>'version' is distinct from '1' then raise exception 'Initial teacher assignment failed'; end if;
  state_a := public.history_ar_open_dispatch('state',qa_code,token_a);
  state_b := public.history_ar_open_dispatch('state',qa_code,token_b);
  if state_a->'items' is distinct from state_b->'items' then raise exception 'Group readers diverge'; end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_b,jsonb_build_object('kind','card','key','1','expectedVersion',0,'data',first_data));
  if result->>'_status' is distinct from '409' or result->'data' is distinct from first_data or result->>'version' is distinct from '1' then raise exception 'Conflict lacks latest shared snapshot'; end if;
  second_data := jsonb_set(first_data,'{members}','"QA updated"');
  result := public.history_ar_open_dispatch('save',qa_code,token_b,jsonb_build_object('kind','card','key','1','expectedVersion',1,'data',second_data));
  if result->>'version' is distinct from '2' then raise exception 'Second member cannot save own group'; end if;
  state_a := public.history_ar_open_dispatch('state',qa_code,token_a);
  if state_a#>'{items,0,data}' is distinct from second_data then raise exception 'Refresh returns stale data'; end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_c,jsonb_build_object('kind','card','key','1','expectedVersion',2,'data',first_data));
  if result->>'_status' is distinct from '403' then raise exception 'Cross-group write allowed'; end if;
  state_b := public.history_ar_open_dispatch('state',qa_code,token_c);
  if state_b->'items' is distinct from state_a->'items' then raise exception 'Other group cannot observe saved cards'; end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_a,jsonb_build_object('kind','card','key','4','expectedVersion',0,'data',jsonb_set(first_data,'{group}','4')));
  if result->>'_status' is distinct from '403' then raise exception 'Group 1 can write group 4'; end if;

end;
$$;
select 'passed: shared reads, both members save, conflict snapshot, refresh, group isolation; all synthetic rows rolled back' as verification;
rollback;
