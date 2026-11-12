CREATE TABLE "public"."seni_rupa" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "nama"            text                     NOT NULL,
  "kategori"        text                     NOT NULL DEFAULT 'Umum'::text,
  "gambar_url"      text                     NOT NULL,
  "asal"            text                     NOT NULL,
  "pembuat_nama"    text                     NOT NULL,
  "dibuat_pada"     timestamp with time zone NOT NULL DEFAULT now(),
  "diperbarui_pada" timestamp with time zone NOT NULL DEFAULT now(),
  "skor"            integer                  NOT NULL DEFAULT 0,
  "jumlah_komentar" integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "seni_rupa_asal_check" CHECK ((asal = ANY (ARRAY['lukis'::text, 'unggah'::text]))),
  CONSTRAINT "seni_rupa_kategori_panjang" CHECK (((char_length(kategori) >= 1) AND (char_length(kategori) <= 40))),
  CONSTRAINT "seni_rupa_nama_panjang" CHECK (((char_length(nama) >= 1) AND (char_length(nama) <= 100))),
  CONSTRAINT "seni_rupa_pkey" PRIMARY KEY (id),
  "pembuat_id"      uuid                     DEFAULT auth.uid(),
  CONSTRAINT "seni_rupa_pembuat_id_fkey" FOREIGN KEY (pembuat_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE "public"."seni_rupa"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER seni_rupa_isi_pembuat
  BEFORE INSERT ON public.seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_pembuat();

CREATE TRIGGER seni_rupa_kunci_pembuat
  BEFORE UPDATE ON public.seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.kunci_pembuat();

CREATE POLICY "publik baca seni rupa" ON "public"."seni_rupa"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seni_rupa" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seni_rupa" TO "service_role";

CREATE POLICY "anggota tambah seni rupa" ON "public"."seni_rupa"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((pembuat_id = auth.uid()));

CREATE POLICY "pembuat atau admin hapus" ON "public"."seni_rupa"
  FOR DELETE
  TO "authenticated"
  USING (((pembuat_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "pembuat ubah" ON "public"."seni_rupa"
  FOR UPDATE
  TO "authenticated"
  USING ((pembuat_id = auth.uid()))
  WITH CHECK ((pembuat_id = auth.uid()));

REVOKE ALL ON TABLE "public"."seni_rupa" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seni_rupa" TO "postgres";
