// ============================================================
// Configuracion de la empresa y de la tasa de cambio.
// Datos fiscales, parametros y gestion de la tasa BCV.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { Building2, Save, RefreshCw, Percent, Landmark, Image as ImageIcon, Upload, Trash2, PenLine, Palette } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api, subirImagenEmpresa, urlImagenEmpresa } from '../services/api'
import {
  Alerta,
  Boton,
  Cargando,
  Entrada,
  Insignia,
  Tarjeta,
} from '../components/ui'

// Tarjeta reutilizable para subir/reemplazar una imagen corporativa.
function ImagenCorporativa({ empresaId, tipo, titulo, descripcion, existente, version, onSubida, onBorrada }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const entradaRef = useRef(null)

  const escoger = () => entradaRef.current?.click()

  const manejarArchivo = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setError('')
    setSubiendo(true)
    try {
      await subirImagenEmpresa(empresaId, tipo, archivo)
      onSubida()
    } catch (err) {
      setError(err.mensaje || 'No se pudo subir la imagen')
    } finally {
      setSubiendo(false)
      if (entradaRef.current) entradaRef.current.value = ''
    }
  }

  const borrar = async () => {
    if (!window.confirm(`Quitar ${titulo.toLowerCase()}?`)) return
    try {
      await api.delete(`/empresa/${empresaId}/imagenes/${tipo}`)
      onBorrada()
    } catch (err) {
      setError(err.mensaje || 'No se pudo quitar la imagen')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">{titulo}</p>
          <p className="text-xs text-slate-400">{descripcion}</p>
        </div>
        {existente && <Insignia color="verde">Cargado</Insignia>}
      </div>

      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
        {existente ? (
          <img
            src={urlImagenEmpresa(empresaId, tipo, version)}
            alt={titulo}
            className="max-h-full max-w-full object-contain p-2"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageIcon size={26} />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <input ref={entradaRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={manejarArchivo} />

      <div className="mt-3 flex gap-2">
        <Boton secundario tamaño="chico" className="flex-1" onClick={escoger} disabled={subiendo}>
          <Upload size={14} /> {subiendo ? 'Subiendo...' : existente ? 'Reemplazar' : 'Subir'}
        </Boton>
        {existente && (
          <Boton peligro tamaño="chico" onClick={borrar}>
            <Trash2 size={14} />
          </Boton>
        )}
      </div>
    </div>
  )
}

export default function Empresa() {
  const { empresa, tasa, tasaDatos, recargarTodo } = useApp()
  const [form, setForm] = useState(null)
  const [historial, setHistorial] = useState([])
  const [tasaManual, setTasaManual] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [imagenes, setImagenes] = useState({ logo: false, sello: false, firma: false })
  const [versiones, setVersiones] = useState({ logo: '', sello: '', firma: '' })

  const cargar = async () => {
    setCargando(true)
    try {
      const [respEmpresa, respHistorial] = await Promise.all([
        api.get('/empresa/actual'),
        api.get('/tasas/historial', { params: { limite: 15 } }),
      ])
      const datos = respEmpresa.data.datos
      setForm({
        nombre: datos.nombre || '',
        nombre_fiscal: datos.nombre_fiscal || '',
        rif: datos.rif || '',
        direccion: datos.direccion || '',
        telefono: datos.telefono || '',
        email: datos.email || '',
        serial_onat: datos.serial_onat || '',
        contribuyente_especial: !!datos.contribuyente_especial,
        porcentaje_iva: datos.porcentaje_iva ?? 16,
        porcentaje_igtf: datos.porcentaje_igtf ?? 3,
        inicio_ejercicio: datos.inicio_ejercicio || '',
        cierre_ejercicio: datos.cierre_ejercicio || '',
        firma_nombre: datos.firma_nombre || '',
        firma_cargo: datos.firma_cargo || '',
        color_marca: datos.color_marca || '#1d4ed8',
        pie_documento: datos.pie_documento || '',
        id: datos.id,
      })
      setImagenes({
        logo: !!datos.tiene_logo,
        sello: !!datos.tiene_sello,
        firma: !!datos.tiene_firma,
      })
      setVersiones({ logo: Date.now(), sello: Date.now(), firma: Date.now() })
      setHistorial(respHistorial.data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const marcarImagen = (tipo, presente) => {
    setImagenes((prev) => ({ ...prev, [tipo]: presente }))
    setVersiones((prev) => ({ ...prev, [tipo]: Date.now() }))
  }

  const guardar = async () => {
    setError('')
    setMensaje('')
    if (!form.nombre) {
      setError('El nombre de la empresa es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const { data } = await api.put(`/empresa/${form.id}`, form)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setMensaje('Datos de la empresa actualizados')
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const actualizarTasa = async () => {
    setError('')
    setMensaje('')
    try {
      const { data } = await api.post('/tasas/actualizar')
      if (data.exito) {
        setMensaje(data.mensaje)
        recargarTodo()
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo actualizar la tasa')
    }
  }

  const cargarTasaManual = async () => {
    setError('')
    setMensaje('')
    const valor = Number(tasaManual)
    if (!valor || valor <= 0) {
      setError('Indique un valor de tasa valido')
      return
    }
    try {
      const { data } = await api.post('/tasas/manual', { valor })
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setMensaje('Tasa cargada manualmente')
        setTasaManual('')
        recargarTodo()
        cargar()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo cargar la tasa')
    }
  }

  if (cargando || !form) return <Cargando mensaje="Cargando configuracion..." />

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Empresa y configuracion</h2>
        <p className="text-sm text-slate-500">Datos fiscales, tributarios y tasa de cambio</p>
      </div>

      {error && <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>}
      {mensaje && <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Datos de la empresa */}
        <div className="lg:col-span-2">
          <Tarjeta>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <Building2 size={18} /> Datos de la empresa
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Entrada etiqueta="Nombre comercial" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Entrada etiqueta="Razon social" value={form.nombre_fiscal} onChange={(e) => setForm({ ...form, nombre_fiscal: e.target.value })} />
              </div>
              <Entrada etiqueta="RIF" value={form.rif} onChange={(e) => setForm({ ...form, rif: e.target.value })} />
              <Entrada etiqueta="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <Entrada etiqueta="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Entrada etiqueta="Serial ONAT" value={form.serial_onat} onChange={(e) => setForm({ ...form, serial_onat: e.target.value })} />
              <div className="sm:col-span-2">
                <Entrada etiqueta="Direccion fiscal" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
              <Entrada etiqueta="Inicio del ejercicio" type="date" value={form.inicio_ejercicio} onChange={(e) => setForm({ ...form, inicio_ejercicio: e.target.value })} />
              <Entrada etiqueta="Cierre del ejercicio" type="date" value={form.cierre_ejercicio} onChange={(e) => setForm({ ...form, cierre_ejercicio: e.target.value })} />
            </div>

            <h3 className="mb-4 mt-6 flex items-center gap-2 font-semibold text-slate-800">
              <Percent size={18} /> Condiciones tributarias
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Entrada etiqueta="IVA general (%)" type="number" value={form.porcentaje_iva} onChange={(e) => setForm({ ...form, porcentaje_iva: e.target.value })} />
              <Entrada etiqueta="IGTF (%)" type="number" value={form.porcentaje_igtf} onChange={(e) => setForm({ ...form, porcentaje_igtf: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
                  checked={form.contribuyente_especial}
                  onChange={(e) => setForm({ ...form, contribuyente_especial: e.target.checked })}
                />
                Somos contribuyente especial
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <Boton onClick={guardar} disabled={guardando}>
                <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Boton>
            </div>
          </Tarjeta>
        </div>

        {/* Tasa de cambio */}
        <div className="space-y-5">
          <Tarjeta>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <Landmark size={18} /> Tasa del dia
            </h3>
            <div className="mb-3 rounded-xl bg-marca-50 px-4 py-3">
              <p className="text-xs text-marca-600">1 USD equivale a</p>
              <p className="text-2xl font-bold text-marca-700">
                Bs. {Number(tasa).toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Insignia color={tasaDatos?.fuente === 'manual' ? 'amarillo' : 'verde'}>
                  {tasaDatos?.fuente === 'manual' ? 'Manual' : 'Automatica'}
                </Insignia>
                {tasaDatos?.es_de_hoy ? (
                  <span className="text-xs text-slate-400">actualizada hoy</span>
                ) : (
                  <span className="text-xs text-amber-600">no es de hoy</span>
                )}
              </div>
            </div>
            <Boton secundario className="w-full" onClick={actualizarTasa}>
              <RefreshCw size={16} /> Consultar API del dia
            </Boton>
          </Tarjeta>

          <Tarjeta>
            <h3 className="mb-3 font-semibold text-slate-800">Carga manual</h3>
            <p className="mb-3 text-xs text-slate-400">
              Use esta opcion cuando no haya internet. La tasa manual queda registrada con su usuario.
            </p>
            <div className="flex gap-2">
              <input
                className="campo flex-1"
                type="number"
                step="0.01"
                placeholder="Ej: 876.79"
                value={tasaManual}
                onChange={(e) => setTasaManual(e.target.value)}
              />
              <Boton onClick={cargarTasaManual}>Cargar</Boton>
            </div>
          </Tarjeta>

          <Tarjeta>
            <h3 className="mb-3 font-semibold text-slate-800">Historial de tasas</h3>
            <ul className="divide-y divide-slate-100">
              {historial.map((t) => (
                <li key={`${t.fecha}-${t.fuente}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">{t.fecha}</span>
                  <span className="font-medium text-slate-700">Bs. {Number(t.valor).toFixed(2)}</span>
                  <Insignia color={t.fuente === 'manual' ? 'amarillo' : 'verde'}>{t.fuente}</Insignia>
                </li>
              ))}
              {historial.length === 0 && <li className="py-2 text-sm text-slate-400">Sin historial</li>}
            </ul>
          </Tarjeta>
        </div>
      </div>

      {/* Imagen corporativa: logo, sello digital y firma autorizada */}
      <Tarjeta>
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
          <ImageIcon size={18} /> Imagen corporativa e identidad
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Estas imagenes se estampan en facturas, notas de entrega y reportes. El sello y la firma se colocan al pie del documento.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ImagenCorporativa
            empresaId={form.id}
            tipo="logo"
            titulo="Logo"
            descripcion="Esquina superior, PNG con fondo transparente"
            existente={imagenes.logo}
            version={versiones.logo}
            onSubida={() => marcarImagen('logo', true)}
            onBorrada={() => marcarImagen('logo', false)}
          />
          <ImagenCorporativa
            empresaId={form.id}
            tipo="sello"
            titulo="Sello digital"
            descripcion="Estampado al pie, junto a la firma"
            existente={imagenes.sello}
            version={versiones.sello}
            onSubida={() => marcarImagen('sello', true)}
            onBorrada={() => marcarImagen('sello', false)}
          />
          <ImagenCorporativa
            empresaId={form.id}
            tipo="firma"
            titulo="Firma autorizada"
            descripcion="Firma del representante legal"
            existente={imagenes.firma}
            version={versiones.firma}
            onSubida={() => marcarImagen('firma', true)}
            onBorrada={() => marcarImagen('firma', false)}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Entrada etiqueta="Nombre del firmante" value={form.firma_nombre} onChange={(e) => setForm({ ...form, firma_nombre: e.target.value })} placeholder="Que aparece bajo la firma" />
          <Entrada etiqueta="Cargo del firmante" value={form.firma_cargo} onChange={(e) => setForm({ ...form, firma_cargo: e.target.value })} placeholder="Gerente General" />
          <div>
            <label className="etiqueta flex items-center gap-1"><Palette size={13} /> Color de marca (documentos)</label>
            <input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-200" value={form.color_marca} onChange={(e) => setForm({ ...form, color_marca: e.target.value })} />
          </div>
          <div>
            <label className="etiqueta flex items-center gap-1"><PenLine size={13} /> Pie de documento</label>
            <textarea className="campo" rows="1" value={form.pie_documento} onChange={(e) => setForm({ ...form, pie_documento: e.target.value })} placeholder="Gracias por su preferencia" />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Boton onClick={guardar} disabled={guardando}>
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar identidad'}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  )
}