CREATE TABLE "public"."notifikasi" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "penerima_id" uuid                     NOT NULL,
  "pelaku_id"   uuid                     NOT NULL,
  "pelaku_nama" text                     NOT NULL,
  "jenis"       text                     NOT NULL,
  "post_id"     uuid                     NOT NULL,
  "balasan_id"  uuid,
  "sumber_id"   uuid                     NOT NULL,
  "cuplikan"    text                     NOT NULL,
  "dibaca"      boolean                  NOT NULL DEFAULT false,
  "dibuat_pada" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifikasi_balasan_id_fkey" FOREIGN KEY (balasan_id) REFERENCES public.forum_balasan(id) ON DELETE CASCADE,
  CONSTRAINT "notifikasi_jenis_check" CHECK ((jenis = ANY (ARRAY['balas'::text, 'balasan'::text, 'sebut'::text]))),
  CONSTRAINT "notifikasi_pelaku_id_fkey" FOREIGN KEY (pelaku_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "notifikasi_penerima_id_fkey" FOREIGN KEY (penerima_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "notifikasi_penerima_id_sumber_id_key" UNIQUE (penerima_id, sumber_id),
  CONSTRAINT "notifikasi_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifikasi_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.forum_post(id) ON DELETE CASCADE
);

ALTER TABLE "public"."notifikasi"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX notifikasi_penerima_id_dibuat_pada_idx ON public.notifikasi USING btree (penerima_id, dibuat_pada DESC);

CREATE POLICY "baca notifikasi sendiri" ON "public"."notifikasi"
  FOR SELECT
  TO "authenticated"
  USING ((penerima_id = auth.uid()));

CREATE POLICY "hapus notifikasi sendiri" ON "public"."notifikasi"
  FOR DELETE
  TO "authenticated"
  USING ((penerima_id = auth.uid()));

CREATE POLICY "ubah notifikasi sendiri" ON "public"."notifikasi"
  FOR UPDATE
  TO "authenticated"
  USING ((penerima_id = auth.uid()))
  WITH CHECK ((penerima_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifikasi" TO "anon";

REVOKE ALL ON TABLE "public"."notifikasi" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifikasi" TO "service_role";

REVOKE ALL ("dibaca") ON TABLE "public"."notifikasi" FROM "authenticated";

GRANT UPDATE ("dibaca") ON TABLE "public"."notifikasi" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."notifikasi" TO "authenticated";

REVOKE ALL ON TABLE "public"."notifikasi" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifikasi" TO "postgres";
