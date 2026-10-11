// ============================================================
// Nomina: empleados, departamentos y procesamiento de liquidacion.
// Calculo de asignaciones, deducciones (SSO, RPE, FAOV) y neto.
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Calculator, Users, Layers, Play, FileDown, Trash2 } from 'lucide-react'

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

const VACIO = {
  cedula: '',
  nombres: '',
  apellidos: '',
  cargo: '',
  departamento_id: '',
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  sueldo_base: 0,
  bono_alimentacion: 0,
  tipo_nomina: 'mensual',
  banco: '',
  numero_cuenta: '',
  afiliado_ivss: true,
}

export default function Nomina() {
  const [pestana, setPestana] = useState('empleados')
  const [empleados, setEmpleados] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [nominas, setNominas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalEmpleado, setModalEmpleado] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  const [modalDepartamento, setModalDepartamento] = useState(false)
  const [departamentoNuevo, setDepartamentoNuevo] = useState('')

  const [parametros, setParametros] = useState({ tipo: 'mensual', periodo: '', fecha_desde: '', fecha_hasta: '' })
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [procesando, setProcesando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    try {
      const [emp, dep, nom] = await Promise.all([
        api.get('/nomina/empleados', { params: { por_pagina: 500 } }),
        api.get('/nomina/departamentos'),
        api.get('/nomina'),
      ])
      setEmpleados(emp.data.datos.items || [])
      setDepartamentos(dep.data.datos || [])
      setNominas(nom.data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirEmpleado = (empleado) => {
    setSeleccionado(empleado)
    setForm(empleado ? {
      cedula: empleado.cedula || '',
      nombres: empleado.nombres || '',
      apellidos: empleado.apellidos || '',
      cargo: empleado.cargo || '',
      departamento_id: empleado.departamento_id || '',
      fecha_ingreso: empleado.fecha_ingreso || '',
      sueldo_base: empleado.sueldo_base || 0,
      bono_alimentacion: empleado.bono_alimentacion || 0,
      tipo_nomina: empleado.tipo_nomina || 'mensual',
      banco: empleado.banco || '',
      numero_cuenta: empleado.numero_cuenta || '',
      afiliado_ivss: empleado.afiliado_ivss !== false,
    } : VACIO)
    setError('')
    setModalEmpleado(true)
  }

  const guardarEmpleado = async () => {
    setError('')
    if (!form.cedula || !form.nombres || !form.apellidos) {
      setError('La cedula, nombres y apellidos son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const cuerpo = { ...form, departamento_id: form.departamento_id || null }
      const { data } = seleccionado
        ? await api.put(`/nomina/empleados/${seleccionado.id}`, cuerpo)
        : await api.post('/nomina/empleados', cuerpo)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalEmpleado(false)
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo guardar el empleado')
    } finally {
      setGuardando(false)
    }
  }

  const crearDepartamento = async () => {
    if (!departamentoNuevo.trim()) return
    try {
      await api.post('/nomina/departamentos', { nombre: departamentoNuevo.trim() })
      setDepartamentoNuevo('')
      cargar()
    } catch {
      setError('No se pudo crear el departamento')
    }
  }

  const previsualizar = async () => {
    setError('')
    setVistaPrevia(null)
    try {
      const { data } = await api.post('/nomina/previsualizar', { tipo: parametros.tipo })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setVistaPrevia(data.datos)
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo previsualizar')
    }
  }

  const procesarNomina = async () => {
    setError('')
    if (!parametros.periodo.trim()) {
      setError('Indique el periodo de la nomina')
      return
    }
    setProcesando(true)
    try {
      const { data } = await api.post('/nomina/procesar', parametros)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setVistaPrevia(null)
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo procesar la nomina')
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) return <Cargando mensaje="Cargando nomina..." />

  const pestanas = [
    { id: 'empleados', etiqueta: 'Empleados', icono: Users },
    { id: 'departamentos', etiqueta: 'Departamentos', icono: Layers },
    { id: 'procesar', etiqueta: 'Procesar nomina', icono: Calculator },
  ]

  const bn = (n) => `Bs. ${Number(n || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Nomina</h2>
          <p className="text-sm text-slate-500">Liquidacion de sueldos con deducciones de ley</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {pestanas.map((p) => (
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

      {/* ===== Empleados ===== */}
      {pestana === 'empleados' && (
        <>
          <div className="flex justify-end">
            <Boton onClick={() => abrirEmpleado(null)}>
              <Plus size={16} /> Nuevo empleado
            </Boton>
          </div>
          {empleados.length ? (
            <div className="tarjeta overflow-hidden">
              <Tabla
                columnas={['Cedula', 'Nombre', 'Cargo', 'Departamento', 'Nomina', 'Sueldo', 'Cuenta', '']}
                filas={empleados.map((e) => ({
                  celdas: [
                    e.cedula,
                    `${e.nombres} ${e.apellidos}`,
                    e.cargo || '--',
                    e.departamento?.nombre || '--',
                    e.tipo_nomina,
                    bn(e.sueldo_base),
                    e.numero_cuenta || '--',
                  ],
                  acciones: [{ icono: Pencil, titulo: 'Editar', color: 'azul', onClick: () => abrirEmpleado(e) }],
                }))}
              />
            </div>
          ) : (
            <Tarjeta>
              <Vacio mensaje="No hay empleados registrados" />
            </Tarjeta>
          )}
        </>
      )}

      {/* ===== Departamentos ===== */}
      {pestana === 'departamentos' && (
        <div className="max-w-xl">
          <div className="tarjeta flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-marca-50 p-3 text-marca-600"><Layers size={20} /></span>
              <div>
                <p className="text-sm text-slate-500">Departamentos de la empresa</p>
                <p className="text-xl font-bold text-slate-800">{departamentos.length}</p>
              </div>
            </div>
          </div>
          <div className="tarjeta mt-4">
            <div className="flex gap-2">
              <input
                className="campo"
                placeholder="Nombre del departamento"
                value={departamentoNuevo}
                onChange={(e) => setDepartamentoNuevo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && crearDepartamento()}
              />
              <Boton onClick={crearDepartamento}><Plus size={16} /> Agregar</Boton>
            </div>
            <ul className="mt-4 space-y-2">
              {departamentos.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2 text-sm">
                  <span className="font-medium text-slate-700">{dep.nombre}</span>
                  <Insignia color="azul">{dep.empleados_count ?? '--'} empleados</Insignia>
                </li>
              ))}
              {departamentos.length === 0 && <li className="py-4 text-center text-sm text-slate-400">Sin departamentos</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ===== Procesar nomina ===== */}
      {pestana === 'procesar' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4">
            <Tarjeta>
              <h3 className="mb-3 font-semibold text-slate-800">Parametros de liquidacion</h3>
              <div className="space-y-4">
                <Seleccion
                  etiqueta="Tipo de nomina"
                  value={parametros.tipo}
                  onChange={(e) => setParametros({ ...parametros, tipo: e.target.value })}
                  opciones={[
                    { valor: 'mensual', texto: 'Mensual' },
                    { valor: 'quincenal', texto: 'Quincenal' },
                    { valor: 'semanal', texto: 'Semanal' },
                    { valor: 'todas', texto: 'Todas las modalidades' },
                  ]}
                />
                <Entrada etiqueta="Periodo" placeholder="Ej: 2026-10" value={parametros.periodo} onChange={(e) => setParametros({ ...parametros, periodo: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Entrada etiqueta="Desde" type="date" value={parametros.fecha_desde} onChange={(e) => setParametros({ ...parametros, fecha_desde: e.target.value })} />
                  <Entrada etiqueta="Hasta" type="date" value={parametros.fecha_hasta} onChange={(e) => setParametros({ ...parametros, fecha_hasta: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Boton secundario className="flex-1" onClick={previsualizar}>
                    <FileDown size={16} /> Previsualizar
                  </Boton>
                  <Boton className="flex-1" onClick={procesarNomina} disabled={procesando}>
                    <Play size={16} /> {procesando ? 'Procesando...' : 'Procesar'}
                  </Boton>
                </div>
              </div>
            </Tarjeta>

            <Tarjeta>
              <h3 className="mb-2 font-semibold text-slate-800">Nominas procesadas</h3>
              <ul className="divide-y divide-slate-100">
                {nominas.map((n) => (
                  <li key={n.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{n.periodo}</p>
                      <p className="text-xs text-slate-400">{n.tipo} · {n.total_neto} neto</p>
                    </div>
                    <Insignia color="verde">{n.estado}</Insignia>
                  </li>
                ))}
                {nominas.length === 0 && <li className="py-2 text-sm text-slate-400">Ninguna nomina procesada aun</li>}
              </ul>
            </Tarjeta>
          </div>

          <div className="lg:col-span-2">
            <Tarjeta>
              <h3 className="mb-3 font-semibold text-slate-800">Vista previa del calculo</h3>
              {!vistaPrevia ? (
                <Vacio mensaje="Configure los parametros y presione Previsualizar" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs text-slate-400">
                          <th className="px-3 py-2">Empleado</th>
                          <th className="px-3 py-2 text-right">Sueldo</th>
                          <th className="px-3 py-2 text-right">Cestaticket</th>
                          <th className="px-3 py-2 text-right">SSO</th>
                          <th className="px-3 py-2 text-right">RPE</th>
                          <th className="px-3 py-2 text-right">FAOV</th>
                          <th className="px-3 py-2 text-right">Deducc.</th>
                          <th className="px-3 py-2 text-right">Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vistaPrevia.detalles.map((d, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">{d.empleado}</td>
                            <td className="px-3 py-2 text-right">{bn(d.sueldo_base)}</td>
                            <td className="px-3 py-2 text-right">{bn(d.cestaticket)}</td>
                            <td className="px-3 py-2 text-right">{bn(d.sso)}</td>
                            <td className="px-3 py-2 text-right">{bn(d.rpe)}</td>
                            <td className="px-3 py-2 text-right">{bn(d.faov)}</td>
                            <td className="px-3 py-2 text-right">{bn(d.total_deducciones)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-marca-600">{bn(d.neto_pagar)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                          <td className="px-3 py-2">Totales</td>
                          <td className="px-3 py-2 text-right">{bn(vistaPrevia.total_asignaciones)}</td>
                          <td className="px-3 py-2" colSpan="5" />
                          <td className="px-3 py-2 text-right">{bn(vistaPrevia.total_neto)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Asignaciones: {bn(vistaPrevia.total_asignaciones)} · Deducciones: {bn(vistaPrevia.total_deducciones)} · Neto a pagar: {bn(vistaPrevia.total_neto)}
                  </p>
                </>
              )}
            </Tarjeta>
          </div>
        </div>
      )}

      {/* ===== Modal empleado ===== */}
      <Modal
        titulo={seleccionado ? 'Editar empleado' : 'Nuevo empleado'}
        abierto={modalEmpleado}
        onCerrar={() => setModalEmpleado(false)}
        ancho="max-w-2xl"
        acciones={
          <>
            <Boton secundario onClick={() => setModalEmpleado(false)}>Cancelar</Boton>
            <Boton onClick={guardarEmpleado} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Boton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Entrada etiqueta="Cedula" placeholder="V-########" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
              <Entrada etiqueta="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
              <Entrada etiqueta="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            </div>
          </div>
          <Entrada etiqueta="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          <Seleccion
            etiqueta="Departamento"
            valorVacio="Sin departamento"
            value={form.departamento_id}
            onChange={(e) => setForm({ ...form, departamento_id: e.target.value })}
            opciones={departamentos.map((d) => ({ valor: String(d.id), texto: d.nombre }))}
          />
          <Entrada etiqueta="Fecha de ingreso" type="date" value={form.fecha_ingreso} onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })} />
          <Seleccion
            etiqueta="Tipo de nomina"
            value={form.tipo_nomina}
            onChange={(e) => setForm({ ...form, tipo_nomina: e.target.value })}
            opciones={[
              { valor: 'mensual', texto: 'Mensual' },
              { valor: 'quincenal', texto: 'Quincenal' },
              { valor: 'semanal', texto: 'Semanal' },
            ]}
          />
          <Entrada etiqueta="Sueldo base mensual (Bs)" type="number" value={form.sueldo_base} onChange={(e) => setForm({ ...form, sueldo_base: e.target.value })} />
          <Entrada etiqueta="Cestaticket mensual (Bs)" type="number" value={form.bono_alimentacion} onChange={(e) => setForm({ ...form, bono_alimentacion: e.target.value })} />
          <Entrada etiqueta="Banco" value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
          <Entrada etiqueta="Numero de cuenta" value={form.numero_cuenta} onChange={(e) => setForm({ ...form, numero_cuenta: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
              checked={form.afiliado_ivss}
              onChange={(e) => setForm({ ...form, afiliado_ivss: e.target.checked })}
            />
            Afiliado al IVSS (aplica SSO, RPE y FAOV)
          </label>
        </div>
      </Modal>
    </div>
  )
}