// ============================================================
// Tesoreria: caja, bancos y movimientos de dinero.
// Apertura/cierre de caja por cajero + ingresos y egresos.
// ============================================================
import { useEffect, useState } from 'react'
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Banknote, PiggyBank } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import {
  Alerta,
  Boton,
  Cargando,
  Entrada,
  Insignia,
  Modal,
  Seleccion,
  Tarjeta,
  Vacio,
} from '../components/ui'

export default function Tesoreria() {
  const { caja, tasa, formatoBs, recargarTodo } = useApp()
  const [movimientos, setMovimientos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [resumenDia, setResumenDia] = useState({ ingresos_bs: 0, egresos_bs: 0, neto_bs: 0 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modalAbrir, setModalAbrir] = useState(false)
  const [modalCerrar, setModalCerrar] = useState(false)
  const [modalMovimiento, setModalMovimiento] = useState(false)
  const [modalCuenta, setModalCuenta] = useState(false)

  const [montoInicial, setMontoInicial] = useState('')
  const [montoCierre, setMontoCierre] = useState('')
  const [movimiento, setMovimiento] = useState({ tipo: 'ingreso', concepto: '', categoria: 'caja_chica', metodo: 'efectivo_bs', moneda: 'VES', monto: '', referencia: '' })
  const [cuenta, setCuenta] = useState({ banco: '', numero_cuenta: '', tipo: 'corriente', moneda: 'VES', titular: '', rif_titular: '', saldo: '' })

  const cargar = async () => {
    setCargando(true)
    try {
      const [respMov, respCuentas, respResumen] = await Promise.all([
        api.get('/tesoreria/movimientos'),
        api.get('/tesoreria/cuentas'),
        api.get('/tesoreria/resumen'),
      ])
      setMovimientos(respMov.data.datos || [])
      setCuentas(respCuentas.data.datos || [])
      setResumenDia(respResumen.data.datos || {})
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [caja])

  const abrirCaja = async () => {
    setError('')
    try {
      const { data } = await api.post('/tesoreria/caja/abrir', { monto_inicial: Number(montoInicial) || 0 })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalAbrir(false)
        setMontoInicial('')
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo abrir la caja')
    }
  }

  const cerrarCaja = async () => {
    setError('')
    try {
      const { data } = await api.post('/tesoreria/caja/cerrar', { monto_cierre: Number(montoCierre) || 0 })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalCerrar(false)
        setMontoCierre('')
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo cerrar la caja')
    }
  }

  const registrarMovimiento = async () => {
    setError('')
    if (!movimiento.concepto || !Number(movimiento.monto)) {
      setError('Indique el concepto y el monto')
      return
    }
    try {
      const { data } = await api.post('/tesoreria/movimientos', {
        ...movimiento,
        monto: Number(movimiento.monto),
        tasa: movimiento.moneda === 'USD' ? tasa : 1,
      })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalMovimiento(false)
        setMovimiento({ tipo: 'ingreso', concepto: '', categoria: 'caja_chica', metodo: 'efectivo_bs', moneda: 'VES', monto: '', referencia: '' })
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar el movimiento')
    }
  }

  const registrarCuenta = async () => {
    setError('')
    if (!cuenta.banco) {
      setError('Indique el banco')
      return
    }
    try {
      const { data } = await api.post('/tesoreria/cuentas', { ...cuenta, saldo: Number(cuenta.saldo) || 0 })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModalCuenta(false)
        setCuenta({ banco: '', numero_cuenta: '', tipo: 'corriente', moneda: 'VES', titular: '', rif_titular: '', saldo: '' })
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo registrar la cuenta')
    }
  }

  if (cargando) return <Cargando mensaje="Cargando tesoreria..." />

  const mostrarMoneda = (monto, moneda) =>
    moneda === 'USD' ? `$ ${Number(monto).toFixed(2)}` : `Bs. ${Number(monto).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Caja y tesoreria</h2>
          <p className="text-sm text-slate-500">Control del efectivo, bancos y movimientos</p>
        </div>
        <div className="flex gap-2">
          {!caja ? (
            <Boton onClick={() => { setError(''); setModalAbrir(true) }}>
              <Wallet size={16} /> Abrir caja
            </Boton>
          ) : (
            <Boton peligro onClick={() => { setError(''); setModalCerrar(true) }}>
              <Wallet size={16} /> Cerrar caja
            </Boton>
          )}
          <Boton secundario onClick={() => { setError(''); setModalCuenta(true) }}>
            <PiggyBank size={16} /> Cuenta
          </Boton>
        </div>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className={`rounded-lg p-3 ${caja ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Banknote size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Caja {caja ? `#${caja.id}` : 'cerrada'}</p>
              <p className={`text-lg font-bold ${caja ? 'text-emerald-600' : 'text-slate-400'}`}>
                {caja ? 'Abierta' : 'Sin apertura'}
              </p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-50 p-3 text-emerald-600"><ArrowDownCircle size={20} /></span>
            <div>
              <p className="text-sm text-slate-500">Ingresos (Bs)</p>
              <p className="text-lg font-bold text-slate-800">{formatoBs(resumenDia.ingresos_bs)}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-red-50 p-3 text-red-500"><ArrowUpCircle size={20} /></span>
            <div>
              <p className="text-sm text-slate-500">Egresos (Bs)</p>
              <p className="text-lg font-bold text-slate-800">{formatoBs(resumenDia.egresos_bs)}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-marca-50 p-3 text-marca-600"><Wallet size={20} /></span>
            <div>
              <p className="text-sm text-slate-500">Neto (Bs)</p>
              <p className="text-lg font-bold text-slate-800">{formatoBs(resumenDia.neto_bs)}</p>
            </div>
          </div>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="tarjeta">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                <ArrowDownCircle size={18} /> Movimientos
              </h3>
              <Boton onClick={() => { setError(''); setModalMovimiento(true) }}>
                <Plus size={16} /> Registro manual
              </Boton>
            </div>
            {movimientos.length ? (
              <ul className="divide-y divide-slate-100">
                {movimientos.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className={`rounded-lg p-2 ${m.tipo === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {m.tipo === 'ingreso' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{m.concepto}</p>
                      <p className="text-xs text-slate-400">
                        {m.fecha} · {m.metodo.replace('_', ' ')} · {m.categoria}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}
                      {mostrarMoneda(m.monto, m.moneda)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vacio mensaje="Sin movimientos registrados" />
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <PiggyBank size={18} /> Cuentas bancarias
          </h3>
          <div className="space-y-3">
            {cuentas.map((c) => (
              <Tarjeta key={c.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">{c.banco}</p>
                    <p className="text-xs text-slate-400">{c.numero_cuenta || 'Sin numero'} · {c.tipo} · {c.moneda}</p>
                  </div>
                  <Insignia color="verde">{mostrarMoneda(c.saldo, c.moneda)}</Insignia>
                </div>
              </Tarjeta>
            ))}
            {cuentas.length === 0 && (
              <Tarjeta>
                <Vacio mensaje="Sin cuentas bancarias" />
              </Tarjeta>
            )}
          </div>
        </div>
      </div>

      {/* ===== Modal abrir caja ===== */}
      <Modal titulo="Abrir caja" abierto={modalAbrir} onCerrar={() => setModalAbrir(false)} ancho="max-w-sm"
        acciones={
          <>
            <Boton secundario onClick={() => setModalAbrir(false)}>Cancelar</Boton>
            <Boton onClick={abrirCaja}>Abrir caja</Boton>
          </>
        }>
        <Entrada etiqueta="Monto inicial (Bs)" type="number" placeholder="0,00" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} autoFocus />
        <p className="mt-2 text-xs text-slate-400">Cada cajero abre su propia caja para el dia.</p>
      </Modal>

      {/* ===== Modal cerrar caja ===== */}
      <Modal titulo="Cerrar caja" abierto={modalCerrar} onCerrar={() => setModalCerrar(false)} ancho="max-w-sm"
        acciones={
          <>
            <Boton secundario onClick={() => setModalCerrar(false)}>Cancelar</Boton>
            <Boton onClick={cerrarCaja}>Cerrar caja</Boton>
          </>
        }>
        <Entrada etiqueta="Monto al cierre (Bs)" type="number" placeholder="0,00" value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)} autoFocus />
        <p className="mt-2 text-xs text-slate-400">El sistema calcula la diferencia contra lo esperado.</p>
      </Modal>

      {/* ===== Modal movimiento ===== */}
      <Modal titulo="Registro manual de movimiento" abierto={modalMovimiento} onCerrar={() => setModalMovimiento(false)} ancho="max-w-md"
        acciones={
          <>
            <Boton secundario onClick={() => setModalMovimiento(false)}>Cancelar</Boton>
            <Boton onClick={registrarMovimiento}>Registrar</Boton>
          </>
        }>
        <div className="space-y-4">
          <Seleccion
            etiqueta="Tipo"
            value={movimiento.tipo}
            onChange={(e) => setMovimiento({ ...movimiento, tipo: e.target.value })}
            opciones={[
              { valor: 'ingreso', texto: 'Ingreso' },
              { valor: 'egreso', texto: 'Egreso' },
            ]}
          />
          <Entrada etiqueta="Concepto" value={movimiento.concepto} onChange={(e) => setMovimiento({ ...movimiento, concepto: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              etiqueta="Categoria"
              value={movimiento.categoria}
              onChange={(e) => setMovimiento({ ...movimiento, categoria: e.target.value })}
              opciones={[
                { valor: 'venta', texto: 'Venta' },
                { valor: 'caja_chica', texto: 'Caja chica' },
                { valor: 'otros', texto: 'Otros' },
              ]}
            />
            <Seleccion
              etiqueta="Metodo"
              value={movimiento.metodo}
              onChange={(e) => setMovimiento({ ...movimiento, metodo: e.target.value })}
              opciones={[
                { valor: 'efectivo_bs', texto: 'Efectivo Bs.' },
                { valor: 'efectivo_divisa', texto: 'Efectivo USD' },
                { valor: 'pago_movil', texto: 'Pago movil' },
                { valor: 'transferencia', texto: 'Transferencia' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Entrada etiqueta="Monto" type="number" step="0.01" value={movimiento.monto} onChange={(e) => setMovimiento({ ...movimiento, monto: e.target.value })} />
            <Seleccion
              etiqueta="Moneda"
              value={movimiento.moneda}
              onChange={(e) => setMovimiento({ ...movimiento, moneda: e.target.value })}
              opciones={[
                { valor: 'VES', texto: 'Bolivares' },
                { valor: 'USD', texto: 'USD' },
              ]}
            />
          </div>
          <Entrada etiqueta="Referencia" value={movimiento.referencia} onChange={(e) => setMovimiento({ ...movimiento, referencia: e.target.value })} />
        </div>
      </Modal>

      {/* ===== Modal cuenta bancaria ===== */}
      <Modal titulo="Registrar cuenta bancaria" abierto={modalCuenta} onCerrar={() => setModalCuenta(false)} ancho="max-w-md"
        acciones={
          <>
            <Boton secundario onClick={() => setModalCuenta(false)}>Cancelar</Boton>
            <Boton onClick={registrarCuenta}>Registrar</Boton>
          </>
        }>
        <div className="space-y-4">
          <Entrada etiqueta="Banco" value={cuenta.banco} onChange={(e) => setCuenta({ ...cuenta, banco: e.target.value })} />
          <Entrada etiqueta="Numero de cuenta" value={cuenta.numero_cuenta} onChange={(e) => setCuenta({ ...cuenta, numero_cuenta: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              etiqueta="Tipo"
              value={cuenta.tipo}
              onChange={(e) => setCuenta({ ...cuenta, tipo: e.target.value })}
              opciones={[
                { valor: 'corriente', texto: 'Corriente' },
                { valor: 'ahorro', texto: 'Ahorro' },
              ]}
            />
            <Seleccion
              etiqueta="Moneda"
              value={cuenta.moneda}
              onChange={(e) => setCuenta({ ...cuenta, moneda: e.target.value })}
              opciones={[
                { valor: 'VES', texto: 'Bolivares' },
                { valor: 'USD', texto: 'USD' },
              ]}
            />
          </div>
          <Entrada etiqueta="Titular" value={cuenta.titular} onChange={(e) => setCuenta({ ...cuenta, titular: e.target.value })} />
          <Entrada etiqueta="Saldo inicial" type="number" step="0.01" value={cuenta.saldo} onChange={(e) => setCuenta({ ...cuenta, saldo: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}