// ============================================================
// Clientes y cuentas por cobrar (CxC).
// Registro de clientes + saldos y abonos sobre sus deudas.
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Users, HandCoins, Ban, BadgeDollarSign } from 'lucide-react'

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
  tipo_documento: 'RIF',
  direccion: '',
  telefono: '',
  email: '',
  contribuyente_especial: false,
  retencion_iva: 0,
  limite_credito: 0,
}

export default function Clientes() {
  const { recargarTodo } = useApp()
  const [pestana, setPestana] = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [cxc, setCxc] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(null) // 'nuevo' | 'editar'
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  const [abono, setAbono] = useState(null) // cuenta de CxC para abonar
  const [montoAbono, setMontoAbono] = useState('')
  const [metodoAbono, setMetodoAbono] = useState('efectivo_bs')

  const cargar = async () => {
    setCargando(true)
    try {
      const [respClientes, respCxc] = await Promise.all([
        api.get('/clientes', { params: { por_pagina: 500 } }),
        api.get('/ventas/cxc', { params: { estado: 'pendiente' } }),
      ])
      setClientes(respClientes.data.datos.items || [])
      setCxc(respCxc.data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrir = (cliente) => {
    setSeleccionado(cliente)
    setForm(cliente ? {
      nombre: cliente.nombre || '',
      codigo: cliente.codigo || '',
      rif: cliente.rif || '',
      tipo_documento: cliente.tipo_documento || 'RIF',
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      contribuyente_especial: !!cliente.contribuyente_especial,
      retencion_iva: cliente.retencion_iva || 0,
      limite_credito: cliente.limite_credito || 0,
    } : VACIO)
    setError('')
    setModal(cliente ? 'editar' : 'nuevo')
  }

  const guardar = async () => {
    setError('')
    if (!form.nombre) {
      setError('El nombre del cliente es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const { data } = modal === 'nuevo'
        ? await api.post('/clientes', form)
        : await api.put(`/clientes/${seleccionado.id}`, form)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModal(null)
        cargar()
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'Ocurrio un error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (cliente) => {
    if (!window.confirm(`¿Desactivar al cliente "${cliente.nombre}"?`)) return
    try {
      await api.delete(`/clientes/${cliente.id}`)
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo desactivar')
    }
  }

  const registrarAbono = async () => {
    setError('')
    const monto = Number(montoAbono)
    if (!monto || monto <= 0) {
      setError('Indique el monto del abono')
      return
    }
    if (monto > (abono.saldo || 0) + 0.01) {
      setError(`El abono no puede superar el saldo de ${abono.saldo} USD`)
      return
    }
    try {
      const { data } = await api.post(`/ventas/cxc/${abono.id}/abono`, {
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
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar el abono')
    }
  }

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return c.nombre?.toLowerCase().includes(texto) || c.rif?.toLowerCase().includes(texto)
  })

  const totalPendiente = cxc.reduce((suma, c) => suma + (c.saldo || 0), 0)

  if (cargando) return <Cargando mensaje="Cargando clientes..." />

  const pestañas = [
    { id: 'clientes', etiqueta: 'Clientes', icono: Users },
    { id: 'cxc', etiqueta: 'Por cobrar', icono: HandCoins },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clientes</h2>
          <p className="text-sm text-slate-500">Registro de clientes y cuentas por cobrar</p>
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

      {pestana === 'clientes' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Entrada
              icono={Search}
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Boton onClick={() => abrir(null)}>
              <Plus size={16} /> Nuevo cliente
            </Boton>
          </div>

          {clientesFiltrados.length ? (
            <div className="tarjeta overflow-hidden">
              <Tabla
                columnas={['Nombre', 'RIF', 'Telefono', 'Limite USD', 'Saldo USD', 'Estado', '']}
                filas={clientesFiltrados.map((cliente) => ({
                  celdas: [
                    cliente.nombre,
                    cliente.rif || '--',
                    cliente.telefono || '--',
                    <Monto numero={cliente.limite_credito} tipo="usd" />,
                    <span className={cliente.saldo_pendiente > 0 ? 'font-semibold text-amber-600' : 'text-slate-500'}>
                      <Monto numero={cliente.saldo_pendiente} tipo="usd" />
                    </span>,
                    <Insignia color={cliente.activo ? 'verde' : 'gris'}>{cliente.activo ? 'Activo' : 'Inactivo'}</Insignia>,
                  ],
                  acciones: [
                    { icono: Pencil, titulo: 'Editar', color: 'azul', onClick: () => abrir(cliente) },
                    { icono: Ban, titulo: 'Desactivar', color: 'rojo', onClick: () => desactivar(cliente) },
                  ],
                }))}
              />
            </div>
          ) : (
            <Tarjeta>
              <Vacio mensaje="No hay clientes registrados" />
            </Tarjeta>
          )}
        </>
      )}

      {pestana === 'cxc' && (
        <>
          <div className="tarjeta flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-amber-50 p-3 text-amber-600"><BadgeDollarSign size={20} /></span>
              <div>
                <p className="text-sm text-slate-500">Total pendiente de cobrar</p>
                <p className="text-xl font-bold text-slate-800"><Monto numero={totalPendiente} tipo="usd" /></p>
              </div>
            </div>
            <Insignia color={totalPendiente > 0 ? 'amarillo' : 'verde'}>{cxc.length} cuentas</Insignia>
          </div>

          {cxc.length ? (
            <div className="tarjeta overflow-hidden">
              <Tabla
                columnas={['Cliente', 'Monto USD', 'Saldo', 'Vence', 'Dias', 'Estado', '']}
                filas={cxc.map((cuenta) => ({
                  celdas: [
                    cuenta.cliente_nombre,
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
                      icono: HandCoins,
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
              <Vacio mensaje="No hay cuentas por cobrar pendientes" />
            </Tarjeta>
          )}
        </>
      )}

      {/* ===== Modal de cliente ===== */}
      <Modal
        titulo={modal === 'nuevo' ? 'Nuevo cliente' : 'Editar cliente'}
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
          <Entrada etiqueta="RIF / Cedula" placeholder="J-########-#" value={form.rif} onChange={(e) => setForm({ ...form, rif: e.target.value })} />
          <Entrada etiqueta="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Entrada etiqueta="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="sm:col-span-2">
            <Entrada etiqueta="Direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <Entrada etiqueta="Retencion IVA (%)" type="number" value={form.retencion_iva} onChange={(e) => setForm({ ...form, retencion_iva: e.target.value })} />
          <Entrada etiqueta="Limite de credito (USD)" type="number" value={form.limite_credito} onChange={(e) => setForm({ ...form, limite_credito: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
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
        titulo={`Abono de ${abono?.cliente_nombre || ''}`}
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