/**
 * Reportes.jsx — Centro de Reportes GIVAMIC
 * Tabs: Operativos | Auditoría
 */
import { useState, useMemo } from 'react'
import {
  ChartBarIcon, ShieldCheckIcon,
  ClockIcon, ArrowDownTrayIcon, FunnelIcon, CalendarIcon
} from '@heroicons/react/24/outline'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import ExportMenu from '../components/common/ExportMenu'

// Helpers
function fmtMes(ym) {
  const M = { '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
               '07':'Jul','08':'Ago','09':'Set','10':'Oct','11':'Nov','12':'Dic' }
  if (!ym) return '—'
  const [y,m] = ym.split('-')
  return `${M[m]||m} ${y}`
}
function fmtMonto(n) { return 'S/ ' + Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:2}) }
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

const TABS = [
  { id:'operativos',    label:'Operativos',           Icon: ChartBarIcon },
  { id:'auditoria',     label:'Auditoría',             Icon: ShieldCheckIcon },
]


// ── Mini bar chart SVG ────────────────────────────────────────────────────────
function BarChart({ data, color = '#1e3a5f', height = 100 }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (height - 18)
        return (
          <g key={i}>
            <rect x={i * w + w * 0.1} y={height - 14 - bh} width={w * 0.8} height={bh}
              fill={color} rx="2" opacity="0.85" />
            <text x={i * w + w / 2} y={height - 2} textAnchor="middle"
              fontSize="4.5" fill="#6b7280">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Mini line chart SVG ───────────────────────────────────────────────────────
function LineChart({ datasets, height = 100 }) {
  if (!datasets || datasets.length === 0 || !datasets[0].data?.length)
    return <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>

  const allValues = datasets.flatMap(ds => ds.data.map(d => d.value))
  const max = Math.max(...allValues, 1)
  const labels = datasets[0].data.map(d => d.label)
  const n = labels.length
  const pad = 8

  const toX = i => pad + (i / Math.max(n - 1, 1)) * (100 - pad * 2)
  const toY = v => height - 14 - ((v / max) * (height - 22))

  const colors = ['#1e3a5f', '#d97706', '#16a34a', '#dc2626']

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={pad} x2={100-pad} y1={toY(max*f)} y2={toY(max*f)}
          stroke="#f3f4f6" strokeWidth="0.5" />
      ))}
      {datasets.map((ds, di) => {
        const pts = ds.data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
        return (
          <g key={di}>
            <polyline points={pts} fill="none" stroke={colors[di % colors.length]} strokeWidth="1.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {ds.data.map((d, i) => (
              <circle key={i} cx={toX(i)} cy={toY(d.value)} r="1.5"
                fill={colors[di % colors.length]} />
            ))}
          </g>
        )
      })}
      {labels.map((l, i) => (
        <text key={i} x={toX(i)} y={height - 2} textAnchor="middle" fontSize="4" fill="#9ca3af">{l}</text>
      ))}
    </svg>
  )
}

// ── Stacked bar chart SVG ─────────────────────────────────────────────────────
function StackedBar({ data, height = 100 }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
  const maxVal = Math.max(...data.map(d => (d.regular||0) + (d.adicional||0)), 1)
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const total = (d.regular||0) + (d.adicional||0)
        const totalH = (total / maxVal) * (height - 18)
        const regH = totalH > 0 ? ((d.regular||0) / total) * totalH : 0
        const addH = totalH - regH
        return (
          <g key={i}>
            <rect x={i*w+w*0.1} y={height-14-totalH+addH} width={w*0.8} height={regH}
              fill="#1e3a5f" rx="1" />
            <rect x={i*w+w*0.1} y={height-14-totalH} width={w*0.8} height={addH}
              fill="#d97706" rx="1" />
            <text x={i*w+w/2} y={height-2} textAnchor="middle" fontSize="4.5" fill="#6b7280">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 80 }) {
  if (!segments || segments.length === 0) return null
  const total = segments.reduce((s,g) => s+g.value, 0)
  if (total === 0) return null
  const r = 30; const cx = size/2; const cy = size/2
  let angle = -Math.PI/2
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {segments.map((seg, i) => {
        const ratio = seg.value / total
        const sweep = ratio * 2 * Math.PI
        const x1 = cx + r * Math.cos(angle)
        const y1 = cy + r * Math.sin(angle)
        angle += sweep
        const x2 = cx + r * Math.cos(angle)
        const y2 = cy + r * Math.sin(angle)
        const large = sweep > Math.PI ? 1 : 0
        return (
          <path key={i}
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
            fill={seg.color} opacity="0.9" />
        )
      })}
      <circle cx={cx} cy={cy} r={r*0.55} fill="white" />
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-[#1e3a5f]', chart, legend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 font-semibold mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {chart && <div className="mt-3">{chart}</div>}
      {legend && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{legend}</div>}
    </div>
  )
}
function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-500">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  )
}

// ── ProxButton ─────────────────────────────────────────────────────────────────
function ProxButton({ children }) {
  return (
    <div className="relative inline-flex" title="Próximamente">
      <button disabled className="flex items-center gap-1.5 border border-gray-200 text-gray-400 px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed">
        <CalendarIcon className="w-4 h-4" />
        {children}
      </button>
      <span className="absolute -top-2 -right-1 text-[9px] bg-amber-400 text-amber-900 font-bold px-1 rounded">Pronto</span>
    </div>
  )
}

