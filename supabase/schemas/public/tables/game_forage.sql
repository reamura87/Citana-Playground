CREATE TABLE "public"."game_forage" (
  "id"            text    NOT NULL,
  "nama"          text    NOT NULL,
  "jenis"         text    NOT NULL,
  "tier"          integer NOT NULL DEFAULT 0,
  "item_hasil"    text    NOT NULL,
  "jumlah_min"    integer NOT NULL DEFAULT 1,
  "jumlah_maks"   integer NOT NULL DEFAULT 1,
  "durasi_detik"  numeric NOT NULL,
  "respawn_detik" integer NOT NULL,
  "xp"            integer NOT NULL DEFAULT 0,
  "aktif"         boolean NOT NULL DEFAULT true,
  CONSTRAINT "game_forage_check" CHECK ((jumlah_maks >= jumlah_min)),
  CONSTRAINT "game_forage_durasi_detik_check" CHECK ((durasi_detik > (0)::numeric)),
  CONSTRAINT "game_forage_jenis_check" CHECK ((jenis = ANY (ARRAY['tumbuhan'::text, 'ore'::text]))),
  CONSTRAINT "game_forage_jumlah_min_check" CHECK ((jumlah_min >= 1)),
  CONSTRAINT "game_forage_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_forage_respawn_detik_check" CHECK ((respawn_detik > 0)),
  CONSTRAINT "game_forage_tier_check" CHECK (((tier >= 0) AND (tier <= 6))),
  CONSTRAINT "game_forage_xp_check" CHECK ((xp >= 0)),
  CONSTRAINT "game_forage_item_hasil_fkey" FOREIGN KEY (item_hasil) REFERENCES public.game_item(id)
);

ALTER TABLE "public"."game_forage"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca forage" ON "public"."game_forage"
  FOR SELECT
  TO "authenticated"
  USING (aktif);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage" TO "service_role";

REVOKE ALL ON TABLE "public"."game_forage" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_forage" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_forage" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage" TO "postgres";

REVOKE ALL ON TABLE "public"."game_forage" FROM "anon";
