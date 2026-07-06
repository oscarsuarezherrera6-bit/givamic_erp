import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { fmtMoney, fmtDate, monthYear } from '../utils/helpers'
import { generarPDFVale } from '../utils/pdfVale'
import { useToast } from '../components/layout/Toast'
import PageHeader from '../components/common/PageHeader'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ValesSalida() {
  const { state } = useApp()
  const toast = useToast()
  const { transferencias, sedes } = state
  const sedesDestino = sedes.filter(s => !s.esCentral)
  const sedeMap = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))

  const [filtroSede, setFiltroSede] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const meses = useMemo(() => [...new Set(transferencias.map(t => t.fecha.slice(0,7)))].sort().reverse(), [transferencias])

  const filtered = transferencias
    .filter(t => !filtroSede || t.sedeDestinoId === filtroSede)
    .filter(t => !filtroMes || t.fecha.startsWith(filtroMes))
    .filter(t => !filtroDesde || t.fecha >= filtroDesde)
    .filter(t => !filtroHasta || t.fecha <= filtroHasta)
    .sort((a,b) => new Date(b.fecha)-new Date(a.fecha))

  const descargar = (t) => { generarPDFVale(t, sedes, state.logo); toast(`PDF ${t.numeroVale} descargado`) }

  // Reporte mensual por sede
  const now = new Date()
  const last6Months = []
  for (let i=5; i>=0; i--) {
    const d = new Date(now); d.setMonth(d.getMonth()-i); d.setDate(1)
    last6Months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  const reporteData = useMemo(() => {
    return last6Months.map(mes => {
      const entry = { mes }
      sedesDestino.forEach(s => {
        entry[s.nombre] = transferencias
          .filter(t => t.sedeDestinoId === s.id && t.fecha.startsWith(mes))
          .reduce((sum, t) => sum + (t.total||0), 0)
      })
      return entry
    })
  }, [transferencias, sedes])

  const tablaMensual = useMemo(() => {
    const rows = {}
    sedesDestino.forEach(s => {
      rows[s.id] = { sede: s.nombre, meses: {} }
      last6Months.forEach(mes => {
        rows[s.id].meses[mes] = transferencias
          .filter(t => t.sedeDestinoId === s.id && t.fecha.startsWith(mes))
          .reduce((sum, t) => sum + (t.total||0), 0)
      })
    })
    return Object.values(rows)
  }, [transferencias, sedes])

  const COLORS = ['#1e3a5f', '#2d5a9e', '#4a86d4', '#6fa8dc', '#93c5fd']

  return (
    <div className="space-y-6">
      <PageHeader title="Registro de Vales de Salida" subtitle="Historial y reportes de todas las transferencias" />

      {/* Filtros */}
      <div className="card flex gap-3 flex-wrap">
        <select className="input max-w-[180px]" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
          <option value="">Todas las sedes</option>
          {sedesDestino.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" className="input max-w-[150px]" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
          <span className="text-gray-400 text-sm">—</span>
          <input type="date" className="input max-w-[150px]" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
        </div>
      </div>

      {/* Tabla vales */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">N° Vale</th><th className="table-th">Fecha</th>
            <th className="table-th">Sede Destino</th><th className="table-th">Área Solicitante</th>
            <th className="table-th">Responsable</th><th className="table-th">Ítems</th>
            <th className="table-th text-right">Total</th><th className="table-th">PDF</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="table-td font-mono text-xs font-semibold text-[#1e3a5f]">{t.numeroVale}</td>
                <td className="table-td">{fmtDate(t.fecha)}</td>
                <td className="table-td">{sedeMap[t.sedeDestinoId]}</td>
                <td className="table-td">{t.areaSolicitante}</td>
                <td className="table-td">{t.responsable}</td>
                <td className="table-td">{t.items.length}</td>
                <td className="table-td text-right font-semibold">{fmtMoney(t.total)}</td>
                <td className="table-td">
                  <button onClick={() => descargar(t)} className="text-blue-500 hover:text-blue-700"><DocumentArrowDownIcon className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Reporte mensual */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Reporte mensual por sede (valor enviado en S/)</h2>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">Sede</th>
            {last6Months.map(m => <th key={m} className="table-th text-right">{m}</th>)}
            <th className="table-th text-right">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {tablaMensual.map(row => {
              const tot = Object.values(row.meses).reduce((s,v) => s+v, 0)
              return (
                <tr key={row.sede}>
                  <td className="table-td font-medium">{row.sede}</td>
                  {last6Months.map(m => <td key={m} className="table-td text-right">{row.meses[m] > 0 ? fmtMoney(row.meses[m]) : '—'}</td>)}
                  <td className="table-td text-right font-semibold">{fmtMoney(tot)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Gráfico */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Comparativo mensual por sede (S/)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reporteData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `S/ ${v.toFixed(2)}`} />
            <Legend />
            {sedesDestino.map((s, i) => <Bar key={s.id} dataKey={s.nombre} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === sedesDestino.length-1 ? [4,4,0,0] : [0,0,0,0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
