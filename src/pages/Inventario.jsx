// ============================================================
// Inventario: productos, categorias y ajustes de stock.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { Package, Plus, Search, Pencil, Trash2, Tags, SlidersHorizontal, PackagePlus, Upload, Download, FileSpreadsheet, CheckCircle2, X } from 'lucide-react'

import { useApp } from '../context/AppContext'
import { api, descargarArchivo } from '../services/api'
import { exportarExcelTabla, importarExcelTabla } from '../services/excel'
import ExcelActions from '../components/ExcelActions'
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
import { Monto } from '../components/ui'

const FILA = (producto, acciones) => ({
  celdas: [
    producto.codigo,
    producto.nombre,
    producto.categoria_nombre || 'General',
    <Monto numero={producto.costo_divisa} tipo="usd" />,
    <Monto numero={producto.precio_divisa} tipo="usd" />,
    <span className={producto.alerta_stock ? 'font-semibold text-red-500' : ''}>{producto.stock_actual}</span>,
    <span className="text-xs text-slate-400">{producto.iva_porcentaje}%</span>,
    <Insignia color={producto.activo ? 'verde' : 'gris'}>{producto.activo ? 'Activo' : 'Inactivo'}</Insignia>,
  ],
  acciones,
})

export default function Inventario() {
  const { formatoBs, enBolivares, recargarTodo } = useApp()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  const [modal, setModal] = useState(null) // 'nuevo' | 'editar' | 'categorias' | 'ajuste'
  const [seleccionado, setSeleccionado] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Importacion/exportacion de Excel
  const [archivoImportar, setArchivoImportar] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultadoImport, setResultadoImport] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const inputArchivoRef = useRef(null)

  // Formulario del producto
  const [productoForm, setProductoForm] = useState({
    codigo: '',
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    unidad_medida: 'UND',
    costo_divisa: 0,
    precio_divisa: 0,
    iva_porcentaje: 16,
    stock_actual: 0,
    stock_minimo: 0,
  })

  const cargar = async () => {
    setCargando(true)
    try {
      const [resp, respCat] = await Promise.all([
        api.get('/inventario/productos', { params: { por_pagina: 500 } }),
        api.get('/inventario/categorias'),
      ])
      setProductos(resp.data.datos.items || [])
      setCategorias(respCat.data.datos || [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const exportarExcel = async () => {
    setError('')
    setMensaje('')
    setExportando(true)
    try {
      const { data } = await api.get('/inventario/exportar')
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      // El backend devuelve la ruta absoluta; extraemos el nombre del archivo.
      const nombre = String(data.datos.archivo).split(/[\\/]/).pop()
      await descargarArchivo('excel', nombre, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
      setMensaje('Inventario exportado correctamente')
    } catch (err) {
      setError(err.mensaje || 'No se pudo exportar el inventario')
    } finally {
      setExportando(false)
    }
  }

  const abrirImportar = () => {
    setArchivoImportar(null)
    setResultadoImport(null)
    setError('')
    setModal('importar')
  }

  const seleccionarArchivo = (archivo) => {
    if (!archivo) return
    if (!/\.(xlsx|xls)$/i.test(archivo.name)) {
      setError('El archivo debe ser un Excel (.xlsx o .xls)')
      return
    }
    setError('')
    setResultadoImport(null)
    setArchivoImportar(archivo)
  }

  const importarExcel = async () => {
    if (!archivoImportar) {
      setError('Seleccione un archivo Excel')
      return
    }
    setError('')
    setMensaje('')
    setImportando(true)
    try {
      const datos = new FormData()
      datos.append('archivo', archivoImportar)
      const { data } = await api.post('/inventario/importar', datos, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      setResultadoImport(data.datos)
      cargar()
      recargarTodo()
    } catch (err) {
      setError(err.mensaje || 'No se pudo importar el archivo')
    } finally {
      setImportando(false)
    }
  }

  const abrirNuevo = () => {
    setProductoForm({
      codigo: '',
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      categoria_id: '',
      unidad_medida: 'UND',
      costo_divisa: 0,
      precio_divisa: 0,
      iva_porcentaje: 16,
      stock_actual: 0,
      stock_minimo: 0,
    })
    setError('')
    setModal('nuevo')
  }

  const abrirEditar = (producto) => {
    setSeleccionado(producto)
    setProductoForm({
      codigo: producto.codigo || '',
      codigo_barras: producto.codigo_barras || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      categoria_id: producto.categoria_id || '',
      unidad_medida: producto.unidad_medida || 'UND',
      costo_divisa: producto.costo_divisa || 0,
      precio_divisa: producto.precio_divisa || 0,
      iva_porcentaje: producto.iva_porcentaje || 16,
      stock_actual: producto.stock_actual || 0,
      stock_minimo: producto.stock_minimo || 0,
    })
    setError('')
    setModal('editar')
  }

  const guardarProducto = async () => {
    setError('')
    if (!productoForm.nombre || !productoForm.codigo) {
      setError('El nombre y el codigo son obligatorios')
      return
    }
    setGuardando(true)
    try {
      const cuerpo = { ...productoForm, categoria_id: productoForm.categoria_id || null }
      if (modal === 'nuevo') {
        const { data } = await api.post('/inventario/productos', cuerpo)
        if (!data.exito) setError(data.mensaje)
      } else {
        const { data } = await api.put(`/inventario/productos/${seleccionado.id}`, cuerpo)
        if (!data.exito) setError(data.mensaje)
      }
      if (!error) {
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

  const desactivarProducto = async (producto) => {
    if (!window.confirm(`¿Desactivar el producto "${producto.nombre}"?`)) return
    setError('')
    try {
      const { data } = await api.delete(`/inventario/productos/${producto.id}`)
      if (!data.exito) {
        setError(data.mensaje)
        return
      }
      cargar()
    } catch (err) {
      setError(err.mensaje || 'No se pudo desactivar el producto')
    }
  }

  // ---- Ajuste de inventario ----
  const [ajuste, setAjuste] = useState({ tipo: 'entrada', cantidad: 1, motivo: 'Conteo fisico' })
  const abrirAjuste = (producto) => {
    setSeleccionado(producto)
    setAjuste({ tipo: 'entrada', cantidad: 1, motivo: 'Conteo fisico' })
    setError('')
    setModal('ajuste')
  }

  const guardarAjuste = async () => {
    setError('')
    if (!ajuste.cantidad || ajuste.cantidad <= 0) {
      setError('La cantidad debe ser mayor que cero')
      return
    }
    setGuardando(true)
    try {
      const { data } = await api.post(`/inventario/productos/${seleccionado.id}/ajuste`, ajuste)
      if (!data.exito) {
        setError(data.mensaje)
      } else {
        setModal(null)
        cargar()
        recargarTodo()
      }
    } catch (err) {
      setError(err.mensaje || 'No se pudo hacer el ajuste')
    } finally {
      setGuardando(false)
    }
  }

  // ---- Categorias ----
  const [categoriaNueva, setCategoriaNueva] = useState('')
  const crearCategoria = async () => {
    if (!categoriaNueva.trim()) return
    try {
      await api.post('/inventario/categorias', { nombre: categoriaNueva.trim() })
      setCategoriaNueva('')
      cargar()
    } catch {
      setError('No se pudo crear la categoria')
    }
  }

  const productosFiltrados = productos
    .filter((p) => {
      const texto = busqueda.trim().toLowerCase()
      if (!texto) return true
      return (
        p.nombre?.toLowerCase().includes(texto) ||
        p.codigo?.toLowerCase().includes(texto) ||
        p.codigo_barras?.toLowerCase().includes(texto)
      )
    })
    .sort((a, b) => b.alerta_stock - a.alerta_stock)

  const resumen = {
    total: productos.length,
    bajoStock: productos.filter((p) => p.alerta_stock).length,
    valor: productos.reduce((suma, p) => suma + (p.costo_divisa || 0) * (p.stock_actual || 0), 0),
  }

  if (cargando && !productos.length) return <Cargando mensaje="Cargando inventario..." />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventario</h2>
          <p className="text-sm text-slate-500">Productos, categorias y stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            tabla="productos"
            exportando={exportando}
            importando={importando}
            onExportar={async () => {
              setExportando(true)
              try {
                await exportarExcelTabla('productos', `productos_${new Date().toISOString().slice(0,10)}.xlsx`)
                setMensaje('Productos exportados a Excel')
              } catch (e) {
                setError(e.mensaje || 'No se pudo exportar')
              } finally {
                setExportando(false)
              }
            }}
            onImportar={async (archivo) => {
              setImportando(true)
              setError('')
              setMensaje('')
              try {
                const res = await importarExcelTabla('productos', archivo)
                if (res.exito) {
                  setMensaje(`Importados/actualizados: ${res.datos.procesados}`)
                  cargar()
                } else {
                  setError(res.mensaje)
                }
              } catch (e) {
                setError(e.mensaje || 'No se pudo importar')
              } finally {
                setImportando(false)
              }
            }}
          />
          <Boton secundario onClick={() => setModal('categorias')}>
            <Tags size={16} /> Categorias
          </Boton>
          <Boton onClick={abrirNuevo}>
            <Plus size={16} /> Nuevo producto
          </Boton>
        </div>
      </div>

      {error && (
        <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>
      )}
      {mensaje && (
        <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-marca-50 p-3 text-marca-600"><Package size={20} /></span>
            <div>
              <p className="text-sm text-slate-500">Productos activos</p>
              <p className="text-2xl font-bold text-slate-800">{resumen.total}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className={`rounded-lg p-3 ${resumen.bajoStock ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
              <PackagePlus size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Bajo stock</p>
              <p className="text-2xl font-bold text-slate-800">{resumen.bajoStock}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-50 p-3 text-emerald-600"><SlidersHorizontal size={20} /></span>
            <div>
              <p className="text-sm text-slate-500">Valor del inventario</p>
              <p className="text-2xl font-bold text-slate-800"><Monto numero={resumen.valor} tipo="usd" /></p>
            </div>
          </div>
        </Tarjeta>
      </div>

      <Entrada
        icono={Search}
        placeholder="Buscar por codigo, nombre o codigo de barras..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {productosFiltrados.length ? (
        <div className="tarjeta overflow-hidden">
          <Tabla
            columnas={['Codigo', 'Nombre', 'Categoria', 'Costo', 'Precio', 'Stock', 'IVA', 'Estado', '']}
            filas={productosFiltrados.map((producto) =>
              FILA(producto, [
                {
                  icono: Pencil,
                  titulo: 'Editar',
                  color: 'azul',
                  onClick: () => abrirEditar(producto),
                },
                {
                  icono: SlidersHorizontal,
                  titulo: 'Ajustar stock',
                  color: 'ambar',
                  onClick: () => abrirAjuste(producto),
                },
                {
                  icono: Trash2,
                  titulo: 'Desactivar',
                  color: 'rojo',
                  onClick: () => desactivarProducto(producto),
                },
              ]),
            )}
          />
        </div>
      ) : (
        <Tarjeta>
          <Vacio mensaje="No hay productos que coincidan" />
        </Tarjeta>
      )}

      {/* ===== Modal de producto (nuevo/editar) ===== */}
      <Modal
        titulo={modal === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
        abierto={modal === 'nuevo' || modal === 'editar'}
        onCerrar={() => setModal(null)}
        ancho="max-w-2xl"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton onClick={guardarProducto} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar producto'}
            </Boton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Entrada etiqueta="Nombre del producto" placeholder="Ej: Harina de trigo 1kg" value={productoForm.nombre} onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })} />
          </div>
          <Entrada etiqueta="Codigo" placeholder="Ej: 0001" value={productoForm.codigo} onChange={(e) => setProductoForm({ ...productoForm, codigo: e.target.value })} />
          <Entrada etiqueta="Codigo de barras" placeholder="Opcional" value={productoForm.codigo_barras} onChange={(e) => setProductoForm({ ...productoForm, codigo_barras: e.target.value })} />
          <Seleccion
            etiqueta="Categoria"
            valorVacio="General"
            value={productoForm.categoria_id}
            onChange={(e) => setProductoForm({ ...productoForm, categoria_id: e.target.value })}
            opciones={categorias.map((c) => ({ valor: String(c.id), texto: c.nombre }))}
          />
          <Entrada etiqueta="Unidad de medida" value={productoForm.unidad_medida} onChange={(e) => setProductoForm({ ...productoForm, unidad_medida: e.target.value })} />
          <Entrada etiqueta="Costo (USD)" type="number" step="0.01" value={productoForm.costo_divisa} onChange={(e) => setProductoForm({ ...productoForm, costo_divisa: e.target.value })} />
          <Entrada etiqueta="Precio de venta (USD)" type="number" step="0.01" value={productoForm.precio_divisa} onChange={(e) => setProductoForm({ ...productoForm, precio_divisa: e.target.value })} />
          <Entrada etiqueta="IVA %" type="number" value={productoForm.iva_porcentaje} onChange={(e) => setProductoForm({ ...productoForm, iva_porcentaje: e.target.value })} />
          <Seleccion
            etiqueta="IVA"
            value={productoForm.iva_porcentaje}
            onChange={(e) => setProductoForm({ ...productoForm, iva_porcentaje: e.target.value })}
            opciones={[
              { valor: '16', texto: '16%' },
              { valor: '0', texto: 'Exento 0%' },
            ]}
          />
          <Entrada etiqueta="Stock actual" type="number" value={productoForm.stock_actual} disabled onChange={() => {}} />
          <Entrada etiqueta="Stock minimo" type="number" value={productoForm.stock_minimo} onChange={(e) => setProductoForm({ ...productoForm, stock_minimo: e.target.value })} />
          <div className="sm:col-span-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Precio en bolivares: <span className="font-semibold">{formatoBs(enBolivares(Number(productoForm.precio_divisa) || 0))}</span>
          </div>
        </div>
      </Modal>

      {/* ===== Modal de ajuste de stock ===== */}
      <Modal
        titulo="Ajuste de stock"
        abierto={modal === 'ajuste'}
        onCerrar={() => setModal(null)}
        ancho="max-w-md"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton onClick={guardarAjuste} disabled={guardando}>
              {guardando ? 'Aplicando...' : 'Aplicar ajuste'}
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {seleccionado?.nombre} — stock actual: <span className="font-semibold">{seleccionado?.stock_actual}</span>
          </p>
          <Seleccion
            etiqueta="Tipo"
            value={ajuste.tipo}
            onChange={(e) => setAjuste({ ...ajuste, tipo: e.target.value })}
            opciones={[
              { valor: 'entrada', texto: 'Entrada (+)' },
              { valor: 'salida', texto: 'Salida (-)' },
            ]}
          />
          <Entrada etiqueta="Cantidad" type="number" value={ajuste.cantidad} onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })} />
          <Entrada etiqueta="Motivo" value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} />
        </div>
      </Modal>

      {/* ===== Modal de importacion desde Excel ===== */}
      <Modal
        titulo="Importar productos desde Excel"
        abierto={modal === 'importar'}
        onCerrar={() => setModal(null)}
        ancho="max-w-lg"
        acciones={
          <>
            <Boton secundario onClick={() => setModal(null)}>Cerrar</Boton>
            <Boton onClick={importarExcel} disabled={importando || !archivoImportar}>
              <Upload size={16} /> {importando ? 'Importando...' : 'Importar'}
            </Boton>
          </>
        }
      >
        {!resultadoImport ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              El archivo debe tener al menos las columnas <span className="font-medium">Codigo</span> y{' '}
              <span className="font-medium">Nombre</span>. Tambien se leen: Costo USD, Precio USD, Stock y Stock minimo.
            </p>

            <label
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastrando(false); seleccionarArchivo(e.dataTransfer.files?.[0]) }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                arrastrando ? 'border-marca-400 bg-marca-50' : 'border-slate-300 bg-slate-50 hover:border-marca-300'
              }`}
            >
              <input
                ref={inputArchivoRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => seleccionarArchivo(e.target.files?.[0])}
              />
              <FileSpreadsheet className="text-marca-500" size={32} />
              <p className="text-sm font-medium text-slate-700">Arrastra el Excel aqui o haz clic para elegir</p>
              <p className="text-xs text-slate-400">Formatos: .xlsx, .xls</p>
            </label>

            {archivoImportar && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  {archivoImportar.name}
                </span>
                <button onClick={() => setArchivoImportar(null)} className="text-slate-400 hover:text-red-500" aria-label="Quitar archivo">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={44} />
            <p className="font-semibold text-slate-800">Importacion finalizada</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50 px-3 py-3">
                <p className="text-2xl font-bold text-emerald-700">{resultadoImport.creados}</p>
                <p className="text-xs text-emerald-600">Creados</p>
              </div>
              <div className="rounded-lg bg-sky-50 px-3 py-3">
                <p className="text-2xl font-bold text-sky-700">{resultadoImport.actualizados}</p>
                <p className="text-xs text-sky-600">Actualizados</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-3">
                <p className="text-2xl font-bold text-amber-700">{resultadoImport.errores}</p>
                <p className="text-xs text-amber-600">Con errores</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Modal de categorias ===== */}
      <Modal
        titulo="Categorias"
        abierto={modal === 'categorias'}
        onCerrar={() => setModal(null)}
        ancho="max-w-md"
      >
        <div className="mb-4 flex gap-2">
          <input
            className="campo flex-1"
            placeholder="Nombre de la categoria"
            value={categoriaNueva}
            onChange={(e) => setCategoriaNueva(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crearCategoria()}
          />
          <Boton onClick={crearCategoria}><Plus size={16} /> Agregar</Boton>
        </div>
        <ul className="space-y-2">
          {categorias.map((categoria) => (
            <li key={categoria.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2 text-sm">
              <span className="font-medium text-slate-700">{categoria.nombre}</span>
              <Insignia color="azul">{categoria.producto_count ?? '--'} productos</Insignia>
            </li>
          ))}
          {categorias.length === 0 && <li className="text-sm text-slate-400">Sin categorias creadas</li>}
        </ul>
      </Modal>
    </div>
  )
}