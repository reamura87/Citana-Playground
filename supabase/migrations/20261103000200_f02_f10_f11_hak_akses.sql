-- F-02: hak tabel terlalu luas (TRUNCATE/TRIGGER/REFERENCES/MAINTAIN ke klien, hak tulis
--       ke anon tanpa policy) dan default privileges memberi ALL ke anon untuk objek baru.
-- F-10: fungsi SECURITY INVOKER tanpa search_path tetap.
-- F-11: fungsi trigger diberi EXECUTE ke PUBLIC/anon/authenticated.

do $$
declare r record;
begin
  -- Tabel & view publik: cabut hak yang tidak pernah dibutuhkan klien.
  for r in
    select c.oid::regclass as obj
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format('revoke truncate, trigger, references, maintain on %s from anon, authenticated', r.obj);
    -- Tidak ada satu pun policy INSERT/UPDATE/DELETE untuk anon.
    execute format('revoke insert, update, delete on %s from anon', r.obj);
  end loop;

  -- Sequence hanya dipakai fungsi SECURITY DEFINER (tabel game).
  for r in
    select c.oid::regclass as obj
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
  loop
    execute format('revoke all on sequence %s from anon, authenticated', r.obj);
  end loop;

  -- F-11: fungsi trigger tidak perlu EXECUTE untuk klien (trigger tetap berjalan).
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.fn);
  end loop;

  -- F-10: kunci search_path pada fungsi SECURITY INVOKER yang belum punya.
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and not p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public', r.fn);
  end loop;
end $$;

-- Objek baru tidak lagi otomatis terbuka untuk klien: grant harus eksplisit.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from public, anon, authenticated;
