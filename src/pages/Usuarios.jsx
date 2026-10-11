// ============================================================
// Usuarios del sistema (solo Administrador).
// Los usuarios viven en Supabase; aqui se administran.
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import {
  Alerta,
  Boton,
  Cargando,
  Entrada,
  Insignia,
  Modal,
  Seleccion,
  Tabla,
  Tarjeta,
  Vacio,
} from '../components/ui'

const ROLES = ['Administrador', 'Contador', 'Cajero']

export default function Usuarios() {
  const { usuario } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'Cajero' })
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/usuarios')
      setUsuarios(data.datos || [])
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar la lista de usuarios')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrir = (usuario) => {
    setSeleccionado(usuario)
    setForm(usuario ? { email: usuario.email || '', nombre: usuario.nombre || '', password: '', rol: usuario.rol || 'Cajero' } : { email: '', nombre: '', password: '', rol: 'Cajero' })
    setError('')
    setModal(true)
  }

  const guardar = async () => {
    setError('')
    if (!form.email || !form.nombre) {
      setError('El correo y el nombre son obligatorios')
      return
    }
    if (!seleccionado && form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    setGuardando(true)
    try {
      const cuerpo = { email: form.email, nombre: form.nombre, rol: form.rol }
      if (!seleccionado) cuerpo.password = form.password
      const { data } = seleccionado
        ? await api.put(`/usuarios/${seleccionado.id}`, cuerpo)
        : await api.post('/usuarios', cuerpo)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModal(false)
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'Ocurrio un error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar al usuario "${usuario.nombre}"? Esta accion no se puede deshacer.`)) return
    try {
      const { data } = await api.delete(`/usuarios/${usuario.id}`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo eliminar el usuario')
    }
  }

  if (cargando) return <Cargando mensaje="Cargando usuarios..." />

  const colorRol = (rol) => (rol === 'Administrador' ? 'morado' : rol === 'Contador' ? 'azul' : 'verde')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuarios</h2>
          <p className="text-sm text-slate-500">Gestion de accesos al sistema</p>
        </div>
        <Boton onClick={() => abrir(null)}>
          <Plus size={16} /> Nuevo usuario
        </Boton>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}

      {usuarios.length ? (
        <div className="tarjeta overflow-hidden">
          <Tabla
            columnas={['Nombre', 'Correo', 'Rol', 'Estado', '']}
            filas={usuarios.map((u) => ({
              celdas: [
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
                    {u.nombre?.[0]?.toUpperCase()}
                  </span>
                  {u.nombre}
                </span>,
                u.email,
                <Insignia color={colorRol(u.rol)}>{u.rol}</Insignia>,
                <Insignia color={u.activo ? 'verde' : 'gris'}>{u.activo ? 'Activo' : 'Inactivo'}</Insignia>,
              ],
              acciones: [
                { icono: Pencil, titulo: 'Editar', color: 'azul', onClick: () => abrir(u) },
                ...(u.email !== usuario?.email
                  ? [{ icono: Trash2, titulo: 'Eliminar', color: 'rojo', onClick: () => eliminar(u) }]
                  : []),
              ],
            }))}
          />
        </div>
      ) : (
        <Tarjeta>
          <Vacio mensaje="No hay usuarios para mostrar" />
        </Tarjeta>
      )}

      <Modal
        titulo={seleccionado ? 'Editar usuario' : 'Nuevo usuario'}
        abierto={modal}
        onCerrar={() => setModal(false)}
        ancho="max-w-md"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Boton>
          </>
        }
      >
        <div className="space-y-4">
          <Entrada etiqueta="Correo electronico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Entrada etiqueta="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Seleccion
            etiqueta="Rol"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            opciones={ROLES.map((r) => ({ valor: r, texto: r }))}
          />
          {!seleccionado && (
            <Entrada etiqueta="Contrasena (minimo 6 caracteres)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            El usuario iniciara sesion con Supabase; sin internet usara la copia local.
          </div>
        </div>
      </Modal>
    </div>
  )
}