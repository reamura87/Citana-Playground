-- F-06: gambar_url forum tidak divalidasi di server.
-- F-14: pengguna dapat memberi suara pada post/balasannya sendiri.

create or replace function public.url_storage_milik(p_bucket text, p_uid uuid, p_url text)
  returns boolean
  language sql
  immutable
  set search_path = public
as $$
  select p_url is not null and p_uid is not null
     and starts_with(p_url, 'https://aedgrgqmeijaljoperzv.supabase.co/storage/v1/object/public/'
                            || p_bucket || '/' || p_uid::text || '/')
     and position('..' in p_url) = 0
     and p_url !~ '[[:space:]"''<>\]'
$$;
revoke all on function public.url_storage_milik(text, uuid, text) from public, anon;
grant execute on function public.url_storage_milik(text, uuid, text) to authenticated, service_role;

create or replace function public.isi_penulis()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare nama text; jumlah int;
begin
  select username into nama from profil where id = auth.uid();
  if nama is null then
    raise exception 'Akun belum punya username';
  end if;
  select (select count(*) from forum_post
            where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour')
       + (select count(*) from forum_balasan
            where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour')
    into jumlah;
  if jumlah >= 20 and not is_admin() then
    raise exception 'Terlalu banyak kiriman. Coba lagi nanti.';
  end if;
  -- F-06: gambar harus berasal dari folder milik penulis di bucket forum
  if new.gambar_url is not null and not url_storage_milik('forum', auth.uid(), new.gambar_url) then
    raise exception 'Gambar harus diunggah lewat situs ini';
  end if;
  new := jsonb_populate_record(new, jsonb_build_object(
    'penulis_id', auth.uid(), 'penulis_nama', nama,
    'skor', 0, 'jumlah_balasan', 0, 'dibuat_pada', now()));
  return new;
end $function$;
revoke all on function public.isi_penulis() from public, anon, authenticated;

-- Avatar: tolak juga path traversal
create or replace function public.ganti_avatar(p_url text)
  returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Harus masuk dulu';
  end if;
  if p_url is not null and not url_storage_milik('avatar', auth.uid(), p_url) then
    raise exception 'Alamat foto tidak valid';
  end if;
  update profil set avatar_url = p_url where id = auth.uid();
end $function$;
revoke all on function public.ganti_avatar(text) from public, anon;
grant execute on function public.ganti_avatar(text) to authenticated, service_role;

-- F-14: tidak boleh memberi suara pada tulisan sendiri (konsisten dengan suara_satua/seni_rupa)
drop policy if exists "beri suara" on public.suara_post;
create policy "beri suara" on public.suara_post
  for insert to authenticated
  with check (pengguna_id = auth.uid() and exists (
    select 1 from public.forum_post p where p.id = suara_post.post_id and p.penulis_id <> auth.uid()));

drop policy if exists "ubah suara" on public.suara_post;
create policy "ubah suara" on public.suara_post
  for update to authenticated
  using (pengguna_id = auth.uid())
  with check (pengguna_id = auth.uid() and exists (
    select 1 from public.forum_post p where p.id = suara_post.post_id and p.penulis_id <> auth.uid()));

drop policy if exists "beri suara balasan" on public.suara_balasan;
create policy "beri suara balasan" on public.suara_balasan
  for insert to authenticated
  with check (pengguna_id = auth.uid() and exists (
    select 1 from public.forum_balasan b where b.id = suara_balasan.balasan_id and b.penulis_id <> auth.uid()));

drop policy if exists "ubah suara balasan" on public.suara_balasan;
create policy "ubah suara balasan" on public.suara_balasan
  for update to authenticated
  using (pengguna_id = auth.uid())
  with check (pengguna_id = auth.uid() and exists (
    select 1 from public.forum_balasan b where b.id = suara_balasan.balasan_id and b.penulis_id <> auth.uid()));
