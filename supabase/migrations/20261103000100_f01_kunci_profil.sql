-- F-01 (CRITICAL): view profil_publik dapat ditulis anon/authenticated dan, karena tidak
-- security_invoker, melewati RLS profil. Penyerang dapat menghapus/mengganti nama profil
-- siapa pun dan menukar id baris admin ke uid-nya sendiri (eskalasi admin).

-- 1. View hanya untuk dibaca.
revoke all on table public.profil_publik from anon, authenticated;
grant select on table public.profil_publik to anon, authenticated;

-- 2. Tabel profil: tidak ada policy tulis untuk klien, jadi cabut juga hak tulisnya.
--    Semua penulisan sah lewat fungsi SECURITY DEFINER (buat_profil, ganti_avatar).
revoke all on table public.profil from anon;
revoke insert, update, delete, truncate, trigger, references, maintain
  on table public.profil from authenticated;

-- 3. Pertahanan berlapis: tolak penulisan langsung oleh peran klien (termasuk lewat view,
--    karena current_user tetap peran pemanggil), dan larang perubahan id sama sekali.
--    Perubahan peran hanya oleh peran server (postgres / supabase_admin / service_role).
create or replace function public.kunci_profil()
  returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'Perubahan profil langsung tidak diizinkan';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'id profil tidak boleh diubah';
    end if;
    if new.peran is distinct from old.peran
       and current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'peran tidak boleh diubah';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

revoke all on function public.kunci_profil() from public, anon, authenticated;

drop trigger if exists profil_kunci on public.profil;
create trigger profil_kunci
  before insert or update or delete on public.profil
  for each row execute function public.kunci_profil();
