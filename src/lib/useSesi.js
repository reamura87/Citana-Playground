import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useSesi() {
  return useContext(AuthContext).sesi
}

export function useAuth() {
  return useContext(AuthContext)
}