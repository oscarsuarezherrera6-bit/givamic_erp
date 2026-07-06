/**
 * DashboardCoordGen.jsx — GIVAMIC ERP
 * Dashboard del Coordinador General — estilo ERP profesional
 */
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheckIcon, CubeIcon, ClipboardDocumentListIcon,
  BuildingOfficeIcon, ArrowPathIcon, ExclamationCircleIcon,
  FireIcon, ChevronDownIcon, ChevronUpIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

// ── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date()
const todayISO = today.toISOString().split('T')[0]

function monthLabel(offset = 0) {
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  return d.toISOString().slice(0, 7)
}

function monthDisplay(ym) {
  const [y, m] = ym.split('-')
  return new Date(y, m - 1).toLocaleString('es-PE', { month: 'long', year: 'numeric' })
}

function daysFromNow(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24))
}

function fmtMoney(n) {
  return 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const greeting = () => {
  const h = today.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TrendBadge({ val, up = true }) {
  if (val === null || val === undefined) return null
  const positive = up ? val >= 0 : val <= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
    }`}>
      {val >= 0
        ? <ArrowTrendingUpIcon className="w-3 h-3" />
        : <ArrowTrendingDownIcon className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>
  )
}

function StatCard({ label, value, sub, trend: t, trendUp = true, alert = false, onClick, Icon, iconBg = 'bg-blue-500' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 flex flex-col justify-between gap-3 shadow-sm transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-px' : ''}
        ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
        <TrendBadge val={t} up={trendUp} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Widget 1: Kits Nuevos en Movimiento ─────────────────────────────────────
function WidgetKitsNuevos({ productos, transferencias }) {
  const [open, setOpen] = useState(false)

  const hace30 = new Date(today); hace30.setDate(hace30.getDate() - 30)
  const hace7  = new Date(today); hace7.setDate(hace7.getDate() - 7)

  const kitsNuevos = useMemo(() =>
    (productos || []).filter(p => {
      const f = p.fechaAlta || p.fechaIngreso || p.createdAt
      return f && new Date(f) >= hace30
    }), [productos])

  const kitsIds = new Set(kitsNuevos.map(p => p.id))

  const mvSemana = useMemo(() => {
    const ids = new Set()
    ;(transferencias || []).forEach(t => {
      if (new Date(t.fecha) >= hace7)
        (t.items || []).forEach(it => { if (kitsIds.has(it.productoId)) ids.add(it.productoId) })
    })
    return ids
  }, [transferencias, kitsIds])

  const mesActual = monthLabel(0)
  const mvMes = useMemo(() => {
    const ids = new Set()
    ;(transferencias || []).forEach(t => {
      if (t.fecha?.startsWith(mesActual))
        (t.items || []).forEach(it => { if (kitsIds.has(it.productoId)) ids.add(it.productoId) })
    })
    return ids
  }, [transferencias, kitsIds, mesActual])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
          <CubeIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">Kits Nuevos en Movimiento</h3>
          <p className="text-[10px] text-gray-400">Productos ingresados en los últimos 30 días</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-[#1e3a5f]">{mvSemana.size}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">con mov. esta semana</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-indigo-700">{mvMes.size}</p>
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">con mov. este mes</p>
        </div>
      </div>

      {kitsNuevos.length > 0 && (
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          {open ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          {open ? 'Ocultar lista' : `Ver ${kitsNuevos.length} kits nuevos`}
        </button>
      )}

      {open && (
        <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
          <div className="bg-gray-50 px-3 py-1.5 grid grid-cols-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">
            <span className="col-span-2">Producto</span>
            <span className="text-right">Ingresó</span>
          </div>
          {kitsNuevos.map(p => (
            <div key={p.id} className="px-3 py-2 grid grid-cols-3 border-t border-gray-50 hover:bg-gray-50">
              <span className="col-span-2 text-gray-700 font-medium truncate">{p.nombre}</span>
              <span className="text-right text-gray-400">{(p.fechaAlta || p.fechaIngreso || p.createdAt || '—').slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}

      {kitsNuevos.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Sin kits nuevos en los últimos 30 días</p>
      )}
    </div>
  )
}

// ── Widget 2: EPPs Vencidos ──────────────────────────────────────────────────
function WidgetEPPs({ productos, sedes }) {
  const sedeMap = useMemo(() =>
    Object.fromEntries((sedes || []).map(s => [s.id, s.nombre])), [sedes])

  const epps = useMemo(() =>
    (productos || [])
      .filter(p => p.esEPP && p.fechaVencimiento)
      .map(p => {
        const dias = daysFromNow(p.fechaVencimiento)
        let nivel = null
        if (dias <= 0) nivel = 'vencido'
        else if (dias <= 30) nivel = 'critico'
        else if (dias <= 60) nivel = 'alerta'
        return { ...p, diasRestantes: dias, nivel }
      })
      .filter(p => p.nivel !== null)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  , [productos])

  const vencidos = epps.filter(e => e.nivel === 'vencido')
  const criticos = epps.filter(e => e.nivel === 'critico')
  const alertas  = epps.filter(e => e.nivel === 'alerta')

  const NIVEL_STYLES = {
    vencido: { row: 'bg-red-50',    badge: 'bg-red-100 text-red-700',       label: t => `Vencido hace ${Math.abs(t)} días` },
    critico: { row: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',   label: t => `Vence en ${t} días` },
    alerta:  { row: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', label: t => `Vence en ${t} días` },
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <ShieldCheckIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">EPPs — Estado de Vencimiento</h3>
            <p className="text-[10px] text-gray-400">Equipos de Protección Personal con fecha crítica</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {vencidos.length > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{vencidos.length} vencidos</span>}
          {criticos.length > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{criticos.length} &lt;30d</span>}
          {alertas.length  > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{alertas.length} &lt;60d</span>}
        </div>
      </div>

      {epps.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm text-green-600 font-medium">Todos los EPPs están al día</p>
          <p className="text-xs text-gray-400 mt-1">Sin vencimientos próximos en 60 días</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
          <div className="bg-gray-50 px-3 py-1.5 grid grid-cols-12 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">
            <span className="col-span-4">EPP</span>
            <span className="col-span-3">Sede</span>
            <span className="col-span-3">Vencimiento</span>
            <span className="col-span-2 text-center">Estado</span>
          </div>
          {epps.map(e => {
            const st = NIVEL_STYLES[e.nivel]
            return (
              <div key={e.id} className={`px-3 py-2 grid grid-cols-12 border-t border-gray-50 ${st.row}`}>
                <span className="col-span-4 font-medium text-gray-800 truncate">{e.nombre}</span>
                <span className="col-span-3 text-gray-500">{sedeMap[e.sedeId] || '—'}</span>
                <span className="col-span-3 text-gray-600">{e.fechaVencimiento}</span>
                <span className="col-span-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${st.badge}`}>
                    {st.label(Math.abs(e.diasRestantes))}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Widget 3: Valor de Despacho por Sede ────────────────────────────────────
function WidgetDespachoSede({ transferencias, sedes }) {
  const [mes, setMes] = useState(monthLabel(0))

  const sedesDestino = useMemo(() => (sedes || []).filter(s => !s.esCentral), [sedes])
  const MESES_OPT = Array.from({ length: 6 }, (_, i) => monthLabel(-i))

  const data = useMemo(() => {
    const totals = {}
    ;(transferencias || []).filter(t => t.fecha?.startsWith(mes)).forEach(t => {
      const sid = t.sedeDestinoId
      if (!sid) return
      totals[sid] = (totals[sid] || 0) + (t.total || 0)
    })
    return sedesDestino
      .map(s => ({ id: s.id, nombre: s.nombre, total: totals[s.id] || 0 }))
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [transferencias, mes, sedesDestino])

  const totalGeneral = data.reduce((s, d) => s + d.total, 0)
  const maxVal = data[0]?.total || 1

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <BuildingOfficeIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Valor de Despacho por Sede</h3>
            <p className="text-[10px] text-gray-400">Valor total (S/.) de vales de salida</p>
          </div>
        </div>
        <select
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
          value={mes} onChange={e => setMes(e.target.value)}
        >
          {MESES_OPT.map(m => <option key={m} value={m}>{monthDisplay(m)}</option>)}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <BuildingOfficeIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin despachos en {monthDisplay(mes)}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map(d => (
            <div key={d.id} className="flex items-center gap-3">
              <div className="w-28 text-xs font-medium text-gray-600 truncate shrink-0">{d.nombre}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] transition-all duration-500"
                  style={{ width: `${(d.total / maxVal) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right text-xs font-bold text-gray-700 shrink-0">{fmtMoney(d.total)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">Total {monthDisplay(mes)}</span>
        <span className="text-sm font-black text-[#1e3a5f]">{fmtMoney(totalGeneral)}</span>
      </div>
    </div>
  )
}

// ── Widget 4: Top 6 Productos más consumidos ─────────────────────────────────
function WidgetTopProductos({ transferencias, productos }) {
  const [mes, setMes] = useState(monthLabel(0))
  const MESES_OPT = Array.from({ length: 6 }, (_, i) => monthLabel(-i))

  const top6 = useMemo(() => {
    const agg = {}
    ;(transferencias || []).filter(t => t.fecha?.startsWith(mes)).forEach(t => {
      ;(t.items || []).forEach(it => {
        const pid = it.productoId
        if (!agg[pid]) agg[pid] = { id: pid, nombre: it.descripcion || it.producto || pid, unidades: 0, valor: 0 }
        agg[pid].unidades += (it.cantidad || 0)
        agg[pid].valor    += (it.precioTotal || (it.cantidad || 0) * (it.precioUnit || 0))
      })
    })
    return Object.values(agg).sort((a, b) => b.unidades - a.unidades).slice(0, 6)
  }, [transferencias, mes])

  const maxUnid = top6[0]?.unidades || 1

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Top 6 Productos más Consumidos</h3>
            <p className="text-[10px] text-gray-400">Por unidades despachadas en el período</p>
          </div>
        </div>
        <select
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
          value={mes} onChange={e => setMes(e.target.value)}
        >
          {MESES_OPT.map(m => <option key={m} value={m}>{monthDisplay(m)}</option>)}
        </select>
      </div>

      {top6.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin despachos en {monthDisplay(mes)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {top6.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-5 text-center shrink-0">
                <span className={`text-xs font-black ${i === 0 ? 'text-[#1e3a5f]' : i === 1 ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{p.nombre}</p>
                <div className="mt-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${(p.unidades / maxUnid) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-gray-700">{p.unidades} und.</p>
                <p className="text-[10px] text-gray-400">{fmtMoney(p.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardCoordGen() {
  const { state } = useApp()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const { requerimientos = [], productos = [], transferencias = [], sedes = [] } = state

  const mesActual = monthLabel(0)

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const reqPendientes = useMemo(() =>
    requerimientos.filter(r => r.estado === 'Pendiente').length, [requerimientos])
  const reqUrgentes = useMemo(() =>
    requerimientos.filter(r => r.estado === 'Pendiente' && (r.prioridad === 'Alta' || r.urgente)).length, [requerimientos])

  const eppsProximos = useMemo(() =>
    (productos || []).filter(p => {
      if (!p.esEPP || !p.fechaVencimiento) return false
      const d = daysFromNow(p.fechaVencimiento)
      return d <= 60
    }).length, [productos])
  const eppsVencidos = useMemo(() =>
    (productos || []).filter(p => p.esEPP && p.fechaVencimiento && daysFromNow(p.fechaVencimiento) <= 0).length, [productos])

  const valorMes = useMemo(() =>
    (transferencias || [])
      .filter(t => t.fecha?.startsWith(mesActual))
      .reduce((s, t) => s + (t.total || 0), 0), [transferencias, mesActual])

  const hace30 = new Date(today); hace30.setDate(hace30.getDate() - 30)
  const kitsNuevos = useMemo(() =>
    (productos || []).filter(p => {
      const f = p.fechaAlta || p.fechaIngreso || p.createdAt
      return f && new Date(f) >= hace30
    }).length, [productos])

  // ── Alertas como pills ───────────────────────────────────────────────────
  const alertas = []
  if (reqUrgentes > 0)   alertas.push({ msg: `${reqUrgentes} REQ urgente${reqUrgentes > 1 ? 's' : ''}`, path: '/requerimientos', color: 'red' })
  else if (reqPendientes > 0) alertas.push({ msg: `${reqPendientes} REQ pendiente${reqPendientes > 1 ? 's' : ''}`, path: '/requerimientos', color: 'amber' })
  if (eppsVencidos > 0)  alertas.push({ msg: `${eppsVencidos} EPP vencido${eppsVencidos > 1 ? 's' : ''}`, path: '/inventario', color: 'red' })
  else if (eppsProximos > 0) alertas.push({ msg: `${eppsProximos} EPP${eppsProximos > 1 ? 's' : ''} por vencer`, path: '/inventario', color: 'amber' })

  const PILL_COLORS = {
    red:   'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  }

  const fechaStr = today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{greeting()}</p>
          <h1 className="text-xl font-black text-[#1e3a5f]">
            {user?.nombre?.split(' ')[0] || 'Coordinador'}
          </h1>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{fechaStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {alertas.map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${PILL_COLORS[a.color]}`}
            >
              <ExclamationCircleIcon className="w-3.5 h-3.5" />
              {a.msg}
            </button>
          ))}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1e3a5f] border border-gray-200 hover:border-[#1e3a5f] px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Fila de StatCards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="REQs Pendientes"
          value={reqPendientes}
          sub={reqUrgentes > 0 ? `${reqUrgentes} urgente${reqUrgentes > 1 ? 's' : ''}` : 'Sin urgentes'}
          alert={reqUrgentes > 0}
          onClick={() => navigate('/requerimientos')}
          Icon={ClipboardDocumentListIcon}
          iconBg={reqUrgentes > 0 ? 'bg-red-500' : 'bg-[#1e3a5f]'}
        />
        <StatCard
          label="EPPs por Atender"
          value={eppsProximos}
          sub={eppsVencidos > 0 ? `${eppsVencidos} ya vencido${eppsVencidos > 1 ? 's' : ''}` : 'Sin vencidos'}
          alert={eppsVencidos > 0}
          onClick={() => navigate('/inventario')}
          Icon={ShieldCheckIcon}
          iconBg={eppsVencidos > 0 ? 'bg-red-500' : 'bg-amber-500'}
        />
        <StatCard
          label="Valor Despachado (mes)"
          value={fmtMoney(valorMes)}
          sub={monthDisplay(mesActual)}
          onClick={() => navigate('/transferencias')}
          Icon={BanknotesIcon}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Kits Nuevos (30 días)"
          value={kitsNuevos}
          sub="Productos ingresados"
          onClick={() => navigate('/inventario')}
          Icon={CubeIcon}
          iconBg="bg-indigo-500"
        />
      </div>

      {/* ── Grid 2 columnas con los 4 widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <WidgetKitsNuevos productos={productos} transferencias={transferencias} />
          <WidgetEPPs productos={productos} sedes={sedes} />
        </div>
        <div className="space-y-4">
          <WidgetDespachoSede transferencias={transferencias} sedes={sedes} />
          <WidgetTopProductos transferencias={transferencias} productos={productos} />
        </div>
      </div>

    </div>
  )
}
