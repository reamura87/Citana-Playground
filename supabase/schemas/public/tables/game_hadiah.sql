CREATE TABLE "public"."game_hadiah" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "pengirim_id"     uuid                     NOT NULL,
  "penerima_id"     uuid                     NOT NULL,
  "item_id"         text                     NOT NULL,
  "jumlah"          integer                  NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'menunggu'::text,
  "dibuat_pada"     timestamp with time zone NOT NULL DEFAULT now(),
  "kadaluarsa_pada" timestamp with time zone NOT NULL DEFAULT (now() + '00:15:00'::interval),
  "selesai_pada"    timestamp with time zone,
  CONSTRAINT "game_hadiah_jumlah_check" CHECK (((jumlah >= 1) AND (jumlah <= 99))),
  CONSTRAINT "game_hadiah_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_hadiah_status_check" CHECK ((status = ANY (ARRAY['menunggu'::text, 'diambil'::text, 'ditolak'::text, 'dibatalkan'::text, 'kedaluwarsa'::text]))),
  CONSTRAINT "game_hadiah_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.game_item(id),
  CONSTRAINT "game_hadiah_penerima_id_fkey" FOREIGN KEY (penerima_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE,
  CONSTRAINT "game_hadiah_pengirim_id_fkey" FOREIGN KEY (pengirim_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE
);

ALTER TABLE "public"."game_hadiah"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX game_hadiah_penerima_id_status_idx ON public.game_hadiah USING btree (penerima_id, status);

CREATE INDEX game_hadiah_pengirim_id_status_idx ON public.game_hadiah USING btree (pengirim_id, status);

CREATE POLICY "peserta baca hadiah" ON "public"."game_hadiah"
  FOR SELECT
  TO "authenticated"
  USING (((pengirim_id = auth.uid()) OR (penerima_id = auth.uid())));

REVOKE ALL ON SEQUENCE "public"."game_hadiah_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_hadiah_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."game_hadiah_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_hadiah_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."game_hadiah_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_hadiah_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."game_hadiah_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_hadiah_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_hadiah" TO "service_role";

REVOKE ALL ON TABLE "public"."game_hadiah" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_hadiah" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_hadiah" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_hadiah" TO "postgres";

REVOKE ALL ON TABLE "public"."game_hadiah" FROM "anon";
