CREATE TABLE "public"."game_rumah_level" (
  "level"        integer NOT NULL,
  "biaya_gold"   integer NOT NULL,
  "jumlah_petak" integer NOT NULL,
  CONSTRAINT "game_rumah_level_biaya_gold_check" CHECK ((biaya_gold >= 0)),
  CONSTRAINT "game_rumah_level_jumlah_petak_check" CHECK ((jumlah_petak > 0)),
  CONSTRAINT "game_rumah_level_pkey" PRIMARY KEY (level)
);

ALTER TABLE "public"."game_rumah_level"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca level rumah" ON "public"."game_rumah_level"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_rumah_level" TO "service_role";

REVOKE ALL ON TABLE "public"."game_rumah_level" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_rumah_level" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_rumah_level" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_rumah_level" TO "postgres";

REVOKE ALL ON TABLE "public"."game_rumah_level" FROM "anon";
