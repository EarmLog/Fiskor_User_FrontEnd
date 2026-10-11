// ============================================================
// Cliente HTTP para comunicarse con el backend de Flask.
// Todo viaja por /api (Vite lo redirige al puerto 5050).
// ============================================================
import axios from 'axios'

// Exportamos el token para poder usarlo en las descargas de archivos.
export const guardarToken = (token) => localStorage.setItem('fiskor_token', token)
export const leerToken = () => localStorage.getItem('fiskor_token') || null
export const limpiarToken = () => localStorage.removeItem('fiskor_token')
export const guardarUsuario = (usuario) => localStorage.setItem('fiskor_usuario', JSON.stringify(usuario))
export const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem('fiskor_usuario') || 'null')
  } catch {
    return null
  }
}
export const limpiarUsuario = () => localStorage.removeItem('fiskor_usuario')

// Instancia base de axios.
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Adjuntamos el token a cada peticion.
api.interceptors.request.use((config) => {
  const token = leerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expiro o no sirve, limpiamos y marcamos para redirigir.
export const alVencerSesion = () => {
  limpiarToken()
  limpiarUsuario()
  window.location.href = '/login'
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response) {
      const estado = error.response.status
      const mensaje = error.response.data?.mensaje
      if (estado === 401 && !error.config.url.includes('/auth/login')) {
        alVencerSesion()
      }
      error.mensaje = mensaje || `Error ${estado}: ${error.response.statusText}`
    } else {
      error.mensaje = 'No se pudo conectar con el servidor'
    }
    return Promise.reject(error)
  },
)