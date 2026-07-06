import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/layout/Toast'
import { fmtMoney, fmtDate, genId, todayISO } from '../utils/helpers'
import { generarPDFVale } from '../utils/pdfVale'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import { PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

const EMPTY_ITEM = { id:'', productoId:'', descripcion:'', codigo:'', unidad:'', cantidad:1, precioUnit:0, precioTotal:0, observaciones:'' }

function TransferenciaForm({ onClose }) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const sedesDestino = state.sedes.filter(s => !s.esCentral)
  const prods = state.productos
  const stockCentral = state.inventario['s1'] || {}

  const [form, setForm] = useState({
    areaSolicitante: '', responsable: '', sedeDestinoId: '', fecha: todayISO(),
    items: [{ ...EMPTY_ITEM, id: genId() }], observaciones: ''
  })

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const setItem = (idx, k, v) => {
    const items = form.items.map((it, i) => {
      if (i !== idx) return it
      const next = { ...it, [k]: v }
      if (k === 'productoId') {
        const prod = prods.find(p => p.id === v)
        if (prod) {
          next.descripcion = prod.nombre
          next.codigo = prod.codigo
          next.unidad = prod.unidad
          next.precioUnit = prod.ultimoPrecio || 0
          next.precioTotal = next.precioUnit * (next.cantidad || 1)
        }
      }
      if (k === 'cantidad' || k === 'precioUnit') {
        const cant = k === 'cantidad' ? parseFloat(v)||0 : parseFloat(next.cantidad)||0
        const pu = k === 'precioUnit' ? parseFloat(v)||0 : parseFloat(next.precioUnit)||0
        next.precioTotal = cant * pu
      }
      return next
    })
    setForm(p => ({ ...p, items }))
  }

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM, id: genId() }] }))
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  const total = form.items.reduce((s, it) => s + (it.precioTotal||0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.areaSolicitante || !form.responsable || !form.sedeDestinoId) return toast('Completa los datos de cabecera', 'error')
    if (form.items.some(it => !it.productoId)) return toast('Selecciona producto en todos los ítems', 'error')

    // Validar stock
    for (const it of form.items) {
      const stock = stockCentral[it.productoId]?.cantidad || 0
      if (it.cantidad > stock) {
        toast(`Stock insuficiente: "${it.descripcion}" (disponible: ${stock})`, 'error')
        return
      }
    }

    // Pre-calcular el número de vale para mostrarlo en el modal
    const nextNum = state.ultimoVale + 1
    const numeroVale = `VS-${String(nextNum).padStart(4,'0')}`
    const payload = { ...form, total, items: form.items.map(it => ({ ...it, cantidad: parseFloat(it.cantidad)||0, precioUnit: parseFloat(it.precioUnit)||0 })) }
    dispatch({ type: 'ADD_TRANSFERENCIA', payload })
    toast('Transferencia registrada. Generando PDF...', 'success')
    onClose('pdf', { ...payload, numeroVale, id: 'new', sedeDestinoId: form.sedeDestinoId })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Área Solicitante *</label>
          <input className="input" value={form.areaSolicitante} onChange={e => setField('areaSolicitante', e.target.value)} placeholder="Ej: Operaciones" required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Responsable Solicitante *</label>
          <input className="input" value={form.responsable} onChange={e => setField('responsable', e.target.value)} placeholder="Nombre del responsable" required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Sede/Área de Destino *</label>
          <select className="input" value={form.sedeDestinoId} onChange={e => setField('sedeDestinoId', e.target.value)} required>
            <option value="">Seleccionar sede...</option>
            {sedesDestino.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Fecha</label>
          <input className="input" type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Productos a transferir</p>
          <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><PlusIcon className="w-3.5 h-3.5"/>Agregar ítem</button>
        </div>
        <div className="space-y-2">
          {form.items.map((it, idx) => {
            const stockDisp = stockCentral[it.productoId]?.cantidad ?? null
            return (
              <div key={it.id} className="bg-gray-50 p-2 rounded-lg space-y-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Producto</label>}
                    <select className="input text-xs" value={it.productoId} onChange={e => setItem(idx, 'productoId', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    {stockDisp !== null && <p className={`text-xs mt-0.5 ${stockDisp === 0 ? 'text-red-500' : 'text-gray-400'}`}>Stock central: {stockDisp}</p>}
                  </div>
                  <div className="col-span-1">
                    {idx === 0 && <label className="text-xs text-gray-500 block mb-1">UM</label>}
                    <input className="input text-xs" value={it.unidad} onChange={e => setItem(idx, 'unidad', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Cantidad</label>}
                    <input className="input text-xs" type="number" min="1" value={it.cantidad}
                      onChange={e => setItem(idx, 'cantidad', e.target.value)}
                      max={stockDisp ?? undefined} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="text-xs text-gray-500 block mb-1">P. Unitario</label>}
                    <input className="input text-xs" type="number" step="0.01" min="0" value={it.precioUnit}
                      onChange={e => setItem(idx, 'precioUnit', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Total</label>}
                    <p className="text-xs font-medium text-gray-700 pt-2">{fmtMoney(it.precioTotal)}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs pt-1">✕</button>
                  </div>
                </div>
                <input className="input text-xs" value={it.observaciones}
                  onChange={e => setItem(idx, 'observaciones', e.target.value)}
                  placeholder="Observaciones / comentarios (opcional)" />
              </div>
            )
          })}
        </div>
        <div className="flex justify-end mt-2">
          <p className="text-sm font-semibold text-gray-800">Total general: {fmtMoney(total)}</p>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={() => onClose()} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary flex items-center gap-2"><DocumentArrowDownIcon className="w-4 h-4"/>Registrar y Generar Vale PDF</button>
      </div>
    </form>
  )
}

export default function Transferencias() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [successModal, setSuccessModal] = useState(null)

  const sedeMap = Object.fromEntries(state.sedes.map(s => [s.id, s.nombre]))
  const transferencias = [...state.transferencias].sort((a,b) => new Date(b.fecha)-new Date(a.fecha))

  const handleClose = (flag, valeData) => {
    setShowForm(false)
    if (flag === 'pdf' && valeData) {
      setSuccessModal(valeData)
    }
  }

  const descargarPDF = (vale) => {
    generarPDFVale(vale, state.sedes, state.logo)
    toast(`PDF ${vale.numeroVale} descargado`)
  }

  return (
    <div>
      <PageHeader title="Transferencias a Sede" subtitle="Salidas del almacén central hacia sedes"
        action={<button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-4 h-4"/>Nueva Transferencia</button>} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">N° Vale</th><th className="table-th">Fecha</th>
            <th className="table-th">Sede Destino</th><th className="table-th">Área Solicitante</th>
            <th className="table-th">Responsable</th><th className="table-th">Ítems</th>
            <th className="table-th text-right">Total</th><th className="table-th">PDF</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {transferencias.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="table-td font-mono text-xs font-semibold text-[#1e3a5f]">{t.numeroVale}</td>
                <td className="table-td">{fmtDate(t.fecha)}</td>
                <td className="table-td">{sedeMap[t.sedeDestinoId]}</td>
                <td className="table-td">{t.areaSolicitante}</td>
                <td className="table-td">{t.responsable}</td>
                <td className="table-td">{t.items.length}</td>
                <td className="table-td text-right font-medium">{fmtMoney(t.total)}</td>
                <td className="table-td">
                  <button onClick={() => descargarPDF(t)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                    <DocumentArrowDownIcon className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
            {transferencias.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">Sin transferencias</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nueva Transferencia a Sede" onClose={() => setShowForm(false)} wide>
          <TransferenciaForm onClose={handleClose} />
        </Modal>
      )}

      {successModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">¡Transferencia registrada!</h3>
            <p className="text-sm text-gray-500 mb-2">Se generó el vale de salida:</p>
            <p className="text-2xl font-bold text-[#1e3a5f] mb-1">{successModal.numeroVale}</p>
            <p className="text-sm text-gray-500 mb-6">Sede destino: {sedeMap[successModal.sedeDestinoId]}</p>
            <div className="flex gap-3">
              <button onClick={() => setSuccessModal(null)} className="btn-secondary flex-1">Cerrar</button>
              <button onClick={() => { descargarPDF(successModal); setSuccessModal(null) }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <DocumentArrowDownIcon className="w-4 h-4"/>Descargar PDF
              </button>
               </div>
          </div>
        </div>
      )}
    </div>
  )
}
