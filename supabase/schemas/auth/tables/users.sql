CREATE TRIGGER pada_pendaftaran
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.buat_profil();
