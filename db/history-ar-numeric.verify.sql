-- Uses new synthetic codes only. Nothing, including the test works, is committed.
begin;
set local role service_role;
do $$
declare
  test_code text; value jsonb; first_expiry text; owner_token text; viewer_token text; project jsonb;
begin
  loop
    test_code := lpad(floor(random()*1000000000000)::bigint::text,12,'0');
    exit when not exists(select 1 from history_ar.classrooms where code=test_code)
      and not exists(select 1 from edu.sessions where lower(code)=test_code);
  end loop;
  foreach value in array array[
    public.history_ar_create_numeric_room(null), public.history_ar_create_numeric_room('123'),
    public.history_ar_create_numeric_room('abc123'), public.history_ar_create_numeric_room('1234567890123')
  ] loop
    if value->>'_status' is distinct from '400' then raise exception 'Invalid code accepted'; end if;
  end loop;
  value := public.history_ar_create_numeric_room(test_code);
  if value->>'saved' is distinct from 'true' or value->>'created' is distinct from 'true'
    or value->>'mode' is distinct from 'numeric' then raise exception 'Creation failed: %',value; end if;
  first_expiry := value->>'expiresAt';
  if first_expiry::timestamptz <> now()+interval '90 days' then raise exception 'Unexpected lifetime'; end if;
  value := public.history_ar_create_numeric_room(test_code);
  if value->>'created' is distinct from 'false' or value->>'expiresAt' is distinct from first_expiry then raise exception 'Reusing code changed classroom'; end if;
  owner_token := md5(random()::text)||md5(random()::text);
  viewer_token := md5(random()::text)||md5(random()::text);
  value := public.history_ar_dispatch('join',test_code,owner_token,'{"name":"숫자코드 QA 대표","group":1}');
  if value->>'memberId' is null then raise exception 'Numeric owner could not join'; end if;
  value := public.history_ar_dispatch('join',test_code,viewer_token,'{"name":"숫자코드 QA 관람","group":2}');
  if value->>'memberId' is null then raise exception 'Numeric viewer could not join'; end if;
  project := '{"version":1,"group":1,"heritageId":1,"ar":{"question":"","answerId":"p1","model":{"name":"QA"},"points":[{"id":"p1","title":"QA","text":"숫자 수업 설명","position":[0,0.5,0.2],"photoPosition":[0.5,0.5]}]}}';
  value := public.history_ar_dispatch('work-save',test_code,owner_token,jsonb_build_object('group',1,'expectedVersion',0,'project',project,'questions','[]'::jsonb));
  if value->>'shared' is distinct from 'true' then raise exception 'Numeric work save failed: %',value; end if;
  perform public.history_ar_create_numeric_room(test_code);
  value := public.history_ar_dispatch('work-get',test_code,viewer_token,'{"group":1}');
  if value#>>'{ar,points,0,text}' is distinct from '숫자 수업 설명' then raise exception 'Reopening lost work or cross-tablet viewing failed'; end if;
  value := public.history_ar_dispatch('work-save',test_code,viewer_token,jsonb_build_object('group',1,'expectedVersion',1,'project',project,'questions','[]'::jsonb));
  if value->>'_status' is distinct from '403' then raise exception 'Numeric code bypassed group ownership'; end if;
  update history_ar.classrooms set expires_at=now()-interval '1 minute' where code=test_code;
  value := public.history_ar_create_numeric_room(test_code);
  if value->>'_status' is distinct from '409' then raise exception 'Expired room reopened'; end if;
  if not exists(select 1 from history_ar.works w join history_ar.classrooms c on c.id=w.classroom_id where c.code=test_code)
    then raise exception 'Expired room records removed'; end if;
end;
$$;
select 'numeric creation, reuse, join, sharing, ownership and expiry checks passed; synthetic rows rolled back' as result;
rollback;
