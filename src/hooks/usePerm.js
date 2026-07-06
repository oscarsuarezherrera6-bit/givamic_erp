import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para verificar permisos del usuario actual.
 *
 * Prioridad de resolución:
 *  1. rol === 'Administrador'  → acceso total
 *  2. user.rolERPId            → busca en rolesERP por id
 *  3. user.rol (nombre)        → busca en rolesERP por nombre (usuarios sin rolERPId explícito)
 *  4. configPermisos[rol]      → fallback legacy
 */
export function usePerm() {
  const { state } = useApp()
  const { user } = useAuth()

  const rol = user?.rol || ''
  const isAdmin = rol === 'Administrador'

  // 1. Admin siempre puede todo
  if (isAdmin) {
    return {
      puedeVer:   () => true,
      puedeHacer: () => true,
      modulos: null,
      acciones: null,
      rolERP: null,
    }
  }

  // 2 & 3. Buscar rol ERP: primero por id, luego por nombre de rol
  const rolERPId = user?.rolERPId
  const rolERP = (state.rolesERP || []).find(r => r.id === rolERPId)
    || (state.rolesERP || []).find(r => r.nombre === rol)

  if (rolERP) {
    // Super Admin en rolesERP también puede todo
    if (rolERP.esSuperAdmin) {
      return {
        puedeVer:   () => true,
        puedeHacer: () => true,
        modulos: null,
        acciones: null,
        rolERP,
      }
    }

    const permisos = rolERP.permisos || {}
    const modulosConAcceso = Object.keys(permisos).filter(m => Object.keys(permisos[m] || {}).length > 0)

    return {
      puedeVer:   (modulo) => !!permisos[modulo] && Object.keys(permisos[modulo]).length > 0,
      puedeHacer: (modulo, accion) => accion ? !!permisos[modulo]?.[accion] : !!permisos[modulo],
      modulos: modulosConAcceso,
      acciones: null,
      rolERP,
    }
  }

  // 4. Fallback legacy: configPermisos por nombre de rol
  const cfg = state.configPermisos?.[rol] || { modulos: [], acciones: [] }
  return {
    puedeVer:   (modulo) => cfg.modulos.includes(modulo),
    puedeHacer: (accion) => cfg.acciones.includes(accion),
    modulos:  cfg.modulos,
    acciones: cfg.acciones,
    rolERP: null,
  }
}
