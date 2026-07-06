import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import PageHeader from '../components/common/PageHeader'
import Confirm from '../components/common/Confirm'
import { genId, fmtDate, todayISO } from '../utils/helpers'
import { exportarExcelReqPago } from '../utils/excelReqPago'
import {
  PlusIcon, TrashIcon, ArrowLeftIcon, DocumentArrowDownIcon,
  PencilSquareIcon, MagnifyingGlassIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, PaperAirplaneIcon
} from '@heroicons/react/24/outline'

function mkItem() {
  return {
    id: genId(), centroCosto: '', documento: '', detalle: '',
    monto: '', cuenta: '', razonSocial: '', rucDni: '', observacion: '',
    estadoItem: 'Pendiente', motivoRechazo: ''
  }
}

const MONEDAS = [
  { value: 'PEN', label: 'Soles (S/)',   simbolo: 'S/' },
  { value: 'USD', label: 'Dólares ($)', simbolo: '$' },
]
const getSimbolo = (moneda) => MONEDAS.find(m => m.value === moneda)?.simbolo || 'S/'

const fmtS = (v, moneda = 'PEN') => {
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return getSimbolo(moneda) + ' ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

const parseMontoES = (s) => {
  const cleaned = String(s).replace(/[^\d.,]/g, '')
  if (cleaned.includes(',')) return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
  if (/\.\d{3}$/.test(cleaned)) return parseFloat(cleaned.replace(/\./g, '')) || 0
  return parseFloat(cleaned) || 0
}

const ESTADO_COLOR = {
  'Borrador':        'bg-gray-100 text-gray-600',
  'Pendiente':       'bg-amber-100 text-amber-700',
  'Aprobado':        'bg-green-100 text-green-700',
  'Aprobado Parcial':'bg-teal-100 text-teal-700',
  'Rechazado':       'bg-red-100 text-red-700',
}
const ESTADO_ICON = {
  'Borrador':         ClockIcon,
  'Pendiente':        ClockIcon,
  'Aprobado':         CheckCircleIcon,
  'Aprobado Parcial': CheckCircleIcon,
  'Rechazado':        XCircleIcon,
}

function EstadoBadge({ estado }) {
  const Icon = ESTADO_ICON[estado] || ClockIcon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLOR[estado] || 'bg-gray-100 text-gray-600'}`}>
      <Icon className="w-3 h-3" />{estado || 'Borrador'}
    </span>
  )
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function ReqPagoForm({ initial, user, onSave, onBack }) {
  const empty = { fecha: todayISO(), descripcion: '', moneda: 'PEN', items: [mkItem()], firma0: '', firma1: '', firma2: '', estado: 'Borrador' }
  const [form, setForm] = useState(() =>
    initial ? { ...initial, items: initial.items.map(i => ({ ...i })) } : empty
  )
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setItem = (idx, k, v) => setForm(p => ({
    ...p, items: p.items.map((it, i) => i === idx ? { ...it, [k]: v } : it)
  }))
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, mkItem()] }))
  const removeItem = idx => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  const total = form.items.reduce((s, it) => s + parseMontoES(it.monto), 0)

  const handleSubmit = () => {
    if (form.items.some(it => !it.detalle.trim())) { alert('Complete el DETALLE de todos los ítems'); return }
    onSave(form)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" />Volver
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {initial ? `Editar ${initial.numero}` : 'Nuevo Requerimiento de Pago'}
        </h1>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">FECHA</label>
            <input type="date" className="input" value={form.fecha} onChange={e => setF('fecha', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">DESCRIPCIÓN GENERAL</label>
            <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Descripción general del requerimiento..." />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">MONEDA</label>
            <select className="input" value={form.moneda || 'PEN'} onChange={e => setF('moneda', e.target.value)}>
              {MONEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className="border border-[#1e3a5f] rounded-xl overflow-hidden">
          <div className="bg-[#1e3a5f] px-4 py-2.5 flex items-center justify-between">
            <p className="text-white text-xs font-bold uppercase tracking-wide">Ítems del Requerimiento de Pago</p>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white font-medium">
              <PlusIcon className="w-3.5 h-3.5" />Agregar fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 1000 }}>
              <thead>
                <tr className="bg-[#003875] text-white">
                  <th className="table-th text-white text-center w-8">ITEM</th>
                  <th className="table-th text-white w-20">CENTRO<br/>COSTO</th>
                  <th className="table-th text-white w-28">DOCUMENTO</th>
                  <th className="table-th text-white" style={{ minWidth: 180 }}>DETALLE</th>
                  <th className="table-th text-white w-24">MONTO ({getSimbolo(form.moneda)})</th>
                  <th className="table-th text-white w-36">CUENTA / PROVEEDOR</th>
                  <th className="table-th text-white" style={{ minWidth: 140 }}>RAZÓN SOCIAL</th>
                  <th className="table-th text-white w-28">RUC/DNI/CE</th>
                  <th className="table-th text-white w-28">OBSERVACIÓN</th>
                  <th className="table-th text-white w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {form.items.map((it, idx) => (
                  <tr key={it.id} className={idx % 2 === 1 ? 'bg-gray-50/60' : ''}>
                    <td className="table-td text-center text-gray-400 font-mono font-bold">{String(idx+1).padStart(2,'0')}</td>
                    <td className="table-td"><input className="input text-xs py-1" value={it.centroCosto} onChange={e => setItem(idx,'centroCosto',e.target.value)} placeholder="OPE..." /></td>
                    <td className="table-td"><input className="input text-xs py-1" value={it.documento} onChange={e => setItem(idx,'documento',e.target.value)} placeholder="F001-000000" /></td>
                    <td className="table-td"><input className="input text-xs py-1 w-full" value={it.detalle} onChange={e => setItem(idx,'detalle',e.target.value)} placeholder="Descripción del pago..." /></td>
                    <td className="table-td">
                      <input type="text" inputMode="decimal" className="input text-xs py-1 text-right w-full"
                        value={it.monto} onChange={e => setItem(idx,'monto',e.target.value.replace(/[^0-9.,]/g,''))} placeholder="0.00" />
                    </td>
                    <td className="table-td"><input className="input text-xs py-1" value={it.cuenta} onChange={e => setItem(idx,'cuenta',e.target.value)} placeholder="N° cuenta..." /></td>
                    <td className="table-td"><input className="input text-xs py-1 w-full" value={it.razonSocial} onChange={e => setItem(idx,'razonSocial',e.target.value)} placeholder="Razón social..." /></td>
                    <td className="table-td"><input className="input text-xs py-1" value={it.rucDni} onChange={e => setItem(idx,'rucDni',e.target.value)} placeholder="RUC/DNI..." /></td>
                    <td className="table-td"><input className="input text-xs py-1" value={it.observacion} onChange={e => setItem(idx,'observacion',e.target.value)} placeholder="Obs..." /></td>
                    <td className="table-td">
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-yellow-50 border-t-2 border-yellow-200">
                  <td colSpan={4} className="table-td text-right font-bold text-sm pr-3">TOTAL {getSimbolo(form.moneda)}</td>
                  <td className="table-td text-right font-bold text-sm text-green-700">
                    {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Elaborado por — siempre visible */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase">Elaborado por</p>
            </div>
            <div className="p-3">
              <input className="input text-sm" value={form.firma0 || ''} onChange={e => setF('firma0', e.target.value)} placeholder="Nombre y cargo..." />
            </div>
          </div>
          {/* Aprobado por — solo Contador puede editar */}
          {user?.rol === 'Contador' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-600 uppercase">Aprobado por</p>
              </div>
              <div className="p-3">
                <input className="input text-sm" value={form.firma1 || ''} onChange={e => setF('firma1', e.target.value)} placeholder="Nombre y cargo..." />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onBack} className="btn-secondary">Cancelar</button>
          <button type="button" onClick={handleSubmit} className="btn-primary flex items-center gap-2">
            <DocumentArrowDownIcon className="w-4 h-4" />Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── APPROVAL PANEL ────────────────────────────────────────────────────────────
function AprobacionPanel({ rp, onAprobar }) {
  const [confirmBox, setConfirmBox] = useState(null)
  const [firmaContadora, setFirmaContadora] = useState(rp.firma1 || '')
  const [aprobacion, setAprobacion] = useState(() => {
    const base = {}
    ;(rp.items || []).forEach(it => {
      base[it.id] = { estadoItem: it.estadoItem || 'Pendiente', motivoRechazo: it.motivoRechazo || '' }
    })
    return base
  })

  const setItemAprob = (itemId, key, val) => {
    setAprobacion(p => ({ ...p, [itemId]: { ...p[itemId], [key]: val } }))
  }

  const aprobarTodos = () => {
    const next = {}
    ;(rp.items || []).forEach(it => { next[it.id] = { estadoItem: 'Aprobado', motivoRechazo: '' } })
    setAprobacion(next)
  }

  const totalAprobado = (rp.items || []).reduce((s, it) => {
    const a = aprobacion[it.id]
    return s + (a?.estadoItem === 'Aprobado' ? parseMontoES(it.monto) : 0)
  }, 0)

  const handleGuardar = () => {
    const itemsAprob = (rp.items || []).map(it => ({
      itemId: it.id,
      estadoItem: aprobacion[it.id]?.estadoItem || 'Pendiente',
      motivoRechazo: aprobacion[it.id]?.motivoRechazo || ''
    }))
    const hayPendientes = itemsAprob.some(a => a.estadoItem === 'Pendiente')
    if (hayPendientes) {
      setConfirmBox({
        message: 'Hay ítems sin revisar. ¿Guardar de todas formas?',
        confirmLabel: 'Guardar',
        danger: false,
        onConfirm: () => { setConfirmBox(null); onAprobar(itemsAprob, firmaContadora) }
      })
      return
    }
    onAprobar(itemsAprob, firmaContadora)
  }

  return (
    <div className="card border-2 border-amber-300 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-amber-800 text-sm">Panel de Aprobación — Contadora</p>
          <p className="text-xs text-amber-600 mt-0.5">Revisa cada ítem y aprueba o rechaza según corresponda</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Total aprobado:</span>
          <span className="font-bold text-green-700 text-sm">
            S/ {totalAprobado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <button onClick={aprobarTodos} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded-lg font-semibold transition-colors">
            Aprobar todos
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(rp.items || []).map((it, idx) => {
          const a = aprobacion[it.id] || { estadoItem: 'Pendiente', motivoRechazo: '' }
          const isAprobado = a.estadoItem === 'Aprobado'
          const isRechazado = a.estadoItem === 'Rechazado'
          return (
            <div key={it.id} className={`rounded-lg border p-3 transition-colors ${
              isAprobado ? 'bg-green-50 border-green-200' :
              isRechazado ? 'bg-red-50 border-red-200' :
              'bg-white border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-gray-400 w-6 shrink-0 pt-0.5">{String(idx+1).padStart(2,'0')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{it.detalle || '—'}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    {it.documento && <span>Doc: {it.documento}</span>}
                    {it.razonSocial && <span>{it.razonSocial}</span>}
                    <span className="font-semibold text-gray-700">{fmtS(it.monto, rp.moneda)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setItemAprob(it.id, 'estadoItem', 'Aprobado')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      isAprobado ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                    }`}>
                    <CheckCircleIcon className="w-3.5 h-3.5" />Aprobar
                  </button>
                  <button
                    onClick={() => setItemAprob(it.id, 'estadoItem', 'Rechazado')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      isRechazado ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                    }`}>
                    <XCircleIcon className="w-3.5 h-3.5" />Rechazar
                  </button>
                </div>
              </div>
              {isRechazado && (
                <div className="mt-2 ml-9">
                  <input
                    className="input text-xs py-1 w-full border-red-200"
                    placeholder="Motivo de rechazo (requerido)..."
                    value={a.motivoRechazo}
                    onChange={e => setItemAprob(it.id, 'motivoRechazo', e.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-amber-200 pt-3 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Aprobado por (nombre completo)</label>
          <input
            className="input text-sm"
            value={firmaContadora}
            onChange={e => setFirmaContadora(e.target.value)}
            placeholder="Ej: María García López — Contadora"
          />
        </div>
        <div className="flex justify-end">
          <button onClick={handleGuardar} className="btn-primary flex items-center gap-2 text-sm">
            <CheckCircleIcon className="w-4 h-4" />Guardar aprobación
          </button>
        </div>
      </div>
      {confirmBox && <Confirm {...confirmBox} onCancel={() => setConfirmBox(null)} />}
    </div>
  )
}

// ── LIST ──────────────────────────────────────────────────────────────────────
function ReqPagoList({ reqPagos, canCreate, canEdit, onNew, onView, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtrados = useMemo(() => {
    return [...reqPagos].filter(r => {
      const fecha = r.fecha || r.createdAt?.split('T')[0] || ''
      if (search && !`${r.numero} ${r.descripcion}`.toLowerCase().includes(search.toLowerCase())) return false
      if (fechaDesde && fecha < fechaDesde) return false
      if (fechaHasta && fecha > fechaHasta) return false
      if (filtroEstado && (r.estado || 'Borrador') !== filtroEstado) return false
      return true
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [reqPagos, search, fechaDesde, fechaHasta, filtroEstado])

  const total = filtrados.reduce((s, r) => s + (r.items || []).reduce((s2, it) => s2 + parseMontoES(it.monto), 0), 0)
  const hayFiltros = search || fechaDesde || fechaHasta || filtroEstado
  const limpiar = () => { setSearch(''); setFechaDesde(''); setFechaHasta(''); setFiltroEstado('') }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Requerimientos de Pago"
        subtitle={`${filtrados.length} de ${reqPagos.length} registros · Total filtrado: S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
        action={canCreate && <button onClick={onNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />Nuevo Req. de Pago
          </button>}
      />

      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            <input className="input pl-8 text-sm w-52" placeholder="Buscar por N° o descripción..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Desde</label>
            <input type="date" className="input text-sm w-36" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Hasta</label>
            <input type="date" className="input text-sm w-36" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <div>
            <select className="input text-sm w-40" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Borrador">Borrador</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Aprobado Parcial">Aprobado Parcial</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          {hayFiltros && (
            <button onClick={limpiar} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpiar filtros</button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="table-th">N° REQ PAGO</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Descripción</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th text-center">Ítems</th>
                <th className="table-th text-right">Total S/</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center text-gray-400 py-12">
                  No hay requerimientos de pago registrados
                </td></tr>
              ) : filtrados.map(r => {
                const rowTotal = (r.items||[]).reduce((s,it)=>s+parseMontoES(it.monto),0)
                const aprobados = (r.items||[]).filter(it => it.estadoItem === 'Aprobado').length
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => onView(r)}>
                    <td className="table-td font-mono font-bold text-[#1e3a5f]">{r.numero}</td>
                    <td className="table-td whitespace-nowrap">{fmtDate(r.fecha || r.createdAt)}</td>
                    <td className="table-td text-gray-600">{r.descripcion || '—'}</td>
                    <td className="table-td text-center">
                      <EstadoBadge estado={r.estado || 'Borrador'} />
                    </td>
                    <td className="table-td text-center text-xs">
                      {(r.items||[]).length > 0 && r.estado !== 'Borrador'
                        ? <span className="text-green-700 font-semibold">{aprobados}/{(r.items||[]).length} aprobados</span>
                        : <span className="text-gray-500">{(r.items||[]).length}</span>
                      }
                    </td>
                    <td className="table-td text-right font-semibold text-green-700">
                      {rowTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="table-td" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {canEdit && (r.estado === 'Borrador' || !r.estado) && (
                          <button onClick={() => onEdit(r)} className="text-gray-400 hover:text-gray-600 p-1" title="Editar">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (r.estado === 'Borrador' || r.estado === 'Pendiente' || !r.estado) && (
                          <button onClick={() => onDelete(r)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── DETAIL ────────────────────────────────────────────────────────────────────
function ReqPagoDetail({ rp, logo, onBack, onEdit, onEnviar, onAprobar, isContador, canEdit }) {
  const total = (rp.items||[]).reduce((s,it)=>s+parseMontoES(it.monto),0)
  const totalAprobado = (rp.items||[]).filter(it=>it.estadoItem==='Aprobado').reduce((s,it)=>s+parseMontoES(it.monto),0)
  const sim = getSimbolo(rp.moneda)
  const estado = rp.estado || 'Borrador'
  const puedeEnviar = estado === 'Borrador'
  const puedeAprobar = isContador && estado === 'Pendiente'
  const tieneAprobacion = ['Aprobado','Aprobado Parcial','Rechazado'].includes(estado)

  const ITEM_ESTADO_COLOR = {
    'Aprobado':  'bg-green-50 border-green-200',
    'Rechazado': 'bg-red-50 border-red-200',
    'Pendiente': '',
  }
  const ITEM_BADGE = {
    'Aprobado':  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full"><CheckCircleIcon className="w-3 h-3"/>Aprobado</span>,
    'Rechazado': <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full"><XCircleIcon className="w-3 h-3"/>Rechazado</span>,
    'Pendiente': <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"><ClockIcon className="w-3 h-3"/>Pendiente</span>,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-1">
            <ArrowLeftIcon className="w-4 h-4" />Volver
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#1e3a5f]">REQUERIMIENTO # {rp.numero}</h1>
              <EstadoBadge estado={estado} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{fmtDate(rp.fecha || rp.createdAt)} · {rp.descripcion || ''}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportarExcelReqPago(rp).catch(e => console.error(e))} className="btn-secondary flex items-center gap-2 text-sm">
            <DocumentArrowDownIcon className="w-4 h-4" />Descargar Excel
          </button>
          {puedeEnviar && (
            <button onClick={onEnviar} className="btn-primary flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-700 border-amber-600">
              <PaperAirplaneIcon className="w-4 h-4" />Enviar a contadora
            </button>
          )}
          {canEdit && (estado === 'Borrador' || !rp.estado) && (
            <button onClick={() => onEdit(rp)} className="btn-secondary flex items-center gap-2 text-sm">
              <PencilSquareIcon className="w-4 h-4" />Editar
            </button>
          )}
        </div>
      </div>

      {/* Panel aprobación si está pendiente y es contadora */}
      {puedeAprobar && <AprobacionPanel rp={rp} onAprobar={onAprobar} />}

      {/* Resumen de aprobación si ya fue revisado */}
      {tieneAprobacion && (
        <div className={`card p-4 flex items-center gap-6 ${
          estado === 'Aprobado' ? 'bg-green-50 border-green-200' :
          estado === 'Aprobado Parcial' ? 'bg-teal-50 border-teal-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div>
            <p className="text-xs text-gray-500">Total solicitado</p>
            <p className="font-bold text-gray-800">{sim} {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total aprobado</p>
            <p className="font-bold text-green-700">{sim} {totalAprobado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Diferencia</p>
            <p className="font-bold text-red-600">{sim} {(total - totalAprobado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="bg-[#15803d] px-4 py-2.5 flex items-center justify-between">
          <p className="text-white text-xs font-bold uppercase tracking-wide">REQUERIMIENTO # {rp.numero}</p>
          {tieneAprobacion && (
            <span className="text-green-200 text-xs">
              {(rp.items||[]).filter(i=>i.estadoItem==='Aprobado').length} aprobados · {(rp.items||[]).filter(i=>i.estadoItem==='Rechazado').length} rechazados
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 900 }}>
            <thead>
              <tr className="bg-[#003875] text-white">
                <th className="table-th text-white text-center w-8">ITEM</th>
                <th className="table-th text-white w-16">CENTRO<br/>COSTO</th>
                <th className="table-th text-white w-28">DOCUMENTO</th>
                <th className="table-th text-white">DETALLE</th>
                <th className="table-th text-white text-right w-24">MONTO ({sim})</th>
                <th className="table-th text-white w-36">CUENTA / PROVEEDOR</th>
                <th className="table-th text-white">RAZÓN SOCIAL</th>
                <th className="table-th text-white w-24">RUC/DNI/CE</th>
                <th className="table-th text-white w-28">OBSERVACIÓN</th>
                {tieneAprobacion && <th className="table-th text-white w-28">ESTADO</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(rp.items||[]).map((it, idx) => (
                <tr key={it.id} className={`${
                  tieneAprobacion
                    ? ITEM_ESTADO_COLOR[it.estadoItem] || ''
                    : idx % 2 === 1 ? 'bg-gray-50/60 hover:bg-gray-100/60' : 'hover:bg-gray-50/40'
                }`}>
                  <td className="table-td text-center font-mono text-gray-400">{String(idx+1).padStart(2,'0')}</td>
                  <td className="table-td font-medium">{it.centroCosto || '—'}</td>
                  <td className="table-td font-mono text-xs">{it.documento || '—'}</td>
                  <td className="table-td">
                    <div>{it.detalle || '—'}</div>
                    {it.estadoItem === 'Rechazado' && it.motivoRechazo && (
                      <div className="text-red-600 text-xs mt-0.5 italic">↳ {it.motivoRechazo}</div>
                    )}
                  </td>
                  <td className={`table-td text-right font-semibold ${it.estadoItem === 'Rechazado' ? 'text-red-400 line-through' : 'text-green-700'}`}>
                    {fmtS(it.monto, rp.moneda)}
                  </td>
                  <td className="table-td font-mono text-xs">{it.cuenta || '—'}</td>
                  <td className="table-td">{it.razonSocial || '—'}</td>
                  <td className="table-td font-mono text-xs">{it.rucDni || '—'}</td>
                  <td className="table-td text-xs text-gray-500">{it.observacion || '—'}</td>
                  {tieneAprobacion && (
                    <td className="table-td">{ITEM_BADGE[it.estadoItem] || ITEM_BADGE['Pendiente']}</td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-yellow-50 border-t-2 border-yellow-300">
                <td colSpan={4} className="table-td text-right font-bold text-sm pr-3">
                  {tieneAprobacion ? `TOTAL APROBADO ${sim}` : `TOTAL ${sim}`}
                </td>
                <td className="table-td text-right font-bold text-base text-green-700">
                  {(tieneAprobacion ? totalAprobado : total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={tieneAprobacion ? 5 : 4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {(rp.firma0 || rp.firma1 || rp.firma2) && (
        <div className="grid grid-cols-3 gap-4">
          {['Elaborado por','Aprobado por'].map((label, i) => (
            rp[`firma${i}`] ? (
              <div key={i} className="card p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</p>
                <p className="text-sm font-medium">{rp[`firma${i}`]}</p>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ReqPago() {
  const { state, dispatch } = useApp()
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const isContador = user?.rol === 'Contador'
  const isFacturacion = user?.rol === 'Facturación'
  const canAccess = isAdmin || isContador || isFacturacion || user?.rol === 'Coordinador General' || user?.rol === 'Coordinador Logística y Compras'

  const [view, setView] = useState('list')
  const [confirmBox, setConfirmBox] = useState(null)
  const [editing, setEditing] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const reqPagos = state.reqPagos || []
  const detailRp = detailId ? reqPagos.find(r => r.id === detailId) : null

  const handleNew  = () => { setEditing(null); setView('form') }
  const handleEdit = r  => { setEditing(r); setView('form') }
  const handleView = r  => { setDetailId(r.id); setView('detail') }
  const handleBack = () => { setView('list'); setEditing(null); setDetailId(null) }

  const handleSave = (formData) => {
    if (editing) {
      dispatch({ type: 'UPDATE_REQ_PAGO', id: editing.id, payload: { ...formData } })
      toast(`${editing.numero} actualizado`)
    } else {
      dispatch({ type: 'ADD_REQ_PAGO', payload: { ...formData, estado: 'Borrador' } })
      toast('Requerimiento de pago guardado')
    }
    handleBack()
  }

  const handleDelete = (r) => {
    setConfirmBox({
      message: `¿Eliminar el requerimiento ${r.numero}?`,
      onConfirm: () => {
        dispatch({ type: 'DELETE_REQ_PAGO', id: r.id })
        toast(`${r.numero} eliminado`)
        setConfirmBox(null)
      }
    })
  }

  const handleEnviar = () => {
    dispatch({ type: 'UPDATE_REQ_PAGO', id: detailId, payload: { estado: 'Pendiente' } })
    toast('Enviado a la contadora para revisión', 'success')
  }

  const handleAprobar = (itemsAprobacion, firmaContadora) => {
    const todosAprobados = itemsAprobacion.every(a => a.estadoItem === 'Aprobado')
    const todosRechazados = itemsAprobacion.every(a => a.estadoItem === 'Rechazado')
    const hayPendientes = itemsAprobacion.some(a => a.estadoItem === 'Pendiente')
    const estadoFinal = hayPendientes ? 'Pendiente'
      : todosAprobados ? 'Aprobado'
      : todosRechazados ? 'Rechazado'
      : 'Aprobado Parcial'

    const itemsActualizados = (detailRp.items || []).map(it => {
      const ap = itemsAprobacion.find(a => a.itemId === it.id)
      return ap ? { ...it, estadoItem: ap.estadoItem, motivoRechazo: ap.motivoRechazo || '' } : it
    })

    dispatch({
      type: 'UPDATE_REQ_PAGO', id: detailId,
      payload: { estado: estadoFinal, items: itemsActualizados, aprobadoPor: user?.nombre || user?.email || 'Contadora', fechaAprobacion: todayISO(), firma1: firmaContadora || user?.nombre || '' }
    })
    toast(`Aprobación guardada — ${estadoFinal}`, 'success')
  }

  const canCreate = isAdmin || isFacturacion || user?.rol === 'Coordinador Logística y Compras'
  const canEdit = !isContador

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">Acceso restringido</p>
          <p className="text-gray-400 text-sm">No tienes permisos para ver esta sección.</p>
        </div>
      </div>
    )
  }

  if (view === 'form') {
    return (
      <>
        <ReqPagoForm initial={editing} user={user} onSave={handleSave} onBack={handleBack} />
        {confirmBox && <Confirm {...confirmBox} onCancel={() => setConfirmBox(null)} />}
      </>
    )
  }

  if (view === 'detail' && detailRp) {
    return (
      <>
        <ReqPagoDetail
          rp={detailRp} logo={state.logo}
          onBack={handleBack} onEdit={handleEdit} canEdit={canEdit}
          onEnviar={handleEnviar} onAprobar={handleAprobar}
          isContador={isContador || isAdmin}
        />
        {confirmBox && <Confirm {...confirmBox} onCancel={() => setConfirmBox(null)} />}
      </>
    )
  }

  return (
    <>
      <ReqPagoList
        reqPagos={reqPagos}
        canCreate={canCreate}
        onNew={handleNew}
        onView={handleView}
        canEdit={canEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {confirmBox && <Confirm {...confirmBox} onCancel={() => setConfirmBox(null)} />}
    </>
  )
}
