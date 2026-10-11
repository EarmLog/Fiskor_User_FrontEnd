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

// ------------------------------------------------------------
// Utilidades de archivos (subir y descargar)
// ------------------------------------------------------------

// Sube una imagen (logo, sello o firma) de una empresa.
export const subirImagenEmpresa = (empresaId, tipo, archivo) => {
  const datos = new FormData()
  datos.append('archivo', archivo)
  return api.post(`/empresa/${empresaId}/imagenes/${tipo}`, datos, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// Construye la URL publica de una imagen corporativa.
export const urlImagenEmpresa = (empresaId, tipo, marcaTiempo = '') => {
  if (!empresaId) return ''
  const sufijo = marcaTiempo ? `?t=${marcaTiempo}` : ''
  return `/api/empresa/${empresaId}/imagenes/${tipo}${sufijo}`
}

// Descarga un archivo generado por el backend (Excel/PDF/Word).
// Usamos el token de sesion en la cabecera y disparamos la descarga.
export const descargarArchivo = async (categoria, nombre, nombreDescarga) => {
  const respuesta = await api.get(`/descargas/${categoria}/${encodeURIComponent(nombre)}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([respuesta.data]))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreDescarga || nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL(url)
}