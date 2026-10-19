begin;
-- Change only the existing trusted RPC: no broad table grants or new policies.
create or replace function kc_private.set_contact(phone text) returns void
language plpgsql security definer set search_path='' as $$
declare previous_phone text;
begin
  if not kc_private.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  select whatsapp into strict previous_phone from public.kc_settings where id for update;
  update public.kc_settings set whatsapp=phone where id;
  insert into kc_private.audit(actor_id,action,target,details)
    values(auth.uid(),'contact','settings',jsonb_build_object('previous_whatsapp',previous_phone,'whatsapp',phone));
end; $$;
revoke all on function kc_private.set_contact(text) from public,anon,authenticated;
grant execute on function kc_private.set_contact(text) to authenticated;
commit;
