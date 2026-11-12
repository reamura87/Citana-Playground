CREATE TABLE "public"."game_alat" (
  "item_id"          text    NOT NULL,
  "jenis"            text    NOT NULL,
  "tier"             integer NOT NULL,
  "kecepatan_persen" integer NOT NULL,
  "syarat_level"     integer NOT NULL DEFAULT 1,
  "syarat_jumlah"    integer NOT NULL DEFAULT 0,
  CONSTRAINT "game_alat_jenis_check" CHECK ((jenis = ANY (ARRAY['beliung'::text, 'sabit'::text]))),
  CONSTRAINT "game_alat_kecepatan_persen_check" CHECK (((kecepatan_persen >= 0) AND (kecepatan_persen <= 80))),
  CONSTRAINT "game_alat_pkey" PRIMARY KEY (item_id),
  CONSTRAINT "game_alat_tier_check" CHECK (((tier >= 1) AND (tier <= 6))),
  CONSTRAINT "game_alat_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.game_item(id)
);

ALTER TABLE "public"."game_alat"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca alat" ON "public"."game_alat"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_alat" TO "service_role";

REVOKE ALL ON TABLE "public"."game_alat" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_alat" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_alat" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_alat" TO "postgres";

REVOKE ALL ON TABLE "public"."game_alat" FROM "anon";
