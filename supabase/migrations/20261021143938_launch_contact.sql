begin;
-- Approved public business number. Never overwrite an administrator's later choice.
do $$
begin
  update public.kc_settings set whatsapp='255688010595' where id and whatsapp='';
  if found then
    insert into kc_private.audit(actor_id,action,target,details)
    values(null,'bootstrap_contact','settings','{"previous_whatsapp":"","whatsapp":"255688010595","source":"approved-launch-settings"}');
  end if;
end $$;
commit;
