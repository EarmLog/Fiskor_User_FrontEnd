// ============================================================
// Piezas de interfaz reutilizables (UI kit de Fiskor).
// Botones, campos, tablas, insignias y estado vacio.
// ============================================================
import { Loader2, Search, Inbox, X } from 'lucide-react'

// Reexportamos el modal para importarlo junto al resto del UI kit.
export { default as Modal } from './Modal'

export function Boton({
  children,
  variante,
  secundario,
  peligro,
  icono: Icono,
  tamaño = 'normal',
  className = '',
  ...props
}) {
  const tipo = variante || (peligro ? 'peligro' : secundario ? 'secundario' : 'primario')
  const clases =
    tipo === 'primario' ? 'btn-primario' : tipo === 'peligro' ? 'btn-peligro' : 'btn-secundario'
  const tamanoClase = tamaño === 'chico' ? 'px-2.5 py-1.5 text-xs' : ''
  return (
    <button className={`${clases} ${tamanoClase} ${className}`} {...props}>
      {Icono && <Icono size={16} />}
      {children}
    </button>
  )
}

export function Entrada({ etiqueta, icono: Icono, error, className = '', ...props }) {
  return (
    <div>
      {etiqueta && <label className="etiqueta">{etiqueta}</label>}
      <div className="relative">
        {Icono && (
          <Icono size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
        <input className={`campo ${Icono ? 'pl-9' : ''} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Seleccion({ etiqueta, opciones = [], valorVacio, className = '', ...props }) {
  return (
    <div>
      {etiqueta && <label className="etiqueta">{etiqueta}</label>}
      <select className={`campo ${className}`} {...props}>
        {valorVacio !== undefined && <option value="">{valorVacio}</option>}
        {opciones.map((opcion) =>
          typeof opcion === 'object' ? (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ) : (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ),
        )}
      </select>
    </div>
  )
}

export function Tarjeta({ children, className = '' }) {
  return <div className={`tarjeta p-5 ${className}`}>{children}</div>
}

export function Insignia({ color = 'gris', className = '', children }) {
  const colores = {
    verde: 'bg-emerald-100 text-emerald-700',
    rojo: 'bg-red-100 text-red-700',
    amarillo: 'bg-amber-100 text-amber-700',
    azul: 'bg-sky-100 text-sky-700',
    morado: 'bg-violet-100 text-violet-700',
    gris: 'bg-slate-100 text-slate-600',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colores[color] || colores.gris} ${className}`}
    >
      {children}
    </span>
  )
}

export function Alerta({ tipo = 'info', onCerrar, children }) {
  const estilos = {
    info: 'bg-sky-50 border-sky-200 text-sky-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    exito: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    aviso: 'bg-amber-50 border-amber-200 text-amber-700',
  }
  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${estilos[tipo] || estilos.info}`}>
      <div className="min-w-0">{children}</div>
      {onCerrar && (
        <button onClick={onCerrar} className="shrink-0 opacity-60 transition-opacity hover:opacity-100" aria-label="Cerrar">
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export function Cargando({ mensaje = 'Cargando informacion...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{mensaje}</span>
    </div>
  )
}

export function Vacio({ mensaje = 'Aun no hay registros' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
      <Inbox size={36} />
      <p className="text-sm">{mensaje}</p>
    </div>
  )
}

export function BarraBusqueda({ valor, onChange, placeholder = 'Buscar...', onBuscar }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="campo pl-9"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onBuscar && onBuscar()}
      />
    </div>
  )
}

// Tabla generica. Recibe las columnas y filas con celdas y acciones opcionales.
export function Tabla({ columnas = [], filas = [], vacio }) {
  const coloresAccion = {
    azul: 'text-sky-500 hover:bg-sky-50',
    verde: 'text-emerald-500 hover:bg-emerald-50',
    ambar: 'text-amber-500 hover:bg-amber-50',
    rojo: 'text-red-500 hover:bg-red-50',
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columnas.map((columna, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-8 text-center text-slate-400">
                {vacio || 'No hay registros para mostrar'}
              </td>
            </tr>
          )}
          {filas.map((fila, indice) => (
            <tr key={indice} className="transition-colors hover:bg-slate-50">
              {fila.celdas.map((celda, c) => (
                <td key={c} className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {celda}
                </td>
              ))}
              {fila.acciones && (
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {fila.acciones.map((accion, a) => (
                      <button
                        key={a}
                        onClick={accion.onClick}
                        title={accion.titulo}
                        className={`rounded-lg p-1.5 transition-colors ${coloresAccion[accion.color] || coloresAccion.azul}`}
                      >
                        <accion.icono size={16} />
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Monto formateado en bolivares o divisas.
export function Monto({ numero, tipo = 'bs', moneda = 'USD' }) {
  const valor = Number(numero || 0)
  if (tipo === 'bs') {
    return `Bs. ${valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const simbolo = moneda === 'USD' ? '$' : moneda
  return `${simbolo} ${valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
