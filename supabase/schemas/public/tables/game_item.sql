CREATE TABLE "public"."game_item" (
  "id"         text    NOT NULL,
  "nama"       text    NOT NULL,
  "deskripsi"  text    NOT NULL DEFAULT ''::text,
  "kategori"   text    NOT NULL,
  "harga_beli" integer,
  "harga_jual" integer,
  "aktif"      boolean NOT NULL DEFAULT true,
  "attack"     integer,
  "defense"    integer,
  "pulih"      integer,
  "kelas"      text,
  CONSTRAINT "game_item_attack_check" CHECK (((attack IS NULL) OR (attack >= 0))),
  CONSTRAINT "game_item_defense_check" CHECK (((defense IS NULL) OR (defense >= 0))),
  CONSTRAINT "game_item_harga_beli_check" CHECK (((harga_beli IS NULL) OR (harga_beli >= 0))),
  CONSTRAINT "game_item_harga_jual_check" CHECK (((harga_jual IS NULL) OR (harga_jual >= 0))),
  CONSTRAINT "game_item_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_item_pulih_check" CHECK (((pulih IS NULL) OR (pulih >= 0))),
  CONSTRAINT "game_item_kelas_fkey" FOREIGN KEY (kelas) REFERENCES public.game_kelas(id)
);

ALTER TABLE "public"."game_item"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca item" ON "public"."game_item"
  FOR SELECT
  TO "authenticated"
  USING (aktif);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_item" TO "service_role";

REVOKE ALL ON TABLE "public"."game_item" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_item" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_item" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_item" TO "postgres";

REVOKE ALL ON TABLE "public"."game_item" FROM "anon";
