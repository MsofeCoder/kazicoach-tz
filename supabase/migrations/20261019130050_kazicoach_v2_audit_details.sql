begin;
alter table kc_private.audit add column details jsonb not null default '{}'::jsonb;
create function kc_private.audit_details() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.action='package' then
    select to_jsonb(p) into new.details from public.kc_packages p where id=new.target;
  elsif new.action='activate' then
    select jsonb_build_object('package_id',e.package_id,'starts_at',e.starts_at,'expires_at',e.expires_at)
      into new.details from public.kc_entitlements e where user_id=new.target::uuid;
  elsif new.action='moderate' then
    select jsonb_build_object('status',t.status) into new.details from public.kc_testimonials t where id=new.target::uuid;
  end if;
  new.details=coalesce(new.details,'{}'::jsonb);
  return new;
end; $$;
revoke all on function kc_private.audit_details() from public,anon,authenticated;
create trigger capture_audit_details before insert on kc_private.audit
  for each row execute function kc_private.audit_details();
-- The free trial is global even when either package is edited.
create function kc_private.propagate_trial_limit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.free_questions is distinct from old.free_questions then
    update public.kc_packages set free_questions=new.free_questions
      where id<>new.id and free_questions is distinct from new.free_questions;
  end if;
  return new;
end; $$;
revoke all on function kc_private.propagate_trial_limit() from public,anon,authenticated;
create trigger synchronize_trial_limit after update of free_questions on public.kc_packages
  for each row execute function kc_private.propagate_trial_limit();
commit;
