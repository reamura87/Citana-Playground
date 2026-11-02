CREATE TABLE "public"."game_quest" (
  "id"        text    NOT NULL,
  "npc"       text    NOT NULL,
  "jenis"     text    NOT NULL,
  "target"    text    NOT NULL,
  "judul"     text    NOT NULL,
  "jumlah"    integer NOT NULL,
  "min_level" integer NOT NULL DEFAULT 1,
  "xp"        integer NOT NULL DEFAULT 0,
  "gold"      integer NOT NULL DEFAULT 0,
  "aktif"     boolean NOT NULL DEFAULT true,
  CONSTRAINT "game_quest_gold_check" CHECK ((gold >= 0)),
  CONSTRAINT "game_quest_jenis_check" CHECK ((jenis = ANY (ARRAY['bunuh'::text, 'kumpul'::text]))),
  CONSTRAINT "game_quest_jumlah_check" CHECK ((jumlah > 0)),
  CONSTRAINT "game_quest_npc_check" CHECK ((npc = ANY (ARRAY['kapten'::text, 'herbalis'::text]))),
  CONSTRAINT "game_quest_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_quest_xp_check" CHECK ((xp >= 0))
);

ALTER TABLE "public"."game_quest"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_quest" TO "service_role";

REVOKE ALL ON TABLE "public"."game_quest" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_quest" TO "postgres";

REVOKE ALL ON TABLE "public"."game_quest" FROM "anon", "authenticated";
