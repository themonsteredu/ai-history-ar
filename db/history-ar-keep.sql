-- Remote migration: keep numeric AR classrooms until someone removes them, instead of 90 days.
-- Apply on the Supabase project that serves /api/ar-studio. No works, members or answers change.
create or replace function public.history_ar_create_numeric_room(p_code text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  room history_ar.classrooms%rowtype;
  hub_open boolean; created boolean := false;
begin
  if p_code is null or p_code !~ '^[0-9]{4,12}$' then
    return jsonb_build_object('_status',400,'error','숫자 수업코드는 4~12자리로 입력해 주세요.');
  end if;
  select is_open into hub_open from edu.sessions where lower(code)=p_code;
  if found then
    if hub_open is not true then return jsonb_build_object('_status',403,'error','이미 마감된 수업허브 코드예요. 다른 숫자로 입력해 주세요.'); end if;
    return jsonb_build_object('code',p_code,'saved',true,'created',false,'mode','hub');
  end if;
  -- Teachers reuse a class code all year; a fixed 90 days lost work mid-course.
  insert into history_ar.classrooms(code,expires_at) values(p_code,now()+interval '100 years')
    on conflict(code) do nothing returning * into room;
  created := found;
  if not created then select * into room from history_ar.classrooms where code=p_code; end if;
  if room.hub_session_id is not null or room.expires_at is null or room.expires_at <= now() then
    return jsonb_build_object('_status',409,'error','사용이 끝난 번호예요. 기존 기록은 그대로 두고 다른 숫자를 입력해 주세요.');
  end if;
  return jsonb_build_object('code',p_code,'saved',true,'created',created,'mode','numeric','expiresAt',room.expires_at);
end;
$$;
-- Classes already made under the 90-day rule keep their work too.
update history_ar.classrooms set expires_at = now() + interval '100 years'
  where hub_session_id is null and expires_at is not null and expires_at > now();
