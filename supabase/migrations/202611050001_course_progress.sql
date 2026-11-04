-- Progress snapshots belong to a classroom, course, lesson and member.
-- Members never overwrite a different device's snapshot.
create table if not exists history_ar.course_progress (
  classroom_id uuid not null references history_ar.classrooms(id),
  member_id uuid not null,
  era text not null check (era in ('three-kingdoms','joseon')),
  lesson integer not null check (lesson between 1 and 6),
  data jsonb not null check (octet_length(data::text) <= 1500000),
  updated_at timestamptz not null default now(),
  primary key (classroom_id, member_id, era, lesson),
  foreign key (classroom_id, member_id) references history_ar.members(classroom_id,id)
);
alter table history_ar.course_progress enable row level security;
revoke all on history_ar.course_progress from public, anon, authenticated;
grant select, insert, update on history_ar.course_progress to service_role;

create or replace function public.history_ar_course_progress(
  p_action text, p_code text, p_token_hash text, p_era text, p_lesson integer, p_data jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room_id uuid; v_member_id uuid; v_member_group integer; records jsonb; shared jsonb;
begin
  if p_code !~ '^[a-z0-9]{4,12}$' or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_era not in ('three-kingdoms','joseon') or p_lesson not between 1 and 6 then
    return jsonb_build_object('_status',400,'error','수업 정보가 올바르지 않아요.');
  end if;
  select c.id into v_room_id from history_ar.classrooms c
    where c.code=p_code and ((c.hub_session_id is null and c.expires_at>now())
      or exists(select 1 from edu.sessions s where s.id=c.hub_session_id and s.is_open));
  if v_room_id is null then return jsonb_build_object('_status',404,'error','열린 수업코드를 확인해 주세요.'); end if;
  select m.id,m.group_no into v_member_id,v_member_group from history_ar.members m
    where m.classroom_id=v_room_id and m.token_hash=p_token_hash;
  if v_member_id is null then return jsonb_build_object('_status',403,'error','수업에 다시 입장해 주세요.'); end if;
  if p_action='save' then
    if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>1500000 then
      return jsonb_build_object('_status',400,'error','공유할 내용을 확인해 주세요.');
    end if;
    insert into history_ar.course_progress(classroom_id,member_id,era,lesson,data)
      values(v_room_id,v_member_id,p_era,p_lesson,p_data)
      on conflict(classroom_id,member_id,era,lesson) do update set data=excluded.data, updated_at=now();
    return jsonb_build_object('saved',true);
  elsif p_action='teacher' then
    select coalesce(jsonb_agg(jsonb_build_object('memberId',m.id,'group',m.group_no,
      'updatedAt',p.updated_at,'data',p.data) order by m.group_no,p.updated_at desc),'[]'::jsonb)
      into records from history_ar.course_progress p join history_ar.members m on m.id=p.member_id
      where p.classroom_id=v_room_id and p.era=p_era and p.lesson=p_lesson;
    shared:='[]'::jsonb;
    if p_era='three-kingdoms' and p_lesson>=4 then
      select coalesce(jsonb_agg(jsonb_build_object('group',w.group_no,'updatedAt',w.updated_at,
        'data',jsonb_build_object('kind','ar','heritageId',w.heritage_id,
          'modelName',w.project#>>'{ar,model,name}',
          'points',(select coalesce(jsonb_agg(jsonb_build_object('title',v->>'title','text',v->>'text')),'[]'::jsonb)
            from jsonb_array_elements(coalesce(w.project#>'{ar,points}','[]'::jsonb)) v),
          'question',w.project#>>'{ar,question}','questions',w.project->'questions',
          'role',w.project->>'role','reflection',w.project->>'reflection')) order by w.group_no),'[]'::jsonb)
        into shared from history_ar.works w where w.classroom_id=v_room_id;
      if p_lesson=6 then
        select shared || coalesce(jsonb_agg(jsonb_build_object('group',m.group_no,'updatedAt',a.created_at,
          'data',jsonb_build_object('kind','quiz','name',m.name,'score',a.result->'score','total',a.result->'total',
            'questions',a.result->'questions','results',a.result->'details','role',a.role,'reflection',a.reflection)) order by m.group_no,a.created_at),'[]'::jsonb)
          into shared from history_ar.answers a join history_ar.members m on m.id=a.member_id where a.classroom_id=v_room_id;
      end if;
    end if;
    return jsonb_build_object('records',records,'shared',shared);
  end if;
  return jsonb_build_object('_status',404,'error','수업 경로를 찾지 못했어요.');
end $$;
revoke all on function public.history_ar_course_progress(text,text,text,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.history_ar_course_progress(text,text,text,text,integer,jsonb) to service_role;
