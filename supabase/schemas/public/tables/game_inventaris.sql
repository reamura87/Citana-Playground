CREATE TABLE "public"."game_inventaris" (
  "pemain_id" uuid    NOT NULL,
  "item_id"   text    NOT NULL,
  "jumlah"    integer NOT NULL,
  CONSTRAINT "game_inventaris_jumlah_check" CHECK ((jumlah >= 0)),
  CONSTRAINT "game_inventaris_pkey" PRIMARY KEY (pemain_id, item_id),
  CONSTRAINT "game_inventaris_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.game_item(id),
  CONSTRAINT "game_inventaris_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE
);

ALTER TABLE "public"."game_inventaris"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_inventaris" TO "service_role";

REVOKE ALL ON TABLE "public"."game_inventaris" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_inventaris" TO "postgres";

REVOKE ALL ON TABLE "public"."game_inventaris" FROM "anon", "authenticated";
