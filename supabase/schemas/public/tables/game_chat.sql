CREATE TABLE "public"."game_chat" (
  "id"            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "penulis_id"    uuid                     NOT NULL,
  "penulis_nama"  text                     NOT NULL,
  "isi"           text                     NOT NULL,
  "dibuat_pada"   timestamp with time zone NOT NULL DEFAULT now(),
  "penerima_id"   uuid,
  "penerima_nama" text,
  "jenis"         text                     NOT NULL DEFAULT 'teks'::text,
  "hadiah_id"     bigint,
  CONSTRAINT "game_chat_isi_check" CHECK (((char_length(isi) >= 1) AND (char_length(isi) <= 300))),
  CONSTRAINT "game_chat_jenis_check" CHECK ((jenis = ANY (ARRAY['teks'::text, 'hadiah'::text, 'sistem'::text]))),
  CONSTRAINT "game_chat_penerima_id_fkey" FOREIGN KEY (penerima_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "game_chat_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "game_chat_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_chat"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX game_chat_penerima_id_id_idx ON public.game_chat USING btree (penerima_id, id);

CREATE TRIGGER game_chat_tolak_spam
  BEFORE INSERT ON public.game_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_teks();

CREATE POLICY "admin hapus chat game" ON "public"."game_chat"
  FOR DELETE
  TO "authenticated"
  USING ((public.is_admin() AND (penerima_id IS NULL)));

CREATE POLICY "baca chat game" ON "public"."game_chat"
  FOR SELECT
  TO "authenticated"
  USING (((penerima_id IS NULL) OR (penerima_id = auth.uid()) OR (penulis_id = auth.uid())));

REVOKE ALL ON SEQUENCE "public"."game_chat_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_chat_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."game_chat_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_chat_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."game_chat_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_chat_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."game_chat_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_chat_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_chat" TO "service_role";

REVOKE ALL ON TABLE "public"."game_chat" FROM "authenticated";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_chat" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_chat" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_chat" TO "postgres";

REVOKE ALL ON TABLE "public"."game_chat" FROM "anon";
