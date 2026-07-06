import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/layout/Toast'
import { fmtDate, genId, todayISO, exportCSV } from '../utils/helpers'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const TIPOS = ['INGRESO', 'SALIDA', 'TRANSFERENCIA']
const tipoColor = { INGRESO: 'bg-green-100 text-green-700', SALIDA: 'bg-red-100 text-red-700', TRANSFERENCIA: 'bg-blue-100 text-blue-700' }

function MovForm({ onClose }) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [form, setForm] = useState({ tipo: 'INGRESO', sedeId: 's1', productoId: '', cantidad: 1, fecha: todayISO(), referencia: '', observaciones: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.productoId) return toast('Selecciona un producto', 'error')
    const prod = state.productos.find(p => p.id === form.productoId)
    const cant = form.tipo === 'SALIDA' ? -Math.abs(form.cantidad) : Math.abs(form.cantidad)
    dispatch({ type: 'ADD_MOVIMIENTO', payload: { ...form, cantidad: cant, producto: prod?.nombre || '' } })
    toast('Movimiento registrado')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Sede</label>
          <select className="input" value={form.sedeId} onChange={e => set('sedeId', e.target.value)}>
            {state.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Producto</label>
          <select className="input" value={form.productoId} onChange={e => set('productoId', e.target.value)} required>
            <option value="">Seleccionar...</option>
            {state.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Cantidad</label>
          <input className="input" type="number" min="1" value={form.cantidad} onChange={e => set('cantidad', parseFloat(e.target.value)||0)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Fecha</label>
          <input className="input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Referencia</label>
          <input className="input" value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="N° doc, vale, etc." />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Observaciones</label>
          <input className="input" value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Registrar</button>
      </div>
    </form>
  )
}

export default function Movimientos() {
  const { state } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSede, setFiltroSede] = useState('')
  const [filtroProd, setFiltroProd] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const sedeMap = Object.fromEntries(state.sedes.map(s => [s.id, s.nombre]))

  const filtered = state.movimientos
    .filter(m => !filtroTipo || m.tipo === filtroTipo)
    .filter(m => !filtroSede || m.sedeId === filtroSede)
    .filter(m => !filtroProd || m.productoId === filtroProd)
    .filter(m => !filtroDesde || m.fecha >= filtroDesde)
    .filter(m => !filtroHasta || m.fecha <= filtroHasta)
    .sort((a,b) => new Date(b.fecha)-new Date(a.fecha))

  const exportar = () => {
    const headers = ['Fecha', 'Tipo', 'Sede', 'Producto', 'Cantidad', 'Referencia', 'Observaciones']
    const rows = filtered.map(m => [m.fecha, m.tipo, sedeMap[m.sedeId]||'', m.producto, m.cantidad, m.referencia||'', m.observaciones||''])
    exportCSV([headers, ...rows], `Movimientos_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div>
      <PageHeader title="Movimientos de Almacén" subtitle="Historial completo de entradas y salidas"
        action={
          <div className="flex gap-2">
            <button onClick={exportar} className="btn-secondary flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/>Exportar CSV</button>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-4 h-4"/>Nuevo Movimiento</button>
          </div>
        } />

      <div className="card mb-4 flex gap-3 flex-wrap">
        <select className="input max-w-[160px]" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input max-w-[200px]" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
          <option value="">Todas las sedes</option>
          {state.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select className="input max-w-[220px]" value={filtroProd} onChange={e => setFiltroProd(e.target.value)}>
          <option value="">Todos los productos</option>
          {state.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input type="date" className="input max-w-[150px]" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
        <span className="self-center text-gray-400">—</span>
        <input type="date" className="input max-w-[150px]" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <p className="text-xs text-gray-400 mb-3">{filtered.length} registros</p>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">Fecha</th><th className="table-th">Tipo</th>
            <th className="table-th">Sede</th><th className="table-th">Producto</th>
            <th className="table-th text-right">Cantidad</th><th className="table-th">Referencia</th>
            <th className="table-th">Observaciones</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.slice(0,200).map(m => (
              <tr key={m.id} className="hover:bg-gray-50/50">
                <td className="table-td">{fmtDate(m.fecha)}</td>
                <td className="table-td"><span className={`badge ${tipoColor[m.tipo]}`}>{m.tipo}</span></td>
                <td className="table-td">{sedeMap[m.sedeId]||m.sedeId}</td>
                <td className="table-td">{m.producto}</td>
                <td className={`table-td text-right font-medium ${m.cantidad < 0 ? 'text-red-600' : 'text-green-600'}`}>{m.cantidad > 0 ? '+':''}{m.cantidad}</td>
                <td className="table-td font-mono text-xs">{m.referencia||'—'}</td>
                <td className="table-td text-gray-500">{m.observaciones||'—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Sin movimientos</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && <Modal title="Nuevo Movimiento" onClose={() => setShowForm(false)}><MovForm onClose={() => setShowForm(false)} /></Modal>}
    </div>
  )
}
