// ============================================================
// Marco de las vistas publicas (login, registro, recuperacion).
// Barra superior minimalista y tarjeta centrada reutilizable.
// ============================================================
import { Banknote } from 'lucide-react'

export default function PublicShell({ titulo, subtitulo, children, ancho = 'max-w-md' }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marca-600 text-white">
            <Banknote size={20} />
          </span>
          <span className="text-lg font-bold text-slate-800">
            Fiskor<span className="text-marca-600">ERP</span>
          </span>
        </div>
        <p className="hidden text-xs text-slate-400 sm:block">
          Sistema de gestion empresarial para Venezuela
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className={`w-full ${ancho} animate-zoom-in rounded-2xl bg-white p-8 shadow-modal`}>
          {(titulo || subtitulo) && (
            <div className="mb-6 text-center">
              {titulo && <h1 className="text-xl font-bold text-slate-800">{titulo}</h1>}
              {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
