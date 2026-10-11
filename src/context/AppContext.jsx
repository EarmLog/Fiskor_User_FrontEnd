// ============================================================
// Contexto de la aplicacion: empresa activa, tasa del dia y caja.
// Compartimos aqui los datos que se ven en tiempo real en la barra
// superior y los metodos de conversion de moneda.
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

import { api } from '../services/api'
import { leerToken } from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [empresa, setEmpresa] = useState(null)
  const [tasa, setTasa] = useState({ valor: 0, fuente: 'api' })
  const [caja, setCaja] = useState(null)
  const [parametros, setParametros] = useState({})
  const [cargando, setCargando] = useState(true)

  const recargarTasa = useCallback(async () => {
    if (!leerToken()) return
    try {
      const { data } = await api.get('/tasas/actual')
      if (data.exito) setTasa(data.datos)
    } catch {
      // sin conexion: mantenemos la ultima tasa
    }
  }, [])

  const recargarEmpresa = useCallback(async () => {
    if (!leerToken()) return
    try {
      const { data } = await api.get('/empresa/actual')
      if (data.exito) setEmpresa(data.datos)
    } catch {
      // si no hay empresa configurada, seguimos
    }
  }, [])

  const recargarCaja = useCallback(async () => {
    if (!leerToken()) return
    try {
      const { data } = await api.get('/tesoreria/caja/actual')
      if (data.exito) setCaja(data.datos)
    } catch {
      // no hay caja abierta
    }
  }, [])

  const recargarParametros = useCallback(async () => {
    if (!leerToken()) return
    try {
      const { data } = await api.get('/empresa/parametros')
      if (data.exito) setParametros(data.datos)
    } catch {
      // ignoramos
    }
  }, [])

  // Carga inicial de todos los datos de contexto.
  useEffect(() => {
    const iniciar = async () => {
      if (leerToken()) {
        await Promise.all([
          recargarEmpresa(),
          recargarTasa(),
          recargarCaja(),
          recargarParametros(),
        ])
      }
      setCargando(false)
    }
    iniciar()
  }, [recargarEmpresa, recargarTasa, recargarCaja, recargarParametros])

  const recargarTodo = useCallback(async () => {
    setCargando(true)
    await Promise.all([recargarEmpresa(), recargarTasa(), recargarCaja(), recargarParametros()])
    setCargando(false)
  }, [recargarEmpresa, recargarTasa, recargarCaja, recargarParametros])

  // ---- Utilidades de moneda ----
  const tasaValor = tasa?.valor || 0

  const enBolivares = useCallback(
    (divisas) => Number(divisas || 0) * tasaValor,
    [tasaValor],
  )

  const formatoBs = useCallback(
    (numero) => {
      const valor = Number(numero || 0)
      return `Bs. ${valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    [],
  )

  const formatoDivisa = useCallback(
    (numero, moneda = 'USD') => {
      const valor = Number(numero || 0)
      return `${moneda} ${valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    [],
  )

  const tasaDesactualizada = !tasaValor || tasa?.fuente === 'manual' || !tasa?.es_de_hoy

  const valor = useMemo(
    () => ({
      empresa,
      tasa: tasaValor,
      tasaDatos: tasa,
      caja,
      parametros,
      cargando,
      recargarTodo,
      recargarTasa,
      recargarCaja,
      enBolivares,
      formatoBs,
      formatoDivisa,
      tasaDesactualizada,
      setCaja,
    }),
    [
      empresa, tasa, tasaValor, caja, parametros, cargando, recargarTodo,
      recargarTasa, recargarCaja, enBolivares, formatoBs, formatoDivisa, tasaDesactualizada,
    ],
  )

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)