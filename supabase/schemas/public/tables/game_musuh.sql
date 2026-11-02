CREATE TABLE "public"."game_musuh" (
  "id"            text    NOT NULL,
  "nama"          text    NOT NULL,
  "hp"            integer NOT NULL,
  "xp"            integer NOT NULL,
  "gold"          integer NOT NULL,
  "aktif"         boolean NOT NULL DEFAULT true,
  "jenis"         text    NOT NULL DEFAULT 'kroco'::text,
  "mayat_detik"   integer NOT NULL DEFAULT 20,
  "respawn_detik" integer NOT NULL DEFAULT 90,
  "serangan"      integer NOT NULL DEFAULT 3,
  CONSTRAINT "game_musuh_gold_check" CHECK ((gold >= 0)),
  CONSTRAINT "game_musuh_hp_check" CHECK ((hp > 0)),
  CONSTRAINT "game_musuh_jenis_check" CHECK ((jenis = ANY (ARRAY['kroco'::text, 'medium'::text, 'bos'::text]))),
  CONSTRAINT "game_musuh_mayat_detik_check" CHECK ((mayat_detik >= 0)),
  CONSTRAINT "game_musuh_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_musuh_respawn_detik_check" CHECK ((respawn_detik >= 0)),
  CONSTRAINT "game_musuh_serangan_check" CHECK ((serangan >= 0)),
  CONSTRAINT "game_musuh_xp_check" CHECK ((xp >= 0))
);

ALTER TABLE "public"."game_musuh"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca musuh" ON "public"."game_musuh"
  FOR SELECT
  TO "authenticated"
  USING (aktif);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_musuh" TO "service_role";

REVOKE ALL ON TABLE "public"."game_musuh" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_musuh" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_musuh" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_musuh" TO "postgres";

REVOKE ALL ON TABLE "public"."game_musuh" FROM "anon";
