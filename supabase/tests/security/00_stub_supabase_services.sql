-- HANYA UNTUK TEST LOKAL. Image supabase/postgres tidak membuat objek milik
-- layanan Storage dan Realtime (dibuat oleh service masing-masing). Stub minimal
-- ini meniru struktur yang dipakai skema Citana agar export bisa dimuat.
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;

create table if not exists realtime.messages (
  id bigserial primary key,
  topic text not null,
  extension text not null,
  payload jsonb,
  event text,
  private boolean default false,
  inserted_at timestamptz default now()
);
alter table realtime.messages enable row level security;
create or replace function realtime.topic() returns text
  language sql stable as $$ select nullif(current_setting('realtime.topic', true), '')::text $$;
grant usage on schema realtime to anon, authenticated;
grant select, insert on realtime.messages to anon, authenticated;

insert into storage.buckets (id, name, public) values
  ('avatar','avatar',true), ('forum','forum',true), ('karya','karya',true), ('gambar','gambar',true)
on conflict do nothing;
