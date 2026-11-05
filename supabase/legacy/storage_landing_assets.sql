-- Storage para imagens editáveis das landing pages.
-- Execute no SQL Editor do Supabase antes de usar o upload visual.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-assets',
  'landing-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read landing assets" on storage.objects;
drop policy if exists "Authenticated users can upload own landing assets" on storage.objects;
drop policy if exists "Authenticated users can update own landing assets" on storage.objects;
drop policy if exists "Authenticated users can delete own landing assets" on storage.objects;

create policy "Public can read landing assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'landing-assets');

create policy "Authenticated users can upload own landing assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'landing-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Authenticated users can update own landing assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'landing-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'landing-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Authenticated users can delete own landing assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'landing-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
