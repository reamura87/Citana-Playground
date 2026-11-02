CREATE TABLE "public"."suara_episode" (
  "episode_id"  uuid NOT NULL,
  CONSTRAINT "suara_episode_episode_id_fkey" FOREIGN KEY (episode_id) REFERENCES public.satua_episode(id) ON DELETE CASCADE,
  "pengguna_id" uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "suara_episode_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "suara_episode_pkey" PRIMARY KEY (episode_id, pengguna_id)
);

ALTER TABLE "public"."suara_episode"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER suara_episode_hitung
  AFTER INSERT OR DELETE ON public.suara_episode
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_suara_episode();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_episode" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_episode" TO "service_role";

CREATE POLICY "baca upvote episode sendiri" ON "public"."suara_episode"
  FOR SELECT
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "beri upvote episode" ON "public"."suara_episode"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((pengguna_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.satua_episode e
     JOIN public.satua s ON ((s.id = e.satua_id)))
  WHERE ((e.id = suara_episode.episode_id) AND e.terbit AND s.terbit AND (s.jenis = 'serial'::text) AND (s.penulis_id <> auth.uid()))))));

CREATE POLICY "cabut upvote episode" ON "public"."suara_episode"
  FOR DELETE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

REVOKE ALL ON TABLE "public"."suara_episode" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_episode" TO "postgres";
