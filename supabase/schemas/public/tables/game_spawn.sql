CREATE TABLE "public"."game_spawn" (
  "id"              integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "musuh_id"        text                     NOT NULL,
  "jenis"           text                     NOT NULL,
  "rute"            integer                  NOT NULL DEFAULT '-1'::integer,
  "fase"            real                     NOT NULL DEFAULT 0,
  "hp"              integer                  NOT NULL,
  "siklus"          integer                  NOT NULL DEFAULT 1,
  "mati_pada"       timestamp with time zone,
  "hidup_lagi_pada" timestamp with time zone,
  CONSTRAINT "game_spawn_fase_check" CHECK (((fase >= (0)::double precision) AND (fase < (1)::double precision))),
  CONSTRAINT "game_spawn_hp_check" CHECK ((hp >= 0)),
  CONSTRAINT "game_spawn_jenis_check" CHECK ((jenis = ANY (ARRAY['kroco'::text, 'medium'::text, 'bos'::text]))),
  CONSTRAINT "game_spawn_musuh_id_fkey" FOREIGN KEY (musuh_id) REFERENCES public.game_musuh(id),
  CONSTRAINT "game_spawn_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_spawn"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX game_spawn_satu_bos ON public.game_spawn USING btree ((true))
  WHERE (jenis = 'bos'::text);

REVOKE ALL ON SEQUENCE "public"."game_spawn_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_spawn_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."game_spawn_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_spawn_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."game_spawn_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_spawn_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."game_spawn_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."game_spawn_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_spawn" TO "service_role";

REVOKE ALL ON TABLE "public"."game_spawn" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_spawn" TO "postgres";

REVOKE ALL ON TABLE "public"."game_spawn" FROM "anon", "authenticated";
