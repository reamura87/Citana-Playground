CREATE TABLE "public"."game_harian" (
  "pemain_id"      uuid                     NOT NULL,
  "tanggal"        date                     NOT NULL,
  "percobaan"      integer                  NOT NULL DEFAULT 0,
  "berhadiah"      integer                  NOT NULL DEFAULT 0,
  "xp_didapat"     integer                  NOT NULL DEFAULT 0,
  "gold_didapat"   integer                  NOT NULL DEFAULT 0,
  "terakhir_lawan" timestamp with time zone,
  "forage"         integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "game_harian_pkey" PRIMARY KEY (pemain_id, tanggal),
  CONSTRAINT "game_harian_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE
);

ALTER TABLE "public"."game_harian"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_harian" TO "service_role";

REVOKE ALL ON TABLE "public"."game_harian" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_harian" TO "postgres";

REVOKE ALL ON TABLE "public"."game_harian" FROM "anon", "authenticated";
