CREATE TABLE "public"."game_quest_pemain" (
  "pemain_id" uuid    NOT NULL,
  "tanggal"   date    NOT NULL,
  "quest_id"  text    NOT NULL,
  "progres"   integer NOT NULL DEFAULT 0,
  "status"    text    NOT NULL DEFAULT 'aktif'::text,
  CONSTRAINT "game_quest_pemain_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE,
  CONSTRAINT "game_quest_pemain_pkey" PRIMARY KEY (pemain_id, tanggal, quest_id),
  CONSTRAINT "game_quest_pemain_progres_check" CHECK ((progres >= 0)),
  CONSTRAINT "game_quest_pemain_quest_id_fkey" FOREIGN KEY (quest_id) REFERENCES public.game_quest(id),
  CONSTRAINT "game_quest_pemain_status_check" CHECK ((status = ANY (ARRAY['aktif'::text, 'diambil'::text])))
);

ALTER TABLE "public"."game_quest_pemain"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_quest_pemain" TO "service_role";

REVOKE ALL ON TABLE "public"."game_quest_pemain" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_quest_pemain" TO "postgres";

REVOKE ALL ON TABLE "public"."game_quest_pemain" FROM "anon", "authenticated";
