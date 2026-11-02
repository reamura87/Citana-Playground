CREATE TABLE "public"."game_restart_log" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "pengguna_id" uuid                     NOT NULL,
  "waktu"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "game_restart_log_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "game_restart_log_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_restart_log"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SEQUENCE "public"."game_restart_log_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_restart_log_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."game_restart_log_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_restart_log_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."game_restart_log_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_restart_log_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."game_restart_log_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_restart_log_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_restart_log" TO "service_role";

REVOKE ALL ON TABLE "public"."game_restart_log" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_restart_log" TO "postgres";

REVOKE ALL ON TABLE "public"."game_restart_log" FROM "anon", "authenticated";
