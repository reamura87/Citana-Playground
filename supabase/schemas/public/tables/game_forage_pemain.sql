CREATE TABLE "public"."game_forage_pemain" (
  "pemain_id" uuid                     NOT NULL,
  "titik_id"  integer                  NOT NULL,
  "siap_pada" timestamp with time zone NOT NULL,
  CONSTRAINT "game_forage_pemain_pkey" PRIMARY KEY (pemain_id, titik_id),
  CONSTRAINT "game_forage_pemain_titik_id_fkey" FOREIGN KEY (titik_id) REFERENCES public.game_forage_titik(id) ON DELETE CASCADE,
  CONSTRAINT "game_forage_pemain_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE
);

ALTER TABLE "public"."game_forage_pemain"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage_pemain" TO "service_role";

REVOKE ALL ON TABLE "public"."game_forage_pemain" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage_pemain" TO "postgres";

REVOKE ALL ON TABLE "public"."game_forage_pemain" FROM "anon", "authenticated";
