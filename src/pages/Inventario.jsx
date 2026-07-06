import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { fmtMoney } from '../utils/helpers'
import PageHeader from '../components/common/PageHeader'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Inventario() {
  const { state } = useApp()
  const { inventario, productos, sedes } = state
  const [filtroSede, setFiltroSede] = useState('s1')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const categorias = [...new Set(productos.map(p => p.categoria))].sort()
  const prodMap = Object.fromEntries(productos.map(p => [p.id, p]))

  const stockSede = useMemo(() => {
    const sid = filtroSede
    const inv = inventario[sid] || {}
    return Object.entries(inv).map(([pid, data]) => {
      const prod = prodMap[pid]
      if (!prod) return null
      if (filtroCategoria && prod.categoria !== filtroCategoria) return null
      return { ...prod, cantidad: data.cantidad, precio: data.precio, valorTotal: data.cantidad * data.precio }
    }).filter(Boolean).sort((a,b) => a.nombre.localeCompare(b.nombre))
  }, [inventario, filtroSede, filtroCategoria, productos])

  const totalValorizado = stockSede.reduce((s, p) => s + p.valorTotal, 0)

  const sedeName = sedes.find(s => s.id === filtroSede)?.nombre || ''

  return (
    <div>
      <PageHeader title="Inventario por Sede" subtitle="Stock valorizado por ubicación" />

      <div className="card mb-4 flex gap-3 flex-wrap">
        <select className="input max-w-[220px]" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select className="input max-w-[180px]" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">{sedeName} — {stockSede.length} productos</h2>
          <div className="bg-[#1e3a5f] text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
            Total valorizado: {fmtMoney(totalValorizado)}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">Código</th><th className="table-th">Producto</th>
            <th className="table-th">Categoría</th><th className="table-th">Unidad</th>
            <th className="table-th text-right">Cantidad</th>
            <th className="table-th text-right">Precio Unit.</th>
            <th className="table-th text-right">Valor Total</th>
            <th className="table-th">Alerta</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {stockSede.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50/50 ${p.cantidad === 0 ? 'bg-red-50/30' : ''}`}>
                <td className="table-td font-mono text-xs">{p.codigo}</td>
                <td className="table-td font-medium">{p.nombre}</td>
                <td className="table-td">{p.categoria}</td>
                <td className="table-td">{p.unidad}</td>
                <td className={`table-td text-right font-semibold ${p.cantidad === 0 ? 'text-red-600' : p.cantidad <= 3 ? 'text-amber-600' : 'text-gray-800'}`}>{p.cantidad}</td>
                <td className="table-td text-right">{fmtMoney(p.precio)}</td>
                <td className="table-td text-right font-medium">{fmtMoney(p.valorTotal)}</td>
                <td className="table-td">
                  {p.cantidad === 0 && <span className="flex items-center gap-1 text-red-600 text-xs"><ExclamationTriangleIcon className="w-4 h-4"/>Sin stock</span>}
                  {p.cantidad > 0 && p.cantidad <= 3 && <span className="flex items-center gap-1 text-amber-600 text-xs"><ExclamationTriangleIcon className="w-4 h-4"/>Stock bajo</span>}
                </td>
              </tr>
            ))}
            {stockSede.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">Sin productos en esta sede</td></tr>}
          </tbody>
        </table>
        {stockSede.length > 0 && (
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-end">
            <p className="text-sm font-bold text-gray-800">Total valorizado: {fmtMoney(totalValorizado)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
