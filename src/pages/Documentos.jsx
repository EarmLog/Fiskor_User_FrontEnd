// ============================================================
// Formatos de documentos (plantillas).
// Permite montar, editar y reemplazar el formato de cada tipo de
// documento: que se muestra (logo, sello, firma, IVA, IGTF), los
// textos y el color. El logo y el sello se suben en Empresa.
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Pencil, Trash2, ImageIcon, Info } from 'lucide-react'

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

const TIPOS = [
  { valor: 'factura', texto: 'Factura' },
  { valor: 'nota_entrega', texto: 'Nota de entrega' },
  { valor: 'recibo', texto: 'Recibo' },
  { valor: 'retencion', texto: 'Comprobante de retencion' },
  { valor: 'cotizacion', texto: 'Cotizacion' },
]

const FORM_VACIO = {
  tipo: 'factura',
  nombre: '',
  titulo_encabezado: '',
  leyenda_superior: '',
  leyenda_inferior: '',
  color: '#1d4ed8',
  mostrar_logo: true,
  mostrar_sello: true,
  mostrar_firma: true,
  mostrar_iva: true,
  mostrar_igtf: true,
  activo: true,
}

export default function Documentos() {
  const [plantillas, setPlantillas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [seleccionada, setSeleccionada] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/documentos/plantillas')
      setPlantillas(data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirNueva = () => {
    setSeleccionada(null)
    setForm(FORM_VACIO)
    setError('')
    setModal(true)
  }

  const abrirEditar = (p) => {
    setSeleccionada(p)
    setForm({
      tipo: p.tipo,
      nombre: p.nombre || '',
      titulo_encabezado: p.titulo_encabezado || '',
      leyenda_superior: p.leyenda_superior || '',
      leyenda_inferior: p.leyenda_inferior || '',
      color: p.color || '#1d4ed8',
      mostrar_logo: !!p.mostrar_logo,
      mostrar_sello: !!p.mostrar_sello,
      mostrar_firma: !!p.mostrar_firma,
      mostrar_iva: !!p.mostrar_iva,
      mostrar_igtf: !!p.mostrar_igtf,
      activo: !!p.activo,
    })
    setError('')
    setModal(true)
  }

  const guardar = async () => {
    setError('')
    setGuardando(true)
    try {
      const { data } = seleccionada
        ? await api.put(`/documentos/plantillas/${seleccionada.id}`, form)
        : await api.post('/documentos/plantillas', form)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      setModal(false)
      setMensaje('Formato guardado')
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo guardar el formato')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (p) => {
    if (!window.confirm(`Eliminar el formato "${p.nombre}"?`)) return
    try {
      await api.delete(`/documentos/plantillas/${p.id}`)
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo eliminar')
    }
  }

  const toggle = (campo) => (e) => setForm({ ...form, [campo]: e.target.checked })

  if (cargando && !plantillas.length) return <Cargando mensaje="Cargando formatos..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Formatos de documentos</h2>
          <p className="text-sm text-slate-500">Monta, edita o reemplaza el formato de tus facturas y notas</p>
        </div>
        <Boton onClick={abrirNueva}><Plus size={16} /> Nuevo formato</Boton>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}
      {mensaje && <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>}

      <Alerta tipo="info">
        <span className="flex items-center gap-2">
          <Info size={15} />
          El logo, el sello digital y la firma se suben y reemplazan en
          {' '}<Link to="/empresa" className="font-medium underline">Empresa</Link>. Aqui defines como se usan en cada documento.
        </span>
      </Alerta>

      {plantillas.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plantillas.map((p) => (
            <Tarjeta key={p.id}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg p-2" style={{ backgroundColor: `${p.color}1a`, color: p.color }}>
                    <FileText size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{p.nombre}</p>
                    <p className="text-xs capitalize text-slate-400">{p.tipo.replace('_', ' ')}</p>
                  </div>
                </div>
                <Insignia color={p.activo ? 'verde' : 'gris'}>{p.activo ? 'Activo' : 'Inactivo'}</Insignia>
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {p.mostrar_logo && <Insignia color="azul"><ImageIcon size={11} className="mr-1" />Logo</Insignia>}
                {p.mostrar_sello && <Insignia color="morado">Sello</Insignia>}
                {p.mostrar_firma && <Insignia color="gris">Firma</Insignia>}
                {p.mostrar_iva && <Insignia color="amarillo">IVA</Insignia>}
                {p.mostrar_igtf && <Insignia color="amarillo">IGTF</Insignia>}
              </div>

              <div className="flex justify-end gap-1">
                <Boton secundario tamaño="chico" onClick={() => abrirEditar(p)}><Pencil size={14} /> Editar</Boton>
                <Boton peligro tamaño="chico" onClick={() => eliminar(p)}><Trash2 size={14} /></Boton>
              </div>
            </Tarjeta>
          ))}
        </div>
      ) : (
        <Tarjeta><Vacio mensaje="Aun no hay formatos. Crea uno para personalizar tus documentos." /></Tarjeta>
      )}

      <Modal
        titulo={seleccionada ? 'Editar formato' : 'Nuevo formato'}
        abierto={modal}
        onCerrar={() => setModal(false)}
        ancho="max-w-2xl"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar formato'}</Boton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Seleccion etiqueta="Tipo de documento" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} opciones={TIPOS} />
          <Entrada etiqueta="Nombre del formato" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Formato principal" />
          <div className="sm:col-span-2">
            <Entrada etiqueta="Titulo del encabezado" value={form.titulo_encabezado} onChange={(e) => setForm({ ...form, titulo_encabezado: e.target.value })} placeholder="FACTURA / NOTA DE ENTREGA" />
          </div>
          <div className="sm:col-span-2">
            <label className="etiqueta">Leyenda superior (opcional)</label>
            <textarea className="campo" rows="2" value={form.leyenda_superior} onChange={(e) => setForm({ ...form, leyenda_superior: e.target.value })} placeholder="Texto que aparece antes de la tabla" />
          </div>
          <div className="sm:col-span-2">
            <label className="etiqueta">Leyenda inferior / pie (opcional)</label>
            <textarea className="campo" rows="2" value={form.leyenda_inferior} onChange={(e) => setForm({ ...form, leyenda_inferior: e.target.value })} placeholder="Gracias por su compra. RIF y direccion fiscal." />
          </div>
          <div>
            <label className="etiqueta">Color de acento</label>
            <input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-200" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Que incluir</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ['mostrar_logo', 'Logo'],
                ['mostrar_sello', 'Sello digital'],
                ['mostrar_firma', 'Firma autorizada'],
                ['mostrar_iva', 'Calculo de IVA'],
                ['mostrar_igtf', 'Recargo IGTF'],
                ['activo', 'Formato activo'],
              ].map(([campo, texto]) => (
                <label key={campo} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500" checked={form[campo]} onChange={toggle(campo)} />
                  {texto}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
