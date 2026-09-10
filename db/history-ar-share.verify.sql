-- Isolated synthetic records only; every row below is rolled back.
begin;
insert into history_ar.classrooms(code,expires_at) values ('qa'||substr(md5(random()::text),1,10),now()+interval '1 hour');
set local role service_role;
do $$
<<checks>>
declare
  code text; value jsonb; project jsonb; question jsonb; version_key text; saved_result jsonb;
begin
  select c.code into code from history_ar.classrooms c where c.hub_session_id is null and c.created_at=now();
  if code is null then raise exception 'QA classroom missing'; end if;
  value:=public.history_ar_dispatch('join',code,repeat('a',64),'{"name":"QA 대표","group":1}');
  if value->>'memberId' is null then raise exception 'Representative join failed: %',value; end if;
  value:=public.history_ar_dispatch('join',code,repeat('b',64),'{"name":"QA 관람","group":1}');
  if value->>'memberId' is null then raise exception 'Viewer join failed: %',value; end if;
  value:=public.history_ar_dispatch('join',code,repeat('c',64),'{"name":"QA 다른모둠","group":2}');
  if value->>'memberId' is null then raise exception 'Second group join failed: %',value; end if;
  project:='{"version":1,"group":1,"heritageId":3,"ar":{"question":"private","answerId":"p1","model":{"name":"QA 첨성대"},"points":[{"id":"p1","title":"QA 설명","text":"공유 설명","position":[0,0.5,0.2],"photoPosition":[0.5,0.5],"narration":{"data":"data:audio/wav;base64,UklGRg==","seconds":1}}]}}';
  question:='[{"id":"q1","prompt":"QA 문제","options":["돌","나무","흙"],"answer":0,"pointId":"p1"}]';
  value:=public.history_ar_dispatch('work-save',code,repeat('a',64),jsonb_build_object('group',1,'expectedVersion',0,'project',project,'questions',question));
  if value->>'version'<>'1' or value->>'shared'<>'true' then raise exception 'Share failed: %',value; end if;
  value:=public.history_ar_dispatch('room',code,repeat('b',64));
  if value->>'canEdit'<>'false' or jsonb_array_length(value->'gallery')<>1 or value#>'{questions,0,answer}' is not null then raise exception 'Viewer permissions or answer leak: %',value; end if;
  version_key:=value->>'questionVersion';
  value:=public.history_ar_dispatch('work-get',code,repeat('c',64),'{"group":1}');
  if value#>>'{ar,points,0,narration,data}'<>'data:audio/wav;base64,UklGRg==' or value#>>'{ar,question}'<>'' then raise exception 'Cross-group audio sharing failed'; end if;
  value:=public.history_ar_dispatch('draft-get',code,repeat('b',64),'{"group":1}');
  if value->>'_status'<>'403' then raise exception 'Viewer draft access'; end if;
  value:=public.history_ar_dispatch('work-save',code,repeat('b',64),jsonb_build_object('group',1,'expectedVersion',1,'project',project,'questions',question));
  if value->>'_status'<>'403' then raise exception 'Viewer overwrote work'; end if;
  value:=public.history_ar_dispatch('work-save',code,repeat('c',64),jsonb_build_object('group',1,'expectedVersion',1,'project',project,'questions',question));
  if value->>'_status'<>'403' then raise exception 'Other group overwrote work'; end if;
  value:=public.history_ar_dispatch('work-save',code,repeat('a',64),jsonb_build_object('group',1,'expectedVersion',0,'project',project,'questions',question));
  if value->>'_status'<>'409' then raise exception 'Stale write accepted'; end if;
  value:=public.history_ar_dispatch('room',code,repeat('d',64));
  if value->>'_status'<>'403' then raise exception 'Unknown member accepted'; end if;
  value:=public.history_ar_dispatch('answers-save',code,repeat('b',64),jsonb_build_object('answers','{"1:q1":0}'::jsonb,'role','QA','reflection','QA','questionVersion',version_key));
  if value->>'score'<>'1' or value->>'submitted'<>'true' then raise exception 'Quiz failed: %',value; end if;
  saved_result:=value;
  value:=public.history_ar_dispatch('work-save',code,repeat('a',64),jsonb_build_object('group',1,'expectedVersion',1,'project',project,'questions',question));
  if value->>'version'<>'2' then raise exception 'Owner update failed'; end if;
  value:=public.history_ar_dispatch('answers-save',code,repeat('c',64),jsonb_build_object('answers','{"1:q1":0}'::jsonb,'role','QA','reflection','QA','questionVersion',version_key));
  if value->>'_status'<>'409' then raise exception 'Stale quiz accepted'; end if;
  value:=public.history_ar_dispatch('answers-save',code,repeat('b',64),'{}');
  if value<>saved_result then raise exception 'Quiz snapshot overwritten'; end if;
  value:=public.history_ar_dispatch('answers-get',code,repeat('c',64));
  if value->>'submitted'<>'false' then raise exception 'Another student answer leaked'; end if;
  value:=public.history_ar_dispatch('work-save',code,repeat('c',64),jsonb_build_object('group',2,'expectedVersion',0,'project',jsonb_set(project,'{group}','2'),'questions','[]'::jsonb));
  if value->>'shared'<>'true' then raise exception 'Sharing requires quiz'; end if;
  update history_ar.classrooms set expires_at=now()-interval '1 minute' where classrooms.code=checks.code;
  value:=public.history_ar_dispatch('room',code,repeat('a',64));
  if value->>'_status'<>'404' then raise exception 'Expired class still accessible'; end if;
end;
$$;
select jsonb_build_object('transactional_checks','passed','hub_open_codes_readable',(select count(*)>=0 from edu.sessions where is_open),'synthetic_rows','rolled back') as result;
rollback;
