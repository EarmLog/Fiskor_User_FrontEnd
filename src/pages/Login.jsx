// ============================================================
// Vista publica: inicio de sesion.
// Navbar minimalista y tarjeta centrada con el formulario.
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { Alerta, Boton, Entrada } from '../components/ui'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Indique su correo y contrasena')
      return
    }
    setCargando(true)
    try {
      const usuario = await iniciarSesion(email, password)
      navegar(usuario ? '/' : '/login')
    } catch (err) {
      setError(err.mensaje || err.message || 'No se pudo iniciar sesion')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Navbar minimalista de las vistas publicas */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marca-600 text-white">
            <Banknote size={20} />
          </span>
          <span className="text-lg font-bold text-slate-800">
            Fiskor<span className="text-marca-600">ERP</span>
          </span>
        </div>
        <p className="text-xs text-slate-400">Sistema de gestion empresarial para Venezuela</p>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md animate-zoom-in rounded-2xl bg-white p-8 shadow-modal">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-800">Bienvenido de vuelta</h1>
            <p className="mt-1 text-sm text-slate-500">Ingrese sus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alerta tipo="error">
                <span className="flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </span>
              </Alerta>
            </div>
          )}

          <form onSubmit={enviar} className="space-y-4">
            <Entrada
              etiqueta="Correo electronico"
              icono={Mail}
              type="email"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <div className="relative">
              <div className="mb-1">
                <label className="etiqueta">Contrasena</label>
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="campo pl-9 pr-10"
                  type={mostrarClave ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarClave((estado) => !estado)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={mostrarClave ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/recuperar" className="text-xs font-medium text-marca-600 hover:underline">
                Olvide mi contrasena
              </Link>
            </div>

            <Boton type="submit" disabled={cargando} className="w-full">
              {cargando ? 'Verificando...' : 'Iniciar sesion'}
            </Boton>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-marca-600 hover:underline">
              Registrate aqui
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            La sesion se guarda de forma segura en este equipo.
          </p>
        </div>
      </main>
    </div>
  )
}