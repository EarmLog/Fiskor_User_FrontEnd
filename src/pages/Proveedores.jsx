// ============================================================
// Proveedores y cuentas por pagar (CxP).
// Registro de proveedores + saldos y abonos de sus facturas.
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Store, Landmark, Ban, BadgeDollarSign } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import {
  Alerta,
  Boton,
  Cargando,
  Entrada,
  Insignia,
  Modal,
  Tabla,
  Tarjeta,
  Vacio,
} from '../components/ui'
import { Monto } from '../components/ui'

const VACIO = {
  nombre: '',
  codigo: '',
  rif: '',
  direccion: '',
  telefono: '',
  email: '',
  contacto: '',
  contribuyente_especial: false,
  retencion_iva: 75,
  retencion_islr: 5,
  dias_credito: 30,
}

export default function Proveedores() {
  const { recargarTodo } = useApp()
  const [pestana, setPestana] = useState('proveedores')
  const [proveedores, setProveedores] = useState([])
  const [cxp, setCxp] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  const [abono, setAbono] = useState(null)
  const [montoAbono, setMontoAbono] = useState('')
  const [metodoAbono, setMetodoAbono] = useState('transferencia')

  const cargar = async () => {
    setCargando(true)
    try {
      const [respProv, respCxp] = await Promise.all([
        api.get('/proveedores', { params: { por_pagina: 500 } }),
        api.get('/compras/cxp', { params: { estado: 'pendiente' } }),
      ])
      setProveedores(respProv.data.datos.items || [])
      setCxp(respCxp.data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrir = (proveedor) => {
    setSeleccionado(proveedor)
    setForm(proveedor ? {
      nombre: proveedor.nombre || '',
      codigo: proveedor.codigo || '',
      rif: proveedor.rif || '',
      direccion: proveedor.direccion || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      contacto: proveedor.contacto || '',
      contribuyente_especial: !!proveedor.contribuyente_especial,
      retencion_iva: proveedor.retencion_iva ?? 75,
      retencion_islr: proveedor.retencion_islr ?? 5,
      dias_credito: proveedor.dias_credito ?? 30,
    } : VACIO)
    setError('')
    setModal(proveedor ? 'editar' : 'nuevo')
  }

  const guardar = async () => {
    setError('')
    if (!form.nombre) {
      setError('El nombre del proveedor es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const { data } = modal === 'nuevo'
        ? await api.post('/proveedores', form)
        : await api.put(`/proveedores/${seleccionado.id}`, form)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModal(null)
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'Ocurrio un error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (proveedor) => {
    if (!window.confirm(`¿Desactivar al proveedor "${proveedor.nombre}"?`)) return
    try {
      await api.delete(`/proveedores/${proveedor.id}`)
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo desactivar')
    }
  }

  const registrarAbono = async () => {
    setError('')
    const monto = Number(montoAbono)
    if (!monto || monto <= 0 || monto > (abono.saldo || 0) + 0.01) {
      setError('El monto debe ser valido y no superar el saldo')
      return
    }
    try {
      const { data } = await api.post(`/compras/cxp/${abono.id}/abono`, {
        monto,
        moneda: 'USD',
        tasa: 1,
        metodo: metodoAbono,
      })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setAbono(null)
        setMontoAbono('')
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar el abono')
    }
  }

  const proveedoresFiltrados = proveedores.filter((p) => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return p.nombre?.toLowerCase().includes(texto) || p.rif?.toLowerCase().includes(texto)
  })

  const totalPendiente = cxp.reduce((suma, c) => suma + (c.saldo || 0), 0)

  if (cargando) return <Cargando mensaje="Cargando proveedores..." />

  const pestañas = [
    { id: 'proveedores', etiqueta: 'Proveedores', icono: Store },
    { id: 'cxp', etiqueta: 'Por pagar', icono: Landmark },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Proveedores</h2>
          <p className="text-sm text-slate-500">Registro de proveedores y cuentas por pagar</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {pestañas.map((p) => (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                pestana === p.id ? 'bg-marca-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <p.icono size={16} /> {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}

      {pestana === 'proveedores' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Entrada
              icono={Search}
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Boton onClick={() => abrir(null)}>
              <Plus size={16} /> Nuevo proveedor
            </Boton>
          </div>

          {proveedoresFiltrados.length ? (
            <div className="tarjeta overflow-hidden">
              <Tabla
                columnas={['Nombre', 'RIF', 'Contacto', 'Ret. IVA', 'Ret. ISLR', 'Dias', 'Estado', '']}
                filas={proveedoresFiltrados.map((proveedor) => ({
                  celdas: [
                    proveedor.nombre,
                    proveedor.rif || '--',
                    proveedor.contacto || proveedor.telefono || '--',
                    `${proveedor.retencion_iva}%`,
                    `${proveedor.retencion_islr}%`,
                    proveedor.dias_credito,
                    <Insignia color={proveedor.activo ? 'verde' : 'gris'}>{proveedor.activo ? 'Activo' : 'Inactivo'}</Insignia>,
                  ],
                  acciones: [
                    { icono: Pencil, titulo: 'Editar', color: 'azul', onClick: () => abrir(proveedor) },
                    { icono: Ban, titulo: 'Desactivar', color: 'rojo', onClick: () => desactivar(proveedor) },
                  ],
                }))}
              />
            </div>
          ) : (
            <Tarjeta>
              <Vacio mensaje="No hay proveedores registrados" />
            </Tarjeta>
          )}
        </>
      )}

      {pestana === 'cxp' && (
        <>
          <div className="tarjeta flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-amber-50 p-3 text-amber-600"><BadgeDollarSign size={20} /></span>
              <div>
                <p className="text-sm text-slate-500">Total pendiente por pagar</p>
                <p className="text-xl font-bold text-slate-800"><Monto numero={totalPendiente} tipo="usd" /></p>
              </div>
            </div>
            <Insignia color={totalPendiente > 0 ? 'amarillo' : 'verde'}>{cxp.length} cuentas</Insignia>
          </div>

          {cxp.length ? (
            <div className="tarjeta overflow-hidden">
              <Tabla
                columnas={['Proveedor', 'Monto USD', 'Saldo', 'Vence', 'Dias', 'Estado', '']}
                filas={cxp.map((cuenta) => ({
                  celdas: [
                    cuenta.proveedor_nombre,
                    <Monto numero={cuenta.monto_total} tipo="usd" />,
                    <span className="font-semibold text-slate-700"><Monto numero={cuenta.saldo} tipo="usd" /></span>,
                    cuenta.fecha_vencimiento,
                    cuenta.dias_vencida > 0 ? (
                      <Insignia color="rojo">{cuenta.dias_vencida} d</Insignia>
                    ) : (
                      <span className="text-xs text-slate-400">al dia</span>
                    ),
                    <Insignia color={cuenta.estado === 'pendiente' ? 'amarillo' : 'verde'}>{cuenta.estado}</Insignia>,
                  ],
                  acciones: [
                    {
                      icono: BadgeDollarSign,
                      titulo: 'Registrar abono',
                      color: 'verde',
                      onClick: () => {
                        setAbono(cuenta)
                        setMontoAbono('')
                        setError('')
                      },
                    },
                  ],
                }))}
              />
            </div>
          ) : (
            <Tarjeta>
              <Vacio mensaje="No hay cuentas por pagar pendientes" />
            </Tarjeta>
          )}
        </>
      )}

      {/* ===== Modal de proveedor ===== */}
      <Modal
        titulo={modal === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}
        abierto={modal === 'nuevo' || modal === 'editar'}
        onCerrar={() => setModal(null)}
        ancho="max-w-xl"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Boton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Entrada etiqueta="Nombre o razon social" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <Entrada etiqueta="Codigo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          <Entrada etiqueta="RIF" placeholder="J-########-#" value={form.rif} onChange={(e) => setForm({ ...form, rif: e.target.value })} />
          <Entrada etiqueta="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Entrada etiqueta="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Entrada etiqueta="Persona de contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          <div className="sm:col-span-2">
            <Entrada etiqueta="Direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <Entrada etiqueta="Retencion IVA (%)" type="number" value={form.retencion_iva} onChange={(e) => setForm({ ...form, retencion_iva: e.target.value })} />
          <Entrada etiqueta="Retencion ISLR (%)" type="number" value={form.retencion_islr} onChange={(e) => setForm({ ...form, retencion_islr: e.target.value })} />
          <Entrada etiqueta="Dias de credito" type="number" value={form.dias_credito} onChange={(e) => setForm({ ...form, dias_credito: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
              checked={form.contribuyente_especial}
              onChange={(e) => setForm({ ...form, contribuyente_especial: e.target.checked })}
            />
            Contribuyente especial
          </label>
        </div>
      </Modal>

      {/* ===== Modal de abono ===== */}
      <Modal
        titulo={`Abono a ${abono?.proveedor_nombre || ''}`}
        abierto={!!abono}
        onCerrar={() => setAbono(null)}
        ancho="max-w-md"
        acciones={
          <>
            <Boton secundario onClick={() => setAbono(null)}>Cancelar</Boton>
            <Boton onClick={registrarAbono}>Registrar abono</Boton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">Saldo pendiente</p>
            <p className="text-xl font-bold text-slate-800">{abono ? Number(abono.saldo).toFixed(2) : ''} USD</p>
          </div>
          <Entrada etiqueta="Monto del abono (USD)" type="number" step="0.01" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} autoFocus />
          <Entrada etiqueta="Metodo" type="text" value={metodoAbono} onChange={(e) => setMetodoAbono(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}