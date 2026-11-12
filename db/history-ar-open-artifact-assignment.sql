-- Preserve every currently saved card, OX record and teacher set before enabling assignments.
-- No existing open_items row is updated or deleted by this migration.
begin;
lock table history_ar.open_items in share row exclusive mode;

create table if not exists history_ar.open_item_revisions (
  id bigint generated always as identity primary key,
  classroom_id uuid not null,
  classroom_code text not null,
  kind text not null,
  item_key text not null,
  version integer not null,
  data jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null,
  archived_at timestamptz not null default now(),
  reason text not null
);
-- Deliberately no classroom foreign key: deleting a classroom must not cascade into its recovery copies.
create index if not exists open_item_revisions_lookup on history_ar.open_item_revisions(classroom_id, kind, item_key, archived_at desc);
alter table history_ar.open_item_revisions enable row level security;
revoke all on history_ar.open_item_revisions from public, anon, authenticated, service_role;
grant select, insert on history_ar.open_item_revisions to service_role;
grant usage, select on sequence history_ar.open_item_revisions_id_seq to service_role;

insert into history_ar.open_item_revisions(classroom_id,classroom_code,kind,item_key,version,data,updated_by,updated_at,reason)
select i.classroom_id,c.code,i.kind,i.item_key,i.version,i.data,i.updated_by,i.updated_at,'before_teacher_assignment'
from history_ar.open_items i join history_ar.classrooms c on c.id=i.classroom_id
where not exists (
  select 1 from history_ar.open_item_revisions r where r.classroom_id=i.classroom_id and r.kind=i.kind and r.item_key=i.item_key
    and r.version=i.version and r.data=i.data and r.reason='before_teacher_assignment'
);

create or replace function history_ar.archive_open_item_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into history_ar.open_item_revisions(classroom_id,classroom_code,kind,item_key,version,data,updated_by,updated_at,reason)
    values(old.classroom_id,coalesce((select code from history_ar.classrooms where id=old.classroom_id),''),
      old.kind,old.item_key,old.version,old.data,old.updated_by,old.updated_at,lower(tg_op));
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function history_ar.archive_open_item_revision() from public, anon, authenticated;
grant execute on function history_ar.archive_open_item_revision() to service_role;
drop trigger if exists archive_open_item_revision on history_ar.open_items;
create trigger archive_open_item_revision before update or delete on history_ar.open_items
  for each row execute function history_ar.archive_open_item_revision();

