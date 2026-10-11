// ============================================================
// Estado global de la sesion (autenticacion y roles).
// Guardamos el usuario en localStorage para que la sesion
// sobreviva al cerrar el navegador (no hay que loguearse a cada rato).
// ============================================================
import { createContext, useContext, useState, useCallback, useMemo } from 'react'

import {
  api,
  guardarToken,
  guardarUsuario,
  leerToken,
  leerUsuario,
  limpiarToken,
  limpiarUsuario,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => leerToken())
  const [usuario, setUsuario] = useState(() => leerUsuario())

  // Intentamos conservar la sesion si ya existia un token guardado.
  const cargarPerfil = useCallback(async () => {
    if (!leerToken()) return
    try {
      const { data } = await api.get('/auth/perfil')
      if (data.exito) {
        setUsuario(data.datos)
        guardarUsuario(data.datos)
      }
    } catch {
      // Si falla (sin internet), seguimos con lo guardado.
    }
  }, [])

  const iniciarSesion = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (!data.exito) throw new Error(data.mensaje)
    guardarToken(data.datos.token)
    guardarUsuario(data.datos.usuario)
    setToken(data.datos.token)
    setUsuario(data.datos.usuario)
    return data.datos.usuario
  }, [])

  const cerrarSesion = useCallback(() => {
    limpiarToken()
    limpiarUsuario()
    setToken(null)
    setUsuario(null)
  }, [])

  const rol = usuario?.rol || 'Cajero'
  const esAdmin = rol === 'Administrador'
  const puede = useCallback((...roles) => roles.includes(rol), [rol])

  const valor = useMemo(
    () => ({ usuario, token, rol, esAdmin, puede, iniciarSesion, cerrarSesion, cargarPerfil }),
    [usuario, token, rol, esAdmin, puede, iniciarSesion, cerrarSesion, cargarPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)