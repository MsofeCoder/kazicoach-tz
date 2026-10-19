-- Local/test only. Production schema compatibility and rollout require approval.
begin;
create schema kc_private;
revoke all on schema kc_private from public, anon, authenticated;
grant usage on schema kc_private to authenticated, anon;

create table public.kc_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80)
);
create table public.kc_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  question_id text not null check (char_length(question_id) between 1 and 100),
  category text not null check (category in ('personal','role','technical','scenario','ethics')),
  mode text not null check (mode in ('oral','written')),
  score integer not null check (score between 0 and 100),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  created_at timestamptz not null check (created_at between '2020-01-01' and now() + interval '1 day'),
  primary key(user_id, id)
);
create table public.kc_packages (
  id text primary key check (id in ('basic','plus')),
  price_tzs integer not null check (price_tzs between 0 and 10000000),
  duration_days integer not null check (duration_days between 1 and 365),
  free_questions integer not null check (free_questions between 0 and 100),
  daily_cloud_limit integer not null check (daily_cloud_limit between 1 and 1000)
);
insert into public.kc_packages values ('basic',3000,7,5,100),('plus',5000,7,5,100);
create table public.kc_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  package_id text not null references public.kc_packages(id),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  check (expires_at > starts_at)
);
create table kc_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.kc_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  body text not null check (char_length(body) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table kc_private.audit (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);
create table kc_private.cloud_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null,
  primary key(user_id,day)
);

alter table public.kc_profiles enable row level security;
alter table public.kc_attempts enable row level security;
alter table public.kc_packages enable row level security;
alter table public.kc_entitlements enable row level security;
alter table public.kc_testimonials enable row level security;
alter table kc_private.admins enable row level security;
alter table kc_private.audit enable row level security;
alter table kc_private.cloud_usage enable row level security;

revoke all on public.kc_profiles, public.kc_attempts, public.kc_packages,
  public.kc_entitlements, public.kc_testimonials from public, anon, authenticated;
grant select,insert,update,delete on public.kc_profiles to authenticated;
grant select,insert,delete on public.kc_attempts to authenticated;
grant select on public.kc_packages to anon,authenticated;
grant select on public.kc_entitlements to authenticated;
grant select,delete on public.kc_testimonials to authenticated;
grant insert(user_id,display_name,body), update(display_name,body) on public.kc_testimonials to authenticated;

create policy profile_owner on public.kc_profiles to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy attempt_owner on public.kc_attempts to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy packages_read on public.kc_packages for select to anon,authenticated using(true);
create policy entitlement_owner on public.kc_entitlements for select to authenticated using((select auth.uid())=user_id);
create policy testimonial_owner_read on public.kc_testimonials for select to authenticated using((select auth.uid())=user_id);
create policy testimonial_owner_insert on public.kc_testimonials for insert to authenticated with check((select auth.uid())=user_id and status='pending');
create policy testimonial_owner_edit on public.kc_testimonials for update to authenticated using((select auth.uid())=user_id and status='pending') with check((select auth.uid())=user_id and status='pending');
create policy testimonial_owner_withdraw on public.kc_testimonials for delete to authenticated using((select auth.uid())=user_id);

create function public.kc_has_capability(capability text) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.kc_entitlements e where e.user_id=auth.uid()
    and e.starts_at<=now() and e.expires_at>now()
    and (capability in ('practice','personalized_questions','sync')
      or (e.package_id='plus' and capability in ('panel','advanced_analysis'))));
$$;

-- Definer code is kept out of exposed schemas; every privileged action authenticates
-- against a trusted table, never user_metadata. PUBLIC execute is revoked below.
create function kc_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from kc_private.admins where user_id=auth.uid());
$$;
create function public.kc_is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select kc_private.is_admin(); $$;

create function kc_private.admin_action(action text, target text, payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare days integer;
begin
  if not kc_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
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
create function public.kc_admin_action(action text, target text, payload jsonb) returns void
language sql security invoker set search_path='' as $$ select kc_private.admin_action(action,target,payload); $$;

create function kc_private.admin_overview() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not kc_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'users',(select coalesce(jsonb_agg(jsonb_build_object('user_id',id)), '[]') from auth.users),
    'testimonials',(select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.kc_testimonials t),
    'audit',(select coalesce(jsonb_agg(to_jsonb(a)), '[]') from (select * from kc_private.audit order by id desc limit 100) a));
