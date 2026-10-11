// ============================================================
// Vista publica: solicitar recuperacion de contrasena.
// Envia un enlace con token temporal al correo del usuario.
// ============================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'

import { api } from '../services/api'
import PublicShell from '../components/PublicShell'
import { Alerta, Boton, Entrada } from '../components/ui'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enlace, setEnlace] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setEnlace('')
    if (!email) {
      setError('Indique su correo electronico')
      return
    }
    setCargando(true)
    try {
      const { data } = await api.post('/auth/recuperar', { email })
      setMensaje(data.mensaje)
      // En desarrollo sin correo configurado, el backend devuelve el enlace.
      if (data.datos?.enlace) setEnlace(data.datos.enlace)
    } catch (err) {
      setError(err.mensaje || 'No se pudo procesar la solicitud')
    } finally {
      setCargando(false)
    }
  }

  return (
    <PublicShell titulo="Recuperar contrasena" subtitulo="Te enviaremos un enlace para crear una nueva">
      {error && <div className="mb-4"><Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta></div>}
      {mensaje && <div className="mb-4"><Alerta tipo="exito">{mensaje}</Alerta></div>}
      {enlace && (
        <div className="mb-4">
          <Alerta tipo="aviso">
            No hay correo configurado en este equipo. Usa este enlace para continuar:
            <a href={enlace} className="ml-1 break-all font-medium text-marca-600 underline">{enlace}</a>
          </Alerta>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-4">
        <Entrada
          etiqueta="Correo electronico"
          icono={Mail}
          type="email"
          placeholder="tu@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </Boton>
      </form>

      <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-marca-600">
        <ArrowLeft size={14} /> Volver al inicio de sesion
      </Link>
    </PublicShell>
  )
}
