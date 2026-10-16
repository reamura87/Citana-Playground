import { createContext } from 'react'

export const AuthContext = createContext({
  sesi: undefined,
  profil: null,
  memuatProfil: true,
  segarkanProfil: async () => {},
})