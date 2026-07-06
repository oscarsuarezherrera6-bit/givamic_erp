import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { UserIcon, ArrowRightOnRectangleIcon, BellIcon, MoonIcon, SunIcon, TrashIcon, CheckIcon, Bars3Icon } from '@heroicons/react/24/outline'

function getInitials(nombre) {
  if (!nombre) return '?'
  const parts = nombre.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

const NOTIF_COLOR = {
  req:      'bg-blue-100 text-blue-600',
  req_pago: 'bg-green-100 text-green-600',
  oc:       'bg-purple-100 text-purple-600',
  almacen:  'bg-orange-100 text-orange-600',
  sistema:  'bg-gray-100 text-gray-500',
}

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('givamic-dark') === '1' } catch { return false }
  })

  const avatarRef = useRef()
  const bellRef = useRef()

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('givamic-dark', '1')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('givamic-dark', '0')
    }
  }

  // Notifications for current user's role
  const misNotifs = (state.notificaciones || [])
    .filter(n => n.paraRoles?.includes(user?.rol))
    .slice(0, 50)
  const noLeidas = misNotifs.filter(n => !n.leido).length

  const handleBellOpen = () => {
    setBellOpen(v => !v)
    setOpen(false)
  }

  const markRead = (id) => dispatch({ type: 'MARK_READ', id })

  const markAllRead = () => {
    misNotifs.filter(n => !n.leido).forEach(n => dispatch({ type: 'MARK_READ', id: n.id }))
  }

  const deleteNotif = (e, id) => {
    e.stopPropagation()
    dispatch({ type: 'DELETE_NOTIF', id })
  }

  const handleNotifClick = (n) => {
    if (!n.leido) markRead(n.id)
    setBellOpen(false)
    if (n.link) navigate(n.link)
  }

  const initials = getInitials(user?.nombre)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 dark:bg-gray-800 dark:border-gray-700">
      {/* Left: hamburger (móvil) + logo + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — solo móvil */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        {state.logo
          ? <img src={state.logo} alt="Logo" className="h-9 object-contain" />
          : <div className="bg-[#1e3a5f] text-white text-xs font-bold px-3 py-1.5 rounded">GIVAMIC</div>
        }
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-gray-800 leading-none dark:text-gray-100">GIVAMIC - Sistema de Gestión</p>
          <p className="text-xs text-gray-400 mt-0.5">Sistema Integrado de Gestión</p>
        </div>
      </div>

      {/* Right: icons + avatar */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </button>

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellOpen}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            title="Notificaciones"
          >
            <BellIcon className="w-5 h-5" />
            {noLeidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                {noLeidas > 99 ? '99+' : noLeidas}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Notificaciones</p>
                  {noLeidas > 0 && (
                    <p className="text-xs text-gray-400">{noLeidas} sin leer</p>
                  )}
                </div>
                {noLeidas > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <CheckIcon className="w-3 h-3" />Marcar todas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-80">
                {misNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BellIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Sin notificaciones</p>
                  </div>
                ) : (
                  misNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 transition-colors ${!n.leido ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      {/* Type dot */}
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${NOTIF_COLOR[n.tipo] || NOTIF_COLOR.sistema}`}>
                        {n.tipo === 'req' ? '📋' : n.tipo === 'req_pago' ? '💰' : n.tipo === 'oc' ? '📦' : n.tipo === 'almacen' ? '📥' : '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${n.leido ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>
                          {n.mensaje}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.creadoEn)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.leido && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <button
                          onClick={(e) => deleteNotif(e, n.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {misNotifs.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => { dispatch({ type: 'CLEAR_NOTIFS', paraRol: user?.rol }); setBellOpen(false) }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Limpiar todas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => { setOpen(v => !v); setBellOpen(false) }}
            className="w-9 h-9 rounded-full bg-[#1e3a5f] text-white text-sm font-bold flex items-center justify-center hover:bg-[#2a4f7c] transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
          >
            {user?.foto
              ? <img src={user.foto} alt="avatar" className="w-full h-full object-cover" />
              : initials
            }
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 dark:border-gray-700">
                <div className="w-11 h-11 rounded-full bg-[#1e3a5f] text-white text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.foto
                    ? <img src={user.foto} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-0.5 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{user?.rol}</span>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); navigate('/perfil') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-400" />Perfil
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setOpen(false); logout() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
