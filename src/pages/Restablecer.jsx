// ============================================================
// Vista publica: restablecer contrasena con el token del correo.
// Lee ?token= y ?email= de la URL y valida antes de pedir la clave.
// ============================================================
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, BadgeCheck, CheckCircle2 } from 'lucide-react'

import { api } from '../services/api'
import PublicShell from '../components/PublicShell'
import { Alerta, Boton, Cargando, Entrada } from '../components/ui'

export default function Restablecer() {
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const token = parametros.get('token') || ''
  const email = parametros.get('email') || ''

  const [verificando, setVerificando] = useState(true)
  const [valido, setValido] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const verificar = async () => {
      if (!token || !email) {
        setVerificando(false)
        setValido(false)
        return
      }
      try {
        const { data } = await api.get('/auth/token-valido', { params: { token, email } })
        setValido(!!data.datos?.valido)
      } catch {
        setValido(false)
      } finally {
        setVerificando(false)
      }
    }
    verificar()
  }, [token, email])

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contrasenas no coinciden')
      return
    }
    setCargando(true)
    try {
      const { data } = await api.post('/auth/restablecer', { email, token, password })
      if (data.exito) {
        setListo(true)
        setTimeout(() => navegar('/login'), 2500)
      } else {
        setError(data.mensaje)
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo restablecer la contrasena')
    } finally {
      setCargando(false)
    }
  }

  if (verificando) {
    return (
      <PublicShell titulo="Verificando enlace...">
        <Cargando mensaje="Validando el enlace de recuperacion..." />
      </PublicShell>
    )
  }

  if (!valido || listo) {
    return (
      <PublicShell titulo={listo ? 'Contrasena actualizada' : 'Enlace no valido'}>
        {listo ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={44} />
            <p className="text-sm text-slate-600">Tu contrasena se cambio correctamente. Redirigiendo al inicio de sesion...</p>
            <Link to="/login" className="font-medium text-marca-600 hover:underline">Ir ahora</Link>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <Alerta tipo="error">El enlace es invalido o ya expiro. Solicita uno nuevo.</Alerta>
            <Link to="/recuperar" className="font-medium text-marca-600 hover:underline">Solicitar nuevo enlace</Link>
          </div>
        )}
      </PublicShell>
    )
  }

  return (
    <PublicShell titulo="Nueva contrasena" subtitulo={`Para ${email}`}>
      {error && <div className="mb-4"><Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta></div>}
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="etiqueta">Nueva contrasena</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="campo pl-9 pr-10"
              type={mostrarClave ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarClave((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Mostrar u ocultar contrasena"
            >
              {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Entrada
          etiqueta="Confirmar contrasena"
          icono={BadgeCheck}
          type={mostrarClave ? 'text' : 'password'}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
        />
        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Guardando...' : 'Cambiar contrasena'}
        </Boton>
      </form>
    </PublicShell>
  )
}
