-- Applied through Supabase apply_migration: history_ar_shared_classrooms.
-- Existing Hub rows are read-only. Never grant its names, roster, or other columns.
grant usage on schema edu to service_role;
grant select (id, code, is_open) on edu.sessions to service_role;

create schema history_ar;
revoke all on schema history_ar from public, anon, authenticated;
grant usage on schema history_ar to service_role;

create table history_ar.classrooms (
  id uuid primary key default gen_random_uuid(),
  hub_session_id uuid unique references edu.sessions(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{4,12}$'),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  -- Only an operator can provision a short-lived, isolated QA room.
  check (hub_session_id is not null or expires_at is not null)
);
create table history_ar.members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references history_ar.classrooms(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  name text not null check (length(name) between 1 and 30),
  group_no integer not null check (group_no between 1 and 6),
  created_at timestamptz not null default now(),
  unique (classroom_id, id)
);
create index history_ar_members_class_idx on history_ar.members(classroom_id, group_no);
create table history_ar.works (
  classroom_id uuid not null references history_ar.classrooms(id) on delete cascade,
  group_no integer not null check (group_no between 1 and 6),
  owner_member_id uuid not null,
  heritage_id integer not null check (heritage_id between 1 and 6),
  version integer not null check (version > 0),
  project jsonb not null check (octet_length(project::text) <= 4500000),
  questions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (classroom_id, group_no),
  foreign key (classroom_id, owner_member_id) references history_ar.members(classroom_id, id)
);
create index history_ar_works_owner_idx on history_ar.works(classroom_id, owner_member_id);
create table history_ar.answers (
  member_id uuid primary key,
  classroom_id uuid not null references history_ar.classrooms(id) on delete cascade,
  result jsonb not null,
  role text not null check (length(role) between 1 and 300),
  reflection text not null check (length(reflection) between 1 and 1000),
  created_at timestamptz not null default now(),
  foreign key (classroom_id, member_id) references history_ar.members(classroom_id, id)
);
create index history_ar_answers_class_idx on history_ar.answers(classroom_id, member_id);

alter table history_ar.classrooms enable row level security;
alter table history_ar.members enable row level security;
alter table history_ar.works enable row level security;
alter table history_ar.answers enable row level security;
revoke all on all tables in schema history_ar from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema history_ar to service_role;

-- One transaction per request: group ownership, versions and quiz snapshots are atomic.
-- SECURITY INVOKER intentionally preserves the restricted caller's privileges.
create function public.history_ar_dispatch(p_action text, p_code text, p_token_hash text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  hub_id uuid; hub_open boolean; room history_ar.classrooms%rowtype;
  member history_ar.members%rowtype; work history_ar.works%rowtype;
  gallery jsonb; full_questions jsonb; public_questions jsonb; question_version text;
  result jsonb; details jsonb; target_group integer; expected integer; score integer;
begin
  if p_code is null or p_code !~ '^[a-z0-9]{4,12}$' then
    return jsonb_build_object('_status',400,'error','수업코드는 영문과 숫자 4~12자로 입력해 주세요.');
  end if;
  select id, is_open into hub_id, hub_open from edu.sessions where lower(code)=p_code;
  if found then
    if hub_open is not true then
      return jsonb_build_object('_status',403,'error','마감된 수업이에요. 선생님이 수업허브에서 다시 열어 주세요.');
    end if;
    insert into history_ar.classrooms(hub_session_id,code) values(hub_id,p_code)
      on conflict(hub_session_id) do update set code=excluded.code returning * into room;
  else
    select * into room from history_ar.classrooms
      where code=p_code and hub_session_id is null and expires_at > now();
    if not found then return jsonb_build_object('_status',404,'error','열린 수업코드를 찾지 못했어요. 수업허브의 참여 코드를 확인해 주세요.'); end if;
  end if;
  -- Serialize only this classroom; never lock or modify Hub rows.
  perform 1 from history_ar.classrooms where id=room.id for update;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('_status',401,'error','수업코드로 먼저 입장해 주세요.');
  end if;
  if p_action='join' then
    if (select count(*) from history_ar.members where classroom_id=room.id) >= 120 then
      return jsonb_build_object('_status',429,'error','수업 입장 인원이 많아요. 전에 입장한 태블릿에서 이어서 열어 주세요.');
    end if;
    if coalesce(p_payload->>'name','') !~ '\S' or length(p_payload->>'name')>30
       or coalesce(p_payload->>'group','') !~ '^[1-6]$' then
      return jsonb_build_object('_status',400,'error','이름과 1~6모둠 중 내 모둠을 확인해 주세요.');
    end if;
    insert into history_ar.members(classroom_id,token_hash,name,group_no)
      values(room.id,p_token_hash,trim(p_payload->>'name'),(p_payload->>'group')::integer) returning * into member;
    return jsonb_build_object('memberId',member.id,'code',p_code,'name',member.name,'group',member.group_no,'mode','shared');
  end if;
  select * into member from history_ar.members where classroom_id=room.id and token_hash=p_token_hash;
  if not found then return jsonb_build_object('_status',403,'error','이 수업의 입장 정보가 아니에요. 다시 입장해 주세요.'); end if;

  if p_action in ('room','answers-get','answers-save') then
    select coalesce(jsonb_agg(jsonb_build_object('group',group_no,'heritageId',heritage_id,
      'title',coalesce(project#>>'{ar,model,name}','우리 모둠 유물'),'version',version,'updatedAt',updated_at) order by group_no),'[]'::jsonb)
      into gallery from history_ar.works where classroom_id=room.id;
    select coalesce(jsonb_agg(q.value || jsonb_build_object('id',w.group_no::text||':'||(q.value->>'id'),'group',w.group_no) order by w.group_no,q.ordinality),'[]'::jsonb)
      into full_questions from history_ar.works w cross join lateral jsonb_array_elements(w.questions) with ordinality q
      where w.classroom_id=room.id;
    select coalesce(jsonb_agg(value-'answer'),'[]'::jsonb) into public_questions from jsonb_array_elements(full_questions);
    select md5(coalesce(string_agg(group_no::text||':'||version::text,',' order by group_no),''))
      into question_version from history_ar.works where classroom_id=room.id;
    if p_action='room' then
      select * into work from history_ar.works where classroom_id=room.id and group_no=member.group_no;
      return jsonb_build_object('code',p_code,'mode','shared','phase','quiz','gallery',gallery,
        'questions',public_questions,'questionVersion',question_version,
        'canEdit',work.owner_member_id is null or work.owner_member_id=member.id);
    end if;
    select a.result into result from history_ar.answers a where a.member_id=member.id and a.classroom_id=room.id;
    if found then return result; end if;
    if p_action='answers-get' then return jsonb_build_object('submitted',false); end if;
    if p_payload->>'questionVersion' is distinct from question_version then
      return jsonb_build_object('_status',409,'error','모둠 문제가 바뀌었어요. 새로고침 후 다시 확인해 주세요.');
    end if;
    if jsonb_array_length(full_questions)=0 or jsonb_typeof(p_payload->'answers') is distinct from 'object' then
      return jsonb_build_object('_status',400,'error','공유된 문제의 답을 골라 주세요.');
    end if;
    if (select count(*) from jsonb_object_keys(p_payload->'answers'))<>jsonb_array_length(full_questions)
       or exists(select 1 from jsonb_array_elements(full_questions) q where coalesce(p_payload->'answers'->>(q->>'id'),'') !~ '^[0-2]$')
       or length(trim(coalesce(p_payload->>'role',''))) not between 1 and 300
       or length(trim(coalesce(p_payload->>'reflection',''))) not between 1 and 1000 then
      return jsonb_build_object('_status',400,'error','모든 답과 내가 맡은 일·배운 점을 확인해 주세요.');
    end if;
    select jsonb_agg(jsonb_build_object('id',q->>'id','chosen',(p_payload->'answers'->>(q->>'id'))::integer,
      'answer',(q->>'answer')::integer,'correct',(p_payload->'answers'->>(q->>'id'))::integer=(q->>'answer')::integer,
      'pointId',q->>'pointId','group',(q->>'group')::integer)),
      count(*) filter(where (p_payload->'answers'->>(q->>'id'))::integer=(q->>'answer')::integer)
      into details, score from jsonb_array_elements(full_questions) q;
    result:=jsonb_build_object('submitted',true,'score',score,'total',jsonb_array_length(full_questions),
      'details',details,'questions',public_questions,'questionVersion',question_version);
    insert into history_ar.answers(member_id,classroom_id,result,role,reflection)
      values(member.id,room.id,result,trim(p_payload->>'role'),trim(p_payload->>'reflection'));
    return result;
  end if;

  if p_action in ('work-get','draft-get','work-save') then
    if coalesce(p_payload->>'group','') !~ '^[1-6]$' then return jsonb_build_object('_status',400,'error','모둠을 확인해 주세요.'); end if;
    target_group:=(p_payload->>'group')::integer;
    select * into work from history_ar.works where classroom_id=room.id and group_no=target_group;
    if p_action='work-get' then
      if work.version is null then return jsonb_build_object('_status',404,'error','아직 이 모둠이 공유한 작품이 없어요.'); end if;
      return jsonb_build_object('heritageId',work.heritage_id,'group',target_group,'version',work.version,
        'ar',(work.project->'ar')||jsonb_build_object('question','','answerId',work.project#>>'{ar,points,0,id}'));
    end if;
    if target_group<>member.group_no or (work.owner_member_id is not null and work.owner_member_id<>member.id) then
      return jsonb_build_object('_status',403,'error','이 모둠은 처음 공유한 태블릿에서 저장해요. 다른 태블릿에서는 우리 반 작품을 관람할 수 있어요.');
    end if;
    if p_action='draft-get' then
      if work.version is null then return jsonb_build_object('_status',404,'error','아직 저장한 모둠 작품이 없어요.'); end if;
      return jsonb_build_object('project',work.project,'version',work.version);
    end if;
    if coalesce(p_payload->>'expectedVersion','') !~ '^[0-9]{1,9}$' then
      return jsonb_build_object('_status',400,'error','저장본 번호를 확인해 주세요.');
    end if;
    expected:=(p_payload->>'expectedVersion')::integer;
    if expected<>coalesce(work.version,0) then
      return jsonb_build_object('_status',409,'error','더 최근 저장본이 있어요. 현재 작업을 파일로 보관하고 저장된 모둠 작품을 다시 열어 주세요.');
    end if;
    if p_payload#>>'{project,group}' is distinct from target_group::text
       or coalesce(p_payload#>>'{project,heritageId}','') !~ '^[1-6]$'
       or jsonb_typeof(p_payload#>'{project,ar,points}') is distinct from 'array'
       or octet_length((p_payload->'project')::text)>4500000
       or jsonb_typeof(p_payload->'questions') is distinct from 'array' then
      return jsonb_build_object('_status',400,'error','작품 형식을 확인해 주세요.');
    end if;
    insert into history_ar.works(classroom_id,group_no,owner_member_id,heritage_id,version,project,questions)
      values(room.id,target_group,member.id,(p_payload#>>'{project,heritageId}')::integer,expected+1,p_payload->'project',p_payload->'questions')
      on conflict(classroom_id,group_no) do update set heritage_id=excluded.heritage_id,version=excluded.version,
        project=excluded.project,questions=excluded.questions,updated_at=now();
    return jsonb_build_object('saved',true,'shared',true,'version',expected+1);
  end if;
  return jsonb_build_object('_status',404,'error','수업 경로를 찾지 못했어요.');
end;
$$;
revoke all on function public.history_ar_dispatch(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.history_ar_dispatch(text,text,text,jsonb) to service_role;
comment on function public.history_ar_dispatch(text,text,text,jsonb) is 'History AR service-only API. Custom member token hashes, Hub open-code check, classroom isolation and atomic owner/version checks. No teacher-header or client-PIN trust.';
