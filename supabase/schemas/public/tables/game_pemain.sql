CREATE TABLE "public"."game_pemain" (
  "id"               uuid                     NOT NULL,
  "level"            integer                  NOT NULL DEFAULT 1,
  "xp"               integer                  NOT NULL DEFAULT 0,
  "gold"             integer                  NOT NULL DEFAULT 0,
  "dibuat_pada"      timestamp with time zone NOT NULL DEFAULT now(),
  "diperbarui_pada"  timestamp with time zone NOT NULL DEFAULT now(),
  "terakhir_serang"  timestamp with time zone,
  "hp"               integer                  NOT NULL DEFAULT 60,
  "hp_waktu"         timestamp with time zone NOT NULL DEFAULT now(),
  "mati_sampai"      timestamp with time zone,
  "terakhir_terluka" timestamp with time zone,
  "poin_hp"          integer                  NOT NULL DEFAULT 0,
  "poin_speed"       integer                  NOT NULL DEFAULT 0,
  "poin_sisa"        integer                  NOT NULL DEFAULT 0,
  "senjata_id"       text,
  "armor_id"         text,
  "bisu_sampai"      timestamp with time zone,
  "forage_titik"     integer,
  "forage_selesai"   timestamp with time zone,
  "tambang_total"    integer                  NOT NULL DEFAULT 0,
  "tumbuhan_total"   integer                  NOT NULL DEFAULT 0,
  "kelas"            text                     NOT NULL DEFAULT 'ksatria'::text,
  "kelas_ganti"      integer                  NOT NULL DEFAULT 0,
  "kustom"           jsonb,
  "karakter_dibuat"  boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "game_pemain_armor_id_fkey" FOREIGN KEY (armor_id) REFERENCES public.game_item(id),
  CONSTRAINT "game_pemain_gold_check" CHECK ((gold >= 0)),
  CONSTRAINT "game_pemain_hp_check" CHECK ((hp >= 0)),
  CONSTRAINT "game_pemain_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "game_pemain_kelas_fkey" FOREIGN KEY (kelas) REFERENCES public.game_kelas(id),
  CONSTRAINT "game_pemain_level_check" CHECK ((level >= 1)),
  CONSTRAINT "game_pemain_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_pemain_poin_hp_check" CHECK ((poin_hp >= 0)),
  CONSTRAINT "game_pemain_poin_sisa_check" CHECK ((poin_sisa >= 0)),
  CONSTRAINT "game_pemain_poin_speed_check" CHECK (((poin_speed >= 0) AND (poin_speed <= 7))),
  CONSTRAINT "game_pemain_senjata_id_fkey" FOREIGN KEY (senjata_id) REFERENCES public.game_item(id),
  CONSTRAINT "game_pemain_xp_check" CHECK ((xp >= 0))
);

ALTER TABLE "public"."game_pemain"
  ENABLE ROW LEVEL SECURITY;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_pemain" TO "service_role";

REVOKE ALL ON TABLE "public"."game_pemain" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_pemain" TO "postgres";

REVOKE ALL ON TABLE "public"."game_pemain" FROM "anon", "authenticated";
