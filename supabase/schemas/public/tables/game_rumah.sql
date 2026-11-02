CREATE TABLE "public"."game_rumah" (
  "pemain_id" uuid    NOT NULL,
  "level"     integer NOT NULL DEFAULT 1,
  CONSTRAINT "game_rumah_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE,
  CONSTRAINT "game_rumah_pkey" PRIMARY KEY (pemain_id),
  CONSTRAINT "game_rumah_level_fkey" FOREIGN KEY (level) REFERENCES public.game_rumah_level(level)
);

ALTER TABLE "public"."game_rumah"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_rumah" TO "service_role";

REVOKE ALL ON TABLE "public"."game_rumah" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_rumah" TO "postgres";

REVOKE ALL ON TABLE "public"."game_rumah" FROM "anon", "authenticated";
