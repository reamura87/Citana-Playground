CREATE TABLE "public"."game_petak" (
  "pemain_id"    uuid                     NOT NULL,
  "indeks"       integer                  NOT NULL,
  "tanaman_id"   text                     NOT NULL,
  "ditanam_pada" timestamp with time zone NOT NULL DEFAULT now(),
  "siap_pada"    timestamp with time zone NOT NULL,
  CONSTRAINT "game_petak_indeks_check" CHECK ((indeks >= 0)),
  CONSTRAINT "game_petak_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE,
  CONSTRAINT "game_petak_pkey" PRIMARY KEY (pemain_id, indeks),
  CONSTRAINT "game_petak_tanaman_id_fkey" FOREIGN KEY (tanaman_id) REFERENCES public.game_tanaman(id)
);

ALTER TABLE "public"."game_petak"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_petak" TO "service_role";

REVOKE ALL ON TABLE "public"."game_petak" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_petak" TO "postgres";

REVOKE ALL ON TABLE "public"."game_petak" FROM "anon", "authenticated";
