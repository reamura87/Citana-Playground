CREATE TABLE "public"."game_forage_titik" (
  "id"        integer NOT NULL,
  "forage_id" text    NOT NULL,
  CONSTRAINT "game_forage_titik_forage_id_fkey" FOREIGN KEY (forage_id) REFERENCES public.game_forage(id),
  CONSTRAINT "game_forage_titik_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_forage_titik"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage_titik" TO "service_role";

REVOKE ALL ON TABLE "public"."game_forage_titik" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_forage_titik" TO "postgres";

REVOKE ALL ON TABLE "public"."game_forage_titik" FROM "anon", "authenticated";
