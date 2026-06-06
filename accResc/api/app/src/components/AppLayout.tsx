import { Link, useLocation } from 'react-router'
import { Database, FlaskConical, History, Home } from 'lucide-react'
import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-blue-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:bg-blue-500/30 transition-all" />
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Research Accelerant
                </h1>
                <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide uppercase">Agentic Literature Review</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              <NavLink to="/" icon={<Home className="w-4 h-4" />} label="New Search" active={location.pathname === '/'} />
              <NavLink to="/history" icon={<History className="w-4 h-4" />} label="History" active={location.pathname === '/history'} />
              <NavLink to="/docs" icon={<Database className="w-4 h-4" />} label="Local Docs" active={location.pathname === '/docs'} />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-16 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>Research Accelerant Agent v1.0 — Automating literature review workflows</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MVP + V2 + V3 Active
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, icon, label, active }: { to: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
