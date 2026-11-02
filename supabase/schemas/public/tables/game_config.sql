CREATE TABLE "public"."game_config" (
  "kunci" text  NOT NULL,
  "nilai" jsonb NOT NULL,
  CONSTRAINT "game_config_pkey" PRIMARY KEY (kunci)
);

ALTER TABLE "public"."game_config"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca config" ON "public"."game_config"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_config" TO "service_role";

REVOKE ALL ON TABLE "public"."game_config" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_config" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_config" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_config" TO "postgres";

REVOKE ALL ON TABLE "public"."game_config" FROM "anon";
