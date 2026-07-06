import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function auditEvent(type, payload) {
  try {
    window.dispatchEvent(new CustomEvent('givamic:audit', { detail: { type, payload } }))
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('givamic_user')) } catch { return null }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('givamic_user', JSON.stringify(userData))
    auditEvent('USER_LOGIN', { nombre: userData.nombre, rol: userData.rol, email: userData.email })
  }

  const logout = () => {
    const u = user
    setUser(null)
    localStorage.removeItem('givamic_user')
    if (u) auditEvent('USER_LOGOUT', { nombre: u.nombre, rol: u.rol })
  }

  const updateUser = (fields) => {
    const updated = { ...user, ...fields }
    setUser(updated)
    localStorage.setItem('givamic_user', JSON.stringify(updated))
  }

  const isAdmin          = user?.rol === 'Administrador'
  const isGerencia       = user?.rol === 'Gerencia'
  const isAlmacen        = user?.rol === 'Almacenero' || user?.rol === 'Asistente Almacén'
  const isCoordLogistica = user?.rol === 'Coordinador Logística y Compras' || user?.rol === 'Administrador'
  const isJefeRRHH       = user?.rol === 'Jefe RRHH' || user?.rol === 'Administrador'
  const isAdminEmpresa   = user?.rol === 'Administrador de Empresa' || user?.rol === 'Administrador'
  const isAsistLogistica = user?.rol === 'Asistente Logística'
  const isFacturacion    = user?.rol === 'Facturación'
  const isContador       = user?.rol === 'Contador'
  const isCoordGen       = user?.rol === 'Coordinador General' || user?.rol === 'Administrador'
  const isCoordOps       = user?.rol === 'Coordinador Operaciones'
  const isAuditor        = user?.rol === 'Auditor' || user?.rol === 'Administrador'
  const puedeAtenderREQ  = isAdmin || isCoordLogistica

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser,
      isAdmin, isGerencia, isAlmacen, isContador,
      isCoordGen, isCoordOps, isCoordLogistica, isJefeRRHH,
      isAdminEmpresa, isAsistLogistica, isFacturacion, isAuditor, puedeAtenderREQ }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
