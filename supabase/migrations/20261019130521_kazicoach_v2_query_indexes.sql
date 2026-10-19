begin;
-- Ownership predicates already use primary/unique indexes; cover recency reads too.
create index kc_attempts_owner_recency on public.kc_attempts(user_id,created_at desc);
create index kc_testimonials_approved_recency on public.kc_testimonials(created_at desc) where status='approved';
create index kc_entitlements_package on public.kc_entitlements(package_id);
commit;
