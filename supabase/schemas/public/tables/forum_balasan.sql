CREATE TABLE "public"."forum_balasan" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "post_id"      uuid                     NOT NULL,
  "penulis_nama" text                     NOT NULL,
  "isi"          text                     NOT NULL,
  "gambar_url"   text,
  "skor"         integer                  NOT NULL DEFAULT 0,
  "dibuat_pada"  timestamp with time zone NOT NULL DEFAULT now(),
  "induk_id"     uuid,
  CONSTRAINT "forum_balasan_isi_check" CHECK (((char_length(isi) >= 1) AND (char_length(isi) <= 1000))),
  CONSTRAINT "forum_balasan_pkey" PRIMARY KEY (id),
  CONSTRAINT "forum_balasan_induk_id_fkey" FOREIGN KEY (induk_id) REFERENCES public.forum_balasan(id) ON DELETE CASCADE,
  CONSTRAINT "forum_balasan_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.forum_post(id) ON DELETE CASCADE,
  "penulis_id"   uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "forum_balasan_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."forum_balasan"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX forum_balasan_induk_id_idx ON public.forum_balasan USING btree (induk_id);

CREATE INDEX forum_balasan_post_id_dibuat_pada_idx ON public.forum_balasan USING btree (post_id, dibuat_pada);

CREATE TRIGGER balasan_hitung
  AFTER INSERT OR DELETE ON public.forum_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_balasan();

CREATE TRIGGER balasan_isi_penulis
  BEFORE INSERT ON public.forum_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_penulis();

CREATE TRIGGER balasan_notifikasi
  AFTER INSERT ON public.forum_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.buat_notifikasi_balasan();

CREATE TRIGGER balasan_periksa_induk
  BEFORE INSERT ON public.forum_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.periksa_induk();

CREATE TRIGGER forum_balasan_tolak_spam
  BEFORE INSERT ON public.forum_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_teks();

CREATE POLICY "publik baca balasan" ON "public"."forum_balasan"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_balasan" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_balasan" TO "service_role";

CREATE POLICY "anggota tulis balasan" ON "public"."forum_balasan"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((penulis_id = auth.uid()));

CREATE POLICY "hapus balasan sendiri atau admin" ON "public"."forum_balasan"
  FOR DELETE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) OR public.is_admin()));

REVOKE ALL ON TABLE "public"."forum_balasan" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_balasan" TO "postgres";
