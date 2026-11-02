CREATE POLICY "admin hapus gambar" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'gambar'::text) AND public.is_admin()));

CREATE POLICY "admin unggah gambar" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'gambar'::text) AND public.is_admin()));

CREATE POLICY "anggota unggah avatar sendiri" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'avatar'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "anggota unggah karya ke folder sendiri" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'karya'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "anggota unggah ke folder sendiri" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'forum'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "hapus avatar sendiri atau admin" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'avatar'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR public.is_admin())));

CREATE POLICY "hapus file forum sendiri atau admin" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'forum'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR public.is_admin())));

CREATE POLICY "hapus file karya sendiri atau admin" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'karya'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR public.is_admin())));
