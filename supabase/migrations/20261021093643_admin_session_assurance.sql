-- Apply locally/staging first. No environment-specific MFA bypass exists.
begin;
create or replace function kc_private.admin_authorized() returns boolean
language sql stable security definer set search_path='' as $$
  select kc_private.is_admin()
    and auth.jwt()->>'aal'='aal2'
    and exists (
      select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id
      where s.id::text=auth.jwt()->>'session_id' and s.user_id=auth.uid()
        and s.aal::text='aal2' and (s.not_after is null or s.not_after>now())
        and f.user_id=auth.uid() and f.status::text='verified'
    )
    and exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(auth.jwt()->'amr')='array'
        then auth.jwt()->'amr' else '[]'::jsonb end) item
      where item->>'method' in ('totp','mfa/totp')
        and case when item->>'timestamp' ~ '^[0-9]{1,11}$' then (item->>'timestamp')::bigint else 0 end
          between extract(epoch from now()-interval '15 minutes') and extract(epoch from now()+interval '30 seconds')
    );
$$;
revoke all on function kc_private.admin_authorized() from public,anon,authenticated;
create or replace function kc_private.admin_action(action text, target text, payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare days integer;
begin
  if not coalesce(kc_private.admin_authorized(),false) then raise exception 'Forbidden' using errcode='42501'; end if;
  if action='activate' then
    select duration_days into strict days from public.kc_packages where id=payload->>'package_id';
    insert into public.kc_entitlements values(target::uuid,payload->>'package_id',now(),now()+make_interval(days=>days))
      on conflict(user_id) do update set package_id=excluded.package_id, starts_at=excluded.starts_at, expires_at=excluded.expires_at;
  elsif action='revoke' then
    delete from public.kc_entitlements where user_id=target::uuid;
  elsif action='package' then
    update public.kc_packages set price_tzs=(payload->>'price_tzs')::integer,
      duration_days=(payload->>'duration_days')::integer, free_questions=(payload->>'free_questions')::integer,
      daily_cloud_limit=(payload->>'daily_cloud_limit')::integer where id=target;
    if not found then raise exception 'Unknown package'; end if;
  elsif action='moderate' then
    if payload->>'status' not in ('approved','rejected') then raise exception 'Invalid status'; end if;
    update public.kc_testimonials set status=payload->>'status' where id=target::uuid;
    if not found then raise exception 'Unknown testimonial'; end if;
  else raise exception 'Unknown action'; end if;
  insert into kc_private.audit(actor_id,action,target) values(auth.uid(),action,target);
end; $$;
create or replace function kc_private.admin_overview() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not coalesce(kc_private.admin_authorized(),false) then raise exception 'Forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'users',(select coalesce(jsonb_agg(jsonb_build_object('user_id',id)), '[]') from (select id from auth.users order by id limit 100) users_page),
    'testimonials',(select coalesce(jsonb_agg(to_jsonb(t)), '[]') from (select * from public.kc_testimonials order by created_at desc,id limit 100) t),
    'audit',(select coalesce(jsonb_agg(to_jsonb(a)), '[]') from (select * from kc_private.audit order by id desc limit 100) a));
end; $$;
create or replace function kc_private.set_contact(phone text) returns void
language plpgsql security definer set search_path='' as $$
declare previous_phone text;
begin
  if not coalesce(kc_private.admin_authorized(),false) then raise exception 'Forbidden' using errcode='42501'; end if;
  select whatsapp into strict previous_phone from public.kc_settings where id for update;
  update public.kc_settings set whatsapp=phone where id;
  insert into kc_private.audit(actor_id,action,target,details)
    values(auth.uid(),'contact','settings',jsonb_build_object('previous_whatsapp',previous_phone,'whatsapp',phone));
end; $$;
-- Free registered learners may sync their own summaries (owner approved 2026-10-21).
create or replace function public.kc_has_capability(capability text) returns boolean
language sql stable security invoker set search_path='' as $$
  select (capability='sync' and auth.uid() is not null) or exists(
    select 1 from public.kc_entitlements e where e.user_id=auth.uid()
    and e.starts_at<=now() and e.expires_at>now()
    and (capability in ('practice','personalized_questions')
      or (e.package_id='plus' and capability in ('panel','advanced_analysis'))));
$$;
commit;
