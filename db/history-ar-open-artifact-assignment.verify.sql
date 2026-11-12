-- Synthetic classroom only. Run after history-ar-open-artifact-assignment.sql.
-- Every row created or changed by these assertions is rolled back.
begin;
set local role service_role;
do $$
declare
  qa_code text := 'qa' || substr(md5(random()::text),1,10);
  room_id uuid;
  token_a text := md5(random()::text) || md5(random()::text);
  token_b text := md5(random()::text) || md5(random()::text);
  token_c text := md5(random()::text) || md5(random()::text);
  original_card jsonb := '{"version":1,"group":1,"artifactId":1,"members":"오늘 작업한 학생들","points":["혼천의 관찰 내용","빈칸도 보존", ""],"questions":[{"id":"original-ox","prompt":"오늘 만든 OX 질문","answer":false}],"legacyExtra":{"keep":true}}';
  unassigned_card jsonb := '{"version":1,"group":2,"artifactId":0,"lesson":"goryeo-open-v2","members":"기존 모둠원","points":["이미 쓴 설명"],"questions":[{"id":"keep-me","prompt":"이미 만든 문제","answer":true}],"legacyExtra":"보존"}';
  original_verify jsonb := '{"version":1,"verifier":2,"target":1,"answers":[{"questionId":"original-ox","answer":false,"reason":"아이들이 작성한 검증"}],"legacyExtra":"보존"}';
  edited_card jsonb;
  result jsonb;
  stored jsonb;
begin
  insert into history_ar.classrooms(code,expires_at) values(qa_code,now()+interval '1 hour') returning id into room_id;
  insert into history_ar.members(classroom_id,token_hash,name,group_no) values
    (room_id,token_a,'QA group 1',1),(room_id,token_b,'QA group 2',2),(room_id,token_c,'QA group 3',3);
  -- Seed legacy rows directly to represent the work that already existed before assignment locking.
  insert into history_ar.open_items(classroom_id,kind,item_key,version,data) values
    (room_id,'card','1',1,original_card),(room_id,'card','2',1,unassigned_card),(room_id,'verify','2:1',1,original_verify);

  result := public.history_ar_open_dispatch('save',qa_code,token_c,jsonb_build_object('kind','card','key','3','expectedVersion',0,'data',jsonb_set(original_card,'{group}','3')));
  if result->>'_status' is distinct from '403' or exists(select 1 from history_ar.open_items where classroom_id=room_id and kind='card' and item_key='3') then
    raise exception 'Student created an unassigned card';
  end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_b,jsonb_build_object('kind','card','key','2','expectedVersion',1,'data',jsonb_set(unassigned_card,'{artifactId}','2')));
  if result->>'_status' is distinct from '403' then raise exception 'Student assigned an existing empty artifact'; end if;

  result := public.history_ar_open_dispatch('save',qa_code,token_a,jsonb_build_object('kind','card','key','1','expectedVersion',1,'data',jsonb_set(original_card,'{artifactId}','2')));
  if result->>'_status' is distinct from '403' then raise exception 'Student changed assigned artifact'; end if;
  result := public.history_ar_open_dispatch('assign',qa_code,token_a,jsonb_build_object('key','1','artifactId',2,'expectedVersion',1));
  if result->>'_status' is distinct from '409' then raise exception 'Teacher replaced an established assignment'; end if;
  select data into stored from history_ar.open_items where classroom_id=room_id and kind='card' and item_key='1';
  if stored is distinct from original_card then raise exception 'Rejected assignment changed legacy work'; end if;

  edited_card := jsonb_set(original_card,'{members}','"저장 버튼으로 바꾼 모둠원"');
  result := public.history_ar_open_dispatch('save',qa_code,token_a,jsonb_build_object('kind','card','key','1','expectedVersion',1,'data',edited_card));
  if result->>'version' is distinct from '2' then raise exception 'Own-group normal save failed'; end if;
  select data into stored from history_ar.open_items where classroom_id=room_id and kind='card' and item_key='1';
  if stored is distinct from edited_card then raise exception 'Archive trigger prevented normal update'; end if;
  if not exists(select 1 from history_ar.open_item_revisions where classroom_id=room_id and kind='card' and item_key='1' and version=1 and data=original_card and reason='update') then
    raise exception 'Original card was not archived before overwrite';
  end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_a,jsonb_build_object('kind','card','key','1','expectedVersion',1,'data',original_card));
  if result->>'_status' is distinct from '409' or result->'data' is distinct from edited_card then raise exception 'Stale save failed to return current card'; end if;
  result := public.history_ar_open_dispatch('save',qa_code,token_b,jsonb_build_object('kind','card','key','1','expectedVersion',2,'data',original_card));
  if result->>'_status' is distinct from '403' then raise exception 'Other group modified card'; end if;

  result := public.history_ar_open_dispatch('assign',qa_code,token_a,jsonb_build_object('key','2','artifactId',2,'expectedVersion',1));
  if result->>'version' is distinct from '2' then raise exception 'Teacher cannot assign legacy empty artifact'; end if;
  select data into stored from history_ar.open_items where classroom_id=room_id and kind='card' and item_key='2';
  if stored->>'artifactId' is distinct from '2' or (stored-'artifactId') is distinct from (unassigned_card-'artifactId') then
    raise exception 'Assignment replaced existing card fields';
  end if;
  if not exists(select 1 from history_ar.open_item_revisions where classroom_id=room_id and kind='card' and item_key='2' and data=unassigned_card and reason='update') then
    raise exception 'Unassigned legacy card was not archived';
  end if;

  result := public.history_ar_open_dispatch('assign',qa_code,token_a,jsonb_build_object('key','3','artifactId',3,'expectedVersion',0,'lesson','goryeo-open-v2'));
  if result->>'version' is distinct from '1' then raise exception 'Teacher cannot assign missing card'; end if;
  select data into stored from history_ar.open_items where classroom_id=room_id and kind='card' and item_key='3';
  if stored is distinct from '{"version":1,"group":3,"artifactId":3,"members":"","points":[],"questions":[],"lesson":"goryeo-open-v2"}'::jsonb then
    raise exception 'New assignment has wrong card shape';
  end if;
  select data into stored from history_ar.open_items where classroom_id=room_id and kind='verify' and item_key='2:1';
  if stored is distinct from original_verify then raise exception 'Artifact assignment changed OX verification'; end if;

  delete from history_ar.open_items where classroom_id=room_id and kind='verify' and item_key='2:1';
  if not exists(select 1 from history_ar.open_item_revisions where classroom_id=room_id and kind='verify' and item_key='2:1' and data=original_verify and reason='delete') then
    raise exception 'Deleted verification was not archived';
  end if;
  if has_table_privilege('anon','history_ar.open_item_revisions','SELECT') or has_table_privilege('authenticated','history_ar.open_item_revisions','SELECT') or
     has_table_privilege('service_role','history_ar.open_item_revisions','DELETE') or has_table_privilege('service_role','history_ar.open_item_revisions','UPDATE') then
    raise exception 'Revision access is not restricted';
  end if;
end;
$$;
select 'passed: original AR and OX preserved, immutable assignments, student/group locks, normal saves, version and deletion archives; all synthetic rows rolled back' as verification;
rollback;
