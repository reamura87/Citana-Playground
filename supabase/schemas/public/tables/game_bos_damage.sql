CREATE TABLE "public"."game_bos_damage" (
  "spawn_id"  integer NOT NULL,
  "siklus"    integer NOT NULL,
  "pemain_id" uuid    NOT NULL,
  "damage"    integer NOT NULL DEFAULT 0,
  CONSTRAINT "game_bos_damage_damage_check" CHECK ((damage >= 0)),
  CONSTRAINT "game_bos_damage_pkey" PRIMARY KEY (spawn_id, siklus, pemain_id),
  CONSTRAINT "game_bos_damage_pemain_id_fkey" FOREIGN KEY (pemain_id) REFERENCES public.game_pemain(id) ON DELETE CASCADE,
  CONSTRAINT "game_bos_damage_spawn_id_fkey" FOREIGN KEY (spawn_id) REFERENCES public.game_spawn(id) ON DELETE CASCADE
);

ALTER TABLE "public"."game_bos_damage"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_bos_damage" TO "service_role";

REVOKE ALL ON TABLE "public"."game_bos_damage" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_bos_damage" TO "postgres";

REVOKE ALL ON TABLE "public"."game_bos_damage" FROM "anon", "authenticated";