// ── Tabla previa ──────────────────────────────────────────────────────────────
function PreviewTable({ rows, cols, emptyText = 'Sin datos' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyText}</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            {cols.map(c => <th key={c.key||c.header} className="text-left px-3 py-2 font-semibold">{c.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              {cols.map(c => (
                <td key={c.key||c.header} className="px-3 py-2 text-gray-700">
                  {typeof c.render === 'function' ? c.render(r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
function Section({ title, subtitle, actions, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#1e3a5f]">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABS CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function TabOperativos({ state, user }) {
  const [mesFact, setMesFact] = useState(currentYM())
  const [mesVale, setMesVale] = useState(currentYM())
  const [mesKardex, setMesKardex] = useState(currentYM())

  const facturas = state.facturas || []
  const vales = state.transferencias || []
  const reqs = state.requerimientos || []
  const movimientos = state.movimientos || []
  const inventario = state.inventario || []
  const productos = state.productos || []
  const sedes = state.sedes || []

  // Facturas del mes
  const factMes = useMemo(() =>
    facturas.filter(f => f.fecha?.startsWith(mesFact))
    .sort((a,b) => b.fecha.localeCompare(a.fecha))
  , [facturas, mesFact])

  // Vales del mes
  const valesMes = useMemo(() =>
    vales.filter(v => v.fecha?.startsWith(mesVale))
    .sort((a,b) => b.fecha.localeCompare(a.fecha))
  , [vales, mesVale])

  // REQs por estado
  const reqPorEstado = useMemo(() => {
    const map = {}
    reqs.forEach(r => { map[r.estado] = (map[r.estado]||0) + 1 })
    return Object.entries(map).map(([estado, n]) => ({ estado, n }))
      .sort((a,b) => b.n - a.n)
  }, [reqs])

  // Kardex del mes
  const movMes = useMemo(() =>
    movimientos.filter(m => m.fecha?.startsWith(mesKardex))
    .sort((a,b) => b.fecha.localeCompare(a.fecha))
  , [movimientos, mesKardex])

  // Inventario valorizado — inventario es objeto {sedeId: {prodId: {cantidad, precio}}}
  const invValorizado = useMemo(() => {
    const rows = []
    Object.entries(inventario).forEach(([sedeId, stock]) => {
      if (!stock || typeof stock !== 'object') return
      const sede = sedes.find(s => s.id === sedeId)
      Object.entries(stock).forEach(([prodId, item]) => {
        if (!item || typeof item !== 'object') return
        const prod = productos.find(p => p.id === prodId)
        const cantidad = item.cantidad || 0
        const precio = item.precio || prod?.ultimoPrecio || 0
        rows.push({
          producto: prod?.nombre || prodId,
          sede: sede?.nombre || sedeId,
          stock: cantidad,
          costo: precio,
          valorizado: cantidad * precio,
        })
      })
    })
    return rows.sort((a,b) => b.valorizado - a.valorizado)
  }, [inventario, productos, sedes])

  const totalValorizado = invValorizado.reduce((s,i) => s + i.valorizado, 0)

  const colsFact = [
    { header: 'N° Factura', key: 'numero' },
    { header: 'Proveedor',  key: 'proveedor' },
    { header: 'Fecha',      key: 'fecha', render: r => r.fecha?.slice(0,10) },
    { header: 'Monto',      key: 'monto', render: r => fmtMonto(r.monto) },
    { header: 'Estado',     key: 'estado' },
  ]
  const colsVale = [
    { header: 'N° Vale',   key: 'numeroVale' },
    { header: 'Sede',      key: 'sedeNombre', render: r => { const s = (state.sedes||[]).find(x=>x.id===r.sedeDestinoId); return s?.nombre||r.sedeDestinoId||'—' } },
    { header: 'Fecha',     key: 'fecha', render: r => r.fecha?.slice(0,10) },
    { header: 'Ítems',     key: 'items', render: r => `${r.items?.length||0} ítems` },
    { header: 'Responsable', key: 'responsable' },
  ]
  const colsKardex = [
    { header: 'Producto', key: 'productoNombre' },
    { header: 'Tipo',     key: 'tipo' },
    { header: 'Qty',      key: 'cantidad' },
    { header: 'Fecha',    key: 'fecha', render: r => r.fecha?.slice(0,10) },
    { header: 'Ref.',     key: 'referencia' },
  ]

  const colsExportFact = [
    { header:'N° Factura', key:'numero', width:18 },
    { header:'Proveedor',  key:'proveedor', width:28 },
    { header:'Fecha',      key: r => r.fecha?.slice(0,10), width:12 },
    { header:'Monto (S/)', key:'monto', width:14, total:true, totalFmt: v => fmtMonto(v) },
    { header:'Estado',     key:'estado', width:16 },
  ]
  const colsExportVale = [
    { header:'N° Vale',     key:'numeroVale', width:14 },
    { header:'Sede',        key: r => { const s=(state.sedes||[]).find(x=>x.id===r.sedeDestinoId); return s?.nombre||'—' }, width:24 },
    { header:'Fecha',       key: r => r.fecha?.slice(0,10), width:12 },
    { header:'Responsable', key:'responsable', width:20 },
  ]

  return (
    <div className="space-y-6">
      {/* Facturas de Compra */}
      <Section
        title="Facturas de Compra por Período"
        subtitle={`${factMes.length} facturas en ${fmtMes(mesFact)}`}
        actions={
          <>
            <input type="month" value={mesFact} onChange={e => setMesFact(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
            <ExportMenu modulo="FacturasCompra" data={factMes} columns={colsExportFact} filtroLabel={fmtMes(mesFact)} />
            <ProxButton>Programar</ProxButton>
          </>
        }
      >
        <PreviewTable rows={factMes.slice(0,10)} cols={colsFact} emptyText={`Sin facturas en ${fmtMes(mesFact)}`} />
      </Section>

      {/* Vales */}
      <Section
        title="Vales de Salida por Período"
        subtitle={`${valesMes.length} vales en ${fmtMes(mesVale)}`}
        actions={
          <>
            <input type="month" value={mesVale} onChange={e => setMesVale(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
            <ExportMenu modulo="ValesSalida" data={valesMes} columns={colsExportVale} filtroLabel={fmtMes(mesVale)} />
            <ProxButton>Programar</ProxButton>
          </>
        }
      >
        <PreviewTable rows={valesMes.slice(0,10)} cols={colsVale} emptyText={`Sin vales en ${fmtMes(mesVale)}`} />
      </Section>

      {/* REQs por estado */}
      <Section title="Requerimientos por Estado" subtitle={`${reqs.length} REQs en total`}
        actions={
          <ExportMenu modulo="REQsPorEstado"
            data={reqPorEstado}
            columns={[{ header:'Estado',key:'estado',width:28 },{ header:'Cantidad',key:'n',width:12,total:true }]}
            filtroLabel="Todos los estados" />
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {reqPorEstado.map(({ estado, n }) => (
            <div key={estado} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <p className="text-xs text-gray-500 truncate">{estado}</p>
              <p className="text-2xl font-black text-[#1e3a5f] mt-0.5">{n}</p>
            </div>
          ))}
          {reqPorEstado.length === 0 && <p className="text-sm text-gray-400 col-span-4">Sin requerimientos</p>}
        </div>
      </Section>

      {/* Kardex */}
      <Section
        title="Movimientos Kardex por Período"
        subtitle={`${movMes.length} movimientos en ${fmtMes(mesKardex)}`}
        actions={
          <>
            <input type="month" value={mesKardex} onChange={e => setMesKardex(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
            <ExportMenu modulo="KardexMovimientos" data={movMes} columns={colsKardex.map(c => ({ header:c.header, key:c.key||c.render, width:20 }))} filtroLabel={fmtMes(mesKardex)} />
            <ProxButton>Programar</ProxButton>
          </>
        }
      >
        <PreviewTable rows={movMes.slice(0,10)} cols={colsKardex} emptyText={`Sin movimientos en ${fmtMes(mesKardex)}`} />
      </Section>

      {/* Inventario valorizado */}
      <Section
        title="Inventario Valorizado"
        subtitle={`Total: ${fmtMonto(totalValorizado)}`}
        actions={
          <ExportMenu modulo="InventarioValorizado"
            data={invValorizado}
            columns={[
              { header:'Producto', key:'producto', width:35 },
              { header:'Sede', key:'sede', width:22 },
              { header:'Stock', key:'stock', width:10 },
              { header:'Costo Unit.', key:'costo', width:14 },
              { header:'Valorizado', key:'valorizado', width:16, total:true, totalFmt:v=>fmtMonto(v) },
            ]}
            filtroLabel="Inventario actual" />
        }
      >
        <PreviewTable
          rows={invValorizado.slice(0,10)}
          cols={[
            { header:'Producto', key:'producto' },
            { header:'Sede', key:'sede' },
            { header:'Stock', key:'stock' },
            { header:'Valorizado', key:'valorizado', render: r => fmtMonto(r.valorizado) },
          ]}
          emptyText="Sin datos de inventario" />
      </Section>
    </div>
  )
}
function TabAuditoria({ state, user }) {
  const auditLog = state.auditLog || []
  const usuarios = state.usuarios || []
  const [filtroUser, setFiltroUser] = useState('')
  const [filtroMod, setFiltroMod] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  const filtered = useMemo(() => {
    return auditLog.filter(entry => {
      if (filtroUser && !entry.usuario?.toLowerCase().includes(filtroUser.toLowerCase())) return false
      if (filtroMod && !entry.modulo?.toLowerCase().includes(filtroMod.toLowerCase())) return false
      if (filtroFecha && !entry.fecha?.startsWith(filtroFecha)) return false
      return true
    }).slice(0, 200)
  }, [auditLog, filtroUser, filtroMod, filtroFecha])

  // Aprobaciones de REQs
  const aprobaciones = useMemo(() =>
    auditLog.filter(e => e.accion?.toLowerCase().includes('aprobó') || e.accion?.toLowerCase().includes('rechazó'))
  , [auditLog])

  // Reportes generados
  const reportesHist = (state.reportesHistorial || []).slice(0, 200)

  const colsAudit = [
    { header:'Fecha', key:'fecha', render: r => fmtDate(r.fecha) },
    { header:'Usuario', key:'usuario' },
    { header:'Módulo', key:'modulo' },
    { header:'Acción', key:'accion' },
  ]

  const colsReportes = [
    { header:'Fecha', key:'fecha', render: r => fmtDate(r.fecha) },
    { header:'Usuario', key:'usuario' },
    { header:'Módulo', key:'modulo' },
    { header:'Formato', key:'formato' },
    { header:'Filtros', key:'filtros' },
  ]

  const isAdmin = user?.rol === 'Administrador'

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Acciones registradas" value={auditLog.length} sub="En log total" />
        <StatCard label="Aprobaciones/Rechazos" value={aprobaciones.length} color="text-amber-700" />
        <StatCard label="Usuarios activos" value={usuarios.length} color="text-emerald-700" />
        <StatCard label="Reportes generados" value={reportesHist.length} color="text-blue-700" />
      </div>

      {/* Log de acciones */}
      <Section
        title="Log de Acciones del Sistema"
        subtitle={`${filtered.length} de ${auditLog.length} acciones`}
        actions={
          <ExportMenu modulo="AuditLog" data={filtered}
            columns={[
              { header:'Fecha', key: r => fmtDate(r.fecha), width:22 },
              { header:'Usuario', key:'usuario', width:20 },
              { header:'Módulo', key:'modulo', width:18 },
              { header:'Acción', key:'accion', width:50 },
            ]}
            filtroLabel="Log completo" />
        }
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-3">
          <input value={filtroUser} onChange={e => setFiltroUser(e.target.value)}
            placeholder="Filtrar por usuario..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
          <input value={filtroMod} onChange={e => setFiltroMod(e.target.value)}
            placeholder="Filtrar por módulo..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none" />
        </div>
        <PreviewTable rows={filtered.slice(0,20)} cols={colsAudit} emptyText="Sin acciones registradas" />
      </Section>

      {/* Historial de reportes (solo Admin) */}
      {isAdmin && (
        <Section
          title="Historial de Reportes Generados"
          subtitle={`Últimos ${reportesHist.length} reportes`}
          actions={
            <ExportMenu modulo="HistorialReportes" data={reportesHist}
              columns={[
                { header:'Fecha', key: r => fmtDate(r.fecha), width:22 },
                { header:'Usuario', key:'usuario', width:20 },
                { header:'Módulo', key:'modulo', width:18 },
                { header:'Formato', key:'formato', width:10 },
                { header:'Filtros', key:'filtros', width:30 },
              ]}
              filtroLabel="Historial completo" />
          }
        >
          <PreviewTable rows={reportesHist.slice(0,20)} cols={colsReportes} emptyText="Sin reportes generados aún" />
        </Section>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function Reportes() {
  const { state } = useApp()
  const { user } = useAuth()
  const [tab, setTab] = useState('operativos')

  const isGerencia = user?.rol === 'Gerencia'
  const isAdmin = user?.rol === 'Administrador'

  // Todos los roles ven las mismas tabs; solo Auditoría se restringe a Admin/Gerencia
  const visibleTabs = TABS.filter(t => {
    if (isAdmin || isGerencia) return true
    return t.id !== 'auditoria'
  })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Centro de Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análisis, exportaciones y trazabilidad del sistema</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto">
          {visibleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2
                ${tab === t.id
                  ? 'border-[#1e3a5f] text-[#1e3a5f] bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
            >
              <t.Icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'operativos'  && <TabOperativos  state={state} user={user} />}
        {tab === 'auditoria'   && <TabAuditoria   state={state} user={user} />}
      </div>
    </div>
  )
}
