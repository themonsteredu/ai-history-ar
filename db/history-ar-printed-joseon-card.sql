-- Read only the card face for a printed QR. The caller is the history-ar-open Edge function.
begin;

create or replace function public.history_ar_printed_joseon_card(p_code text, p_group integer, p_artifact_id integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce((
    select jsonb_build_object(
      'group', item.data->'group',
      'artifactId', item.data->'artifactId',
      'points', item.data->'points'
    )
    from history_ar.classrooms as room
    join history_ar.open_items as item
      on item.classroom_id = room.id and item.kind = 'card' and item.item_key = p_group::text
    where p_code ~ '^[a-z0-9]{4,12}$' and room.code = p_code
      and p_group between 1 and 6 and item.data->>'group' = p_group::text
      and item.data->>'artifactId' ~ '^[1-6]$'
      and (p_artifact_id is null or item.data->>'artifactId' = p_artifact_id::text)
      and coalesce(item.data->>'lesson', '') = ''
      and (
        (room.hub_session_id is null and room.expires_at > now())
        or exists (select 1 from edu.sessions where id = room.hub_session_id and is_open)
      )
  ), '{}'::jsonb);
$$;

revoke all on function public.history_ar_printed_joseon_card(text, integer, integer) from public, anon, authenticated;
grant execute on function public.history_ar_printed_joseon_card(text, integer, integer) to service_role;

commit;
