begin;
create function kc_private.admin_page(kind text,after_key text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; cursor text;
begin
  if not coalesce(kc_private.admin_authorized(),false) then raise exception 'Forbidden' using errcode='42501'; end if;
  if kind='users' then
    select coalesce(jsonb_agg(to_jsonb(p) order by user_id),'[]') into rows
      from (select id as user_id from auth.users where after_key is null or id>after_key::uuid order by id limit 100) p;
    cursor=rows->-1->>'user_id';
  elsif kind='testimonials' then
    select coalesce(jsonb_agg(to_jsonb(p) order by id),'[]') into rows
      from (select * from public.kc_testimonials where after_key is null or id>after_key::uuid order by id limit 100) p;
    cursor=rows->-1->>'id';
  elsif kind='audit' then
    select coalesce(jsonb_agg(to_jsonb(p) order by id desc),'[]') into rows
      from (select * from kc_private.audit where after_key is null or id<after_key::bigint order by id desc limit 100) p;
    cursor=rows->-1->>'id';
  else raise exception 'Unknown administrative page' using errcode='22023'; end if;
  return jsonb_build_object('rows',rows,'next_cursor',case when jsonb_array_length(rows)=100 then cursor else null end);
end; $$;
create function public.kc_admin_page(kind text,after_key text default null) returns jsonb
language sql security invoker set search_path='' as $$ select kc_private.admin_page(kind,after_key); $$;
revoke all on function kc_private.admin_page(text,text),public.kc_admin_page(text,text) from public,anon,authenticated;
grant execute on function kc_private.admin_page(text,text),public.kc_admin_page(text,text) to authenticated;
commit;