-- Preserve existing open-lesson behavior while protecting teacher artifact assignments.
create or replace function public.history_ar_open_dispatch(p_action text, p_code text, p_token_hash text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  room history_ar.classrooms%rowtype; hub_open boolean;
  member history_ar.members%rowtype; item history_ar.open_items%rowtype;
  item_kind text; key text; expected integer; items jsonb; assigned_data jsonb; assigned_artifact integer;
begin
  if p_code is null or p_code !~ '^[a-z0-9]{4,12}$' then
    return jsonb_build_object('_status',400,'error','수업코드는 영문과 숫자 4~12자로 입력해 주세요.');
  end if;
  select * into room from history_ar.classrooms where code=p_code;
  if not found then return jsonb_build_object('_status',404,'error','열린 수업코드를 찾지 못했어요. 먼저 수업코드로 입장해 주세요.'); end if;
  if room.hub_session_id is not null then
    select is_open into hub_open from edu.sessions where id=room.hub_session_id;
    if hub_open is not true then return jsonb_build_object('_status',403,'error','마감된 수업이에요. 선생님이 수업허브에서 다시 열어 주세요.'); end if;
  elsif room.expires_at is null or room.expires_at <= now() then
    return jsonb_build_object('_status',404,'error','사용이 끝난 수업코드예요.');
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('_status',401,'error','수업코드로 먼저 입장해 주세요.');
  end if;
  select * into member from history_ar.members where classroom_id=room.id and token_hash=p_token_hash;
  if not found then return jsonb_build_object('_status',403,'error','이 수업의 입장 정보가 아니에요. 다시 입장해 주세요.'); end if;

  if p_action='state' then
    select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'key',item_key,'version',version,'data',data,'updatedAt',updated_at) order by kind,item_key),'[]'::jsonb)
      into items from history_ar.open_items where classroom_id=room.id;
    return jsonb_build_object('code',p_code,'items',items,'me',jsonb_build_object('group',member.group_no,'name',member.name));
  end if;

  -- Service-only dispatch: the Edge handler verifies the teacher PIN before choosing this action.
  -- Existing nonzero card.artifactId is already the assignment; do not rewrite legacy student work.
  if p_action='assign' then
    key:=coalesce(p_payload->>'key','');
    if key !~ '^[1-6]$' or coalesce(p_payload->>'artifactId','') !~ '^[1-6]$' or
       coalesce(p_payload->>'expectedVersion','') !~ '^[0-9]{1,9}$' or
       (p_payload ? 'lesson' and coalesce(p_payload->>'lesson','') <> 'goryeo-open-v2') then
      return jsonb_build_object('_status',400,'error','배정할 모둠과 유물을 확인해 주세요.');
    end if;
    expected:=(p_payload->>'expectedVersion')::integer;
    assigned_artifact:=(p_payload->>'artifactId')::integer;
    perform 1 from history_ar.classrooms where id=room.id for update;
    select * into item from history_ar.open_items where classroom_id=room.id and kind='card' and item_key=key;
    if expected<>coalesce(item.version,0) then
      return jsonb_build_object('_status',409,'error','다른 기기에서 먼저 저장했어요. 새로 불러온 뒤 확인해 주세요.','version',coalesce(item.version,0),'data',item.data);
    end if;
    if item.data is not null and coalesce(item.data->>'artifactId','0')<>'0' then
      return jsonb_build_object('_status',409,'error','이미 배정된 유물입니다. 오늘 작성한 내용을 보호하기 위해 변경할 수 없어요.','version',item.version,'data',item.data);
    end if;
    if item.data is not null then
      -- Do not replace the JSON document: keep every existing explanation, question and extra field.
      assigned_data:=jsonb_set(item.data,'{artifactId}',to_jsonb(assigned_artifact));
    else
      assigned_data:=jsonb_build_object('version',1,'group',key::integer,'artifactId',assigned_artifact,'members','','points','[]'::jsonb,'questions','[]'::jsonb);
      if p_payload->>'lesson'='goryeo-open-v2' then assigned_data:=assigned_data||jsonb_build_object('lesson','goryeo-open-v2'); end if;
    end if;
    insert into history_ar.open_items(classroom_id,kind,item_key,version,data,updated_by)
      values(room.id,'card',key,expected+1,assigned_data,member.id)
      on conflict(classroom_id,kind,item_key) do update set version=excluded.version,data=excluded.data,updated_by=excluded.updated_by,updated_at=now();
    return jsonb_build_object('saved',true,'version',expected+1);
  end if;

  if p_action='save' then
    item_kind:=p_payload->>'kind'; key:=coalesce(p_payload->>'key','');
    if item_kind='card' then
      if key<>member.group_no::text then return jsonb_build_object('_status',403,'error','우리 모둠 카드만 저장할 수 있어요.'); end if;
    elsif item_kind='verify' then
      if key !~ '^[1-6]:[1-6]$' or split_part(key,':',1)<>member.group_no::text or (split_part(key,':',1)=split_part(key,':',2) and coalesce(p_payload->'data'->>'mode','')<>'self') then
        return jsonb_build_object('_status',403,'error','우리 모둠의 검증 기록만 저장할 수 있어요.');
      end if;
    elsif item_kind='teacher' then
      if key !~ '^[1-6]$' then return jsonb_build_object('_status',400,'error','유물을 확인해 주세요.'); end if;
    else
      return jsonb_build_object('_status',400,'error','저장할 내용을 확인해 주세요.');
    end if;
    if jsonb_typeof(p_payload->'data') is distinct from 'object' or octet_length((p_payload->'data')::text)>120000 then
      return jsonb_build_object('_status',400,'error','저장할 내용이 너무 길어요.');
    end if;
    if coalesce(p_payload->>'expectedVersion','') !~ '^[0-9]{1,9}$' then
      return jsonb_build_object('_status',400,'error','저장본 번호를 확인해 주세요.');
    end if;
    expected:=(p_payload->>'expectedVersion')::integer;
    -- Serialize this classroom's writers so two tablets of one group cannot overwrite each other silently.
    perform 1 from history_ar.classrooms where id=room.id for update;
    select * into item from history_ar.open_items where classroom_id=room.id and kind=item_kind and item_key=key;
    if expected<>coalesce(item.version,0) then
      return jsonb_build_object('_status',409,'error','다른 태블릿에서 먼저 저장했어요. 새로 불러온 뒤 다시 저장해 주세요.','version',coalesce(item.version,0),'data',item.data);
    end if;
    if item_kind='card' then
      if item.data is null or coalesce(item.data->>'artifactId','0')='0' then
        return jsonb_build_object('_status',403,'error','선생님이 우리 모둠의 유물을 먼저 배정해야 해요.');
      end if;
      if (p_payload->'data'->>'artifactId') is distinct from (item.data->>'artifactId') or
         (p_payload->'data'->>'group') is distinct from key then
        return jsonb_build_object('_status',403,'error','배정된 유물은 바꿀 수 없어요. 기존 카드는 그대로 보관돼요.');
      end if;
    end if;
    insert into history_ar.open_items(classroom_id,kind,item_key,version,data,updated_by)
      values(room.id,item_kind,key,expected+1,p_payload->'data',member.id)
      on conflict(classroom_id,kind,item_key) do update set version=excluded.version,data=excluded.data,updated_by=excluded.updated_by,updated_at=now();
    return jsonb_build_object('saved',true,'version',expected+1);
  end if;
  return jsonb_build_object('_status',404,'error','수업 경로를 찾지 못했어요.');
end;
$$;
revoke all on function public.history_ar_open_dispatch(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.history_ar_open_dispatch(text,text,text,jsonb) to service_role;
comment on function public.history_ar_open_dispatch(text,text,text,jsonb) is 'History AR service-only dispatch. The Edge handler checks teacher PIN before assign or teacher saves. Existing artifact assignments are immutable; all old versions are archived.';

commit;
