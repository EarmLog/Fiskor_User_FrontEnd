import { FileSpreadsheet, Upload } from 'lucide-react'

import { Boton } from './ui'

export default function ExcelActions({ tabla, onExportar, onImportar, exportando, importando }) {
  const handleFile = (e) => {
    const archivo = e.target.files?.[0]
    if (archivo) onImportar(archivo)
    e.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Boton secundario onClick={onExportar} disabled={exportando}>
        <FileSpreadsheet size={16} /> {exportando ? 'Exportando...' : 'Exportar a Excel'}
      </Boton>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
        <Upload size={16} /> {importando ? 'Importando...' : 'Importar / Actualizar por Excel'}
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={importando} />
      </label>
    </div>
  )
}