end; $$;
create function public.kc_admin_overview() returns jsonb language sql security invoker set search_path='' as $$ select kc_private.admin_overview(); $$;

create function kc_private.public_testimonials() returns table(id uuid,display_name text,body text)
language sql stable security definer set search_path='' as $$
  select id,display_name,body from public.kc_testimonials where status='approved' order by created_at desc limit 100;
$$;
create function public.kc_public_testimonials() returns table(id uuid,display_name text,body text)
language sql stable security invoker set search_path='' as $$ select * from kc_private.public_testimonials(); $$;

create function kc_private.consume_cloud_request() returns boolean language plpgsql security definer set search_path='' as $$
declare quota integer; used integer;
begin
  select p.daily_cloud_limit into quota from public.kc_entitlements e join public.kc_packages p on p.id=e.package_id
    where e.user_id=auth.uid() and e.starts_at<=now() and e.expires_at>now();
  if quota is null then raise exception 'Premium access required' using errcode='42501'; end if;
  insert into kc_private.cloud_usage values(auth.uid(),(now() at time zone 'Africa/Dar_es_Salaam')::date,1)
    on conflict(user_id,day) do update set count=kc_private.cloud_usage.count+1
    where kc_private.cloud_usage.count<quota returning count into used;
  if used is null then raise exception 'Daily limit reached' using errcode='P0001'; end if;
  return true;
end; $$;
create function public.kc_consume_cloud_request() returns boolean language sql security invoker set search_path='' as $$ select kc_private.consume_cloud_request(); $$;

create function kc_private.delete_account() returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if kc_private.is_admin() then raise exception 'Transfer administration before deletion'; end if;
  delete from auth.users where id=auth.uid();
end; $$;
create function public.kc_delete_account() returns void language sql security invoker set search_path='' as $$ select kc_private.delete_account(); $$;

revoke all on all functions in schema kc_private from public, anon, authenticated;
grant execute on function kc_private.is_admin(),kc_private.admin_action(text,text,jsonb),kc_private.admin_overview(),kc_private.consume_cloud_request(),kc_private.delete_account() to authenticated;
grant execute on function kc_private.public_testimonials() to anon, authenticated;
revoke all on function public.kc_has_capability(text),public.kc_is_admin(),public.kc_admin_action(text,text,jsonb),public.kc_admin_overview(),public.kc_consume_cloud_request(),public.kc_delete_account(),public.kc_public_testimonials() from public,anon,authenticated;
grant execute on function public.kc_has_capability(text),public.kc_is_admin(),public.kc_admin_action(text,text,jsonb),public.kc_admin_overview(),public.kc_consume_cloud_request(),public.kc_delete_account() to authenticated;
grant execute on function public.kc_public_testimonials() to anon,authenticated;
create table public.kc_settings (
  id boolean primary key default true check(id),
  whatsapp text not null default '' check(whatsapp='' or whatsapp ~ '^[1-9][0-9]{7,14}$')
);
insert into public.kc_settings(id) values(true);
alter table public.kc_settings enable row level security;
revoke all on public.kc_settings from public,anon,authenticated;
grant select on public.kc_settings to anon,authenticated;
create policy settings_read on public.kc_settings for select to anon,authenticated using(true);
create function kc_private.set_contact(phone text) returns void language plpgsql security definer set search_path='' as $$
begin
  if not kc_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  update public.kc_settings set whatsapp=phone where id;
  insert into kc_private.audit(actor_id,action,target) values(auth.uid(),'contact','settings');
end; $$;
create function public.kc_set_contact(phone text) returns void language sql security invoker set search_path='' as $$ select kc_private.set_contact(phone); $$;
revoke all on function kc_private.set_contact(text),public.kc_set_contact(text) from public,anon,authenticated;
grant execute on function kc_private.set_contact(text),public.kc_set_contact(text) to authenticated;

create function public.kc_advanced_progress() returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if not public.kc_has_capability('advanced_analysis') then raise exception 'Premium Plus required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(s)) from (
    select category,count(*) as attempts,round(avg(score)) as average,
      count(*) filter(where score>=80) as strong_answers
    from public.kc_attempts where user_id=auth.uid() group by category order by avg(score)
  ) s),'[]'::jsonb);
end; $$;
revoke all on function public.kc_advanced_progress() from public,anon,authenticated;
grant execute on function public.kc_advanced_progress() to authenticated;
commit;
