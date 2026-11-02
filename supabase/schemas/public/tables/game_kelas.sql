CREATE TABLE "public"."game_kelas" (
  "id"              text    NOT NULL,
  "nama"            text    NOT NULL,
  "deskripsi"       text    NOT NULL,
  "damage_persen"   integer NOT NULL DEFAULT 100,
  "jeda_tambah_ms"  integer NOT NULL DEFAULT 0,
  "diterima_persen" integer NOT NULL DEFAULT 100,
  "def_bonus"       integer NOT NULL DEFAULT 0,
  "jangkauan"       integer NOT NULL DEFAULT 54,
  "senjata_awal"    text    NOT NULL,
  CONSTRAINT "game_kelas_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_kelas"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca kelas" ON "public"."game_kelas"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_kelas" TO "service_role";

REVOKE ALL ON TABLE "public"."game_kelas" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_kelas" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_kelas" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_kelas" TO "postgres";

REVOKE ALL ON TABLE "public"."game_kelas" FROM "anon";
