// ============================================================
// Modales flotantes con fondo difuminado (backdrop blur).
// Las creaciones y ediciones criticas del ERP usan este modal.
// ============================================================
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ titulo, abierto, onCerrar, children, acciones, ancho = 'max-w-lg' }) {
  // Cerramos con la tecla Escape y bloqueamos el scroll de fondo.
  useEffect(() => {
    if (!abierto) return
    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      {/* Fondo difuminado: haz clic fuera para cerrar */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCerrar}
      />

      <div className={`relative w-full ${ancho} rounded-2xl bg-white shadow-modal animate-zoom-in`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{titulo}</h3>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">{children}</div>
        {acciones && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            {acciones}
          </div>
        )}
      </div>
    </div>
  )
}