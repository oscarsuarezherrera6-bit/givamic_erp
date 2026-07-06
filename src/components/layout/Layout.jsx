import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* Overlay oscuro en móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — drawer en móvil, fijo en desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
