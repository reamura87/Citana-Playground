CREATE TABLE "public"."game_tanaman" (
  "id"           text    NOT NULL,
  "nama"         text    NOT NULL,
  "durasi_detik" integer NOT NULL,
  "bibit_item"   text    NOT NULL,
  "hasil_item"   text    NOT NULL,
  "hasil_jumlah" integer NOT NULL,
  "aktif"        boolean NOT NULL DEFAULT true,
  CONSTRAINT "game_tanaman_bibit_item_fkey" FOREIGN KEY (bibit_item) REFERENCES public.game_item(id),
  CONSTRAINT "game_tanaman_durasi_detik_check" CHECK ((durasi_detik > 0)),
  CONSTRAINT "game_tanaman_hasil_item_fkey" FOREIGN KEY (hasil_item) REFERENCES public.game_item(id),
  CONSTRAINT "game_tanaman_hasil_jumlah_check" CHECK ((hasil_jumlah > 0)),
  CONSTRAINT "game_tanaman_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_tanaman"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baca tanaman" ON "public"."game_tanaman"
  FOR SELECT
  TO "authenticated"
  USING (aktif);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_tanaman" TO "service_role";

REVOKE ALL ON TABLE "public"."game_tanaman" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."game_tanaman" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_tanaman" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_tanaman" TO "postgres";

REVOKE ALL ON TABLE "public"."game_tanaman" FROM "anon";
