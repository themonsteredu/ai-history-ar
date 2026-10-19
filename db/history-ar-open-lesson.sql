-- Remote migration: history_ar_open_lesson. Additive only: existing classrooms, members, works and answers are not changed.
-- Joseon open lesson (science artifact OX cards). Students join through the existing /join, so classrooms and member
-- tokens are shared; this table only keeps the open lesson's cards, cross-group checks and teacher questions.
create table history_ar.open_items (
  classroom_id uuid not null references history_ar.classrooms(id) on delete cascade,
  kind text not null check (kind in ('card','verify','teacher')),
  item_key text not null check (item_key ~ '^[1-6](:[1-6])?$'),
  version integer not null check (version > 0),
  data jsonb not null check (octet_length(data::text) <= 120000),
  updated_by uuid,
  updated_at timestamptz not null default now(),
  primary key (classroom_id, kind, item_key)
);
alter table history_ar.open_items enable row level security;
revoke all on history_ar.open_items from public, anon, authenticated;
grant select, insert, update, delete on history_ar.open_items to service_role;

-- Called only by the history-ar-open Edge handler, which validates every item's shape and the teacher PIN first.
create function public.history_ar_open_dispatch(p_action text, p_code text, p_token_hash text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  room history_ar.classrooms%rowtype; hub_open boolean;
  member history_ar.members%rowtype; item history_ar.open_items%rowtype;
  item_kind text; key text; expected integer; items jsonb;
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

  if p_action='save' then
    item_kind:=p_payload->>'kind'; key:=coalesce(p_payload->>'key','');
    if item_kind='card' then
      if key<>member.group_no::text then return jsonb_build_object('_status',403,'error','우리 모둠 카드만 저장할 수 있어요.'); end if;
    elsif item_kind='verify' then
      if key !~ '^[1-6]:[1-6]$' or split_part(key,':',1)<>member.group_no::text or split_part(key,':',1)=split_part(key,':',2) then
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
comment on function public.history_ar_open_dispatch(text,text,text,jsonb) is 'History AR Joseon open lesson, service-only. Member token hashes, classroom isolation, own-group writes and atomic versions. Teacher writes are allowed only after the Edge handler checks the teacher PIN.';
