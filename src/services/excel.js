import { api, leerToken } from './api'

export const exportarExcelTabla = async (tabla, nombreDescarga) => {
  const respuesta = await api.get(`/excel/exportar/${tabla}`, { responseType: 'blob' })
  const blob = new Blob([respuesta.data])
  const url = window.URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreDescarga || `${tabla}.xlsx`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL(url)
}

export const importarExcelTabla = async (tabla, archivo) => {
  const datos = new FormData()
  datos.append('archivo', archivo)
  const { data } = await api.post(`/excel/importar/${tabla}`, datos, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
