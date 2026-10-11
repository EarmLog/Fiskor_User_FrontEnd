// ============================================================
// Vista publica: registro de usuario.
// La cuenta queda pendiente hasta que un administrador la apruebe.
// ============================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, BadgeCheck, Phone, Briefcase } from 'lucide-react'

import { api } from '../services/api'
import PublicShell from '../components/PublicShell'
import { Alerta, Boton, Entrada } from '../components/ui'

export default function Registro() {
  const [form, setForm] = useState({ nombre: '', email: '', cargo: '', telefono: '', password: '', confirmar: '' })
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [creado, setCreado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')
    if (!form.nombre || !form.email || !form.password) {
      setError('Nombre, correo y contrasena son obligatorios')
      return
    }
    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contrasenas no coinciden')
      return
    }
    setCargando(true)
    try {
      const { data } = await api.post('/auth/registro', {
        nombre: form.nombre,
        email: form.email,
        cargo: form.cargo,
        telefono: form.telefono,
        password: form.password,
      })
      setExito(data.mensaje)
      setCreado(!!data.datos?.creado)
      setForm({ nombre: '', email: '', cargo: '', telefono: '', password: '', confirmar: '' })
    } catch (err) {
      setError(err.mensaje || 'No se pudo enviar la solicitud')
    } finally {
      setCargando(false)
    }
  }

  return (
    <PublicShell titulo="Crear una cuenta" subtitulo="Tu solicitud sera revisada por un administrador">
      {error && <div className="mb-4"><Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta></div>}
      {exito && <div className="mb-4"><Alerta tipo="exito" onCerrar={() => setExito('')}>{exito}</Alerta></div>}

      <form onSubmit={enviar} className="space-y-4">
        <Entrada etiqueta="Nombre completo" icono={User} placeholder="Juan Perez" value={form.nombre} onChange={cambiar('nombre')} />
        <Entrada etiqueta="Correo electronico" icono={Mail} type="email" placeholder="juan@empresa.com" value={form.email} onChange={cambiar('email')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Entrada etiqueta="Cargo (opcional)" icono={Briefcase} placeholder="Cajero" value={form.cargo} onChange={cambiar('cargo')} />
          <Entrada etiqueta="Telefono (opcional)" icono={Phone} placeholder="0414-0000000" value={form.telefono} onChange={cambiar('telefono')} />
        </div>

        <div>
          <label className="etiqueta">Contrasena</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="campo pl-9 pr-10"
              type={mostrarClave ? 'text' : 'password'}
              placeholder="Minimo 6 caracteres"
              value={form.password}
              onChange={cambiar('password')}
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

        <Entrada etiqueta="Confirmar contrasena" icono={BadgeCheck} type={mostrarClave ? 'text' : 'password'} placeholder="Repite la contrasena" value={form.confirmar} onChange={cambiar('confirmar')} autoComplete="new-password" />

        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Enviando...' : 'Enviar solicitud'}
        </Boton>
      </form>

      {creado ? (
        <Link
          to="/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-marca-700"
        >
          Ir a iniciar sesion
        </Link>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-marca-600 hover:underline">Inicia sesion</Link>
        </p>
      )}
    </PublicShell>
  )
}
