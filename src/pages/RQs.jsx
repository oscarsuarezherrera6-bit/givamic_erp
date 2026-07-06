import { useState, useRef, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import { fmtMoney, fmtDate, todayISO } from '../utils/helpers'
import { fileToDataURL } from '../utils/parseFact'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import Confirm from '../components/common/Confirm'
import {
  PlusIcon, EyeIcon, TrashIcon, DocumentArrowUpIcon,
  ArrowPathIcon, ExclamationTriangleIcon, ClockIcon,
  CheckCircleIcon, BanknotesIcon, PencilSquareIcon
} from '@heroicons/react/24/outline'

// ── Estados y colores ──────────────────────────────────────
const ESTADOS = ['Pendiente', 'En Revisión', 'Aprobado', 'Pagado', 'Rechazado']
const ESTADO_STYLE = {
  'Pendiente':   'bg-yellow-100 text-yellow-700 border-yellow-200',
  'En Revisión': 'bg-blue-100 text-blue-700 border-blue-200',
  'Aprobado':    'bg-purple-100 text-purple-700 border-purple-200',
  'Pagado':      'bg-green-100 text-green-700 border-green-200',
  'Rechazado':   'bg-red-100 text-red-700 border-red-200',
}

const AREAS = ['Almacén', 'Administración', 'Operaciones', 'Logística', 'Contabilidad', 'Gerencia', 'RRHH']

function alertaVencimiento(fechaVence) {
  if (!fechaVence) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const v = new Date(fechaVence + 'T00:00:00')
  const dias = Math.floor((v - hoy) / 86400000)
  if (dias < 0) return { label: `Vencido (${Math.abs(dias)}d)`, color: 'red' }
  if (dias <= 5) return { label: `Vence en ${dias}d`, color: 'orange' }
  return null
}

// ── Formulario ─────────────────────────────────────────────
function RQForm({ initial, onClose }) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const fileRef = useRef()
  const [loading, setLoading] = useState(false)
  const isEdit = !!initial?.id

  const [form, setForm] = useState(initial || {
    descripcion: '', proveedor: '', proveedorId: '',
    monto: '', igv: '', fechaRQ: todayISO(), fechaVence: '',
    area: '', sedeId: '', estado: 'Pendiente',
    archivoPDF: null, nombreArchivo: '', observaciones: ''
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const montoNum = parseFloat(form.monto) || 0
  const igvNum = parseFloat(form.igv) || 0
  const total = montoNum + igvNum

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return toast('Solo se aceptan archivos PDF', 'error')
    }
    setLoading(true)
    try {
      const dataURL = await fileToDataURL(file)
      set('archivoPDF', dataURL)
      set('nombreArchivo', file.name)
      toast('Archivo adjuntado', 'success')
    } catch { toast('No se pudo cargar el archivo', 'error') }
    finally { setLoading(false); e.target.value = '' }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.descripcion || !form.monto || !form.fechaRQ)
      return toast('Completa los campos obligatorios', 'error')

    // Si se seleccionó proveedor del catálogo, guardar nombre también
    let proveedor = form.proveedor
    if (form.proveedorId) {
      const pv = state.proveedores.find(p => p.id === form.proveedorId)
      if (pv) proveedor = pv.nombre
    }

    const payload = { ...form, proveedor, total }
    if (isEdit) {
      dispatch({ type: 'UPDATE_RQ', id: initial.id, payload })
      toast('RQ actualizado', 'success')
    } else {
      dispatch({ type: 'ADD_RQ', payload })
      toast('RQ registrado', 'success')
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Adjuntar PDF */}
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${form.archivoPDF ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 bg-gray-50'}`}>
        {form.archivoPDF ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span className="text-xl">📄</span>
              <span className="font-medium">{form.nombreArchivo}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { set('archivoPDF', null); set('nombreArchivo', '') }}
                className="text-xs text-red-400 hover:text-red-600">Quitar</button>
              <button type="button" onClick={() => fileRef.current.click()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                <ArrowPathIcon className="w-3.5 h-3.5"/>Cambiar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current.click()} disabled={loading} className="flex flex-col items-center gap-2 w-full">
            {loading
              ? <><ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin"/><span className="text-sm text-blue-500">Cargando...</span></>
              : <><DocumentArrowUpIcon className="w-6 h-6 text-gray-400"/><span className="text-sm text-gray-500">Adjuntar RQ en PDF</span><span className="text-xs text-gray-400">Cotización, orden de compra, requerimiento firmado</span></>
            }
          </button>
        )}
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Descripción / Concepto *</label>
          <input className="input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
            placeholder="Ej: Compra de materiales de limpieza para junio" required />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Proveedor (catálogo)</label>
          <select className="input" value={form.proveedorId}
            onChange={e => { set('proveedorId', e.target.value); if (!e.target.value) set('proveedor', '') }}>
            <option value="">Seleccionar del catálogo...</option>
            {state.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Proveedor (texto libre)</label>
          <input className="input" value={form.proveedor} onChange={e => set('proveedor', e.target.value)}
            placeholder="Si no está en catálogo..." disabled={!!form.proveedorId} />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Monto (sin IGV) *</label>
          <input className="input" type="number" step="0.01" min="0" value={form.monto}
            onChange={e => set('monto', e.target.value)} placeholder="0.00" required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">IGV</label>
          <input className="input" type="number" step="0.01" min="0" value={form.igv}
            onChange={e => set('igv', e.target.value)} placeholder="0.00" />
        </div>
        {(montoNum > 0 || igvNum > 0) && (
          <div className="col-span-2 flex justify-end">
            <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
              Total: {fmtMoney(total)}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Fecha del RQ *</label>
          <input className="input" type="date" value={form.fechaRQ} onChange={e => set('fechaRQ', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Fecha Límite de Pago</label>
          <input className="input" type="date" value={form.fechaVence} onChange={e => set('fechaVence', e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Área Solicitante</label>
          <select className="input" value={form.area} onChange={e => set('area', e.target.value)}>
            <option value="">Seleccionar...</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Sede</label>
          <select className="input" value={form.sedeId} onChange={e => set('sedeId', e.target.value)}>
            <option value="">Todas / Central</option>
            {state.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        {isEdit && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Estado</label>
            <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}

        <div className={isEdit ? '' : 'col-span-2'}>
          <label className="text-xs font-medium text-gray-600 block mb-1">Observaciones</label>
          <input className="input" value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
            placeholder="Notas adicionales para contabilidad..." />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">{isEdit ? 'Actualizar RQ' : 'Registrar RQ'}</button>
      </div>
    </form>
  )
}

// ── Detalle/visor ──────────────────────────────────────────
function RQDetail({ rq, onClose, onEdit }) {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const sedeMap = Object.fromEntries(state.sedes.map(s => [s.id, s.nombre]))

  const cambiarEstado = (estado) => {
    dispatch({ type: 'UPDATE_RQ', id: rq.id, payload: { ...rq, estado } })
    toast(`RQ actualizado a: ${estado}`)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">N° RQ:</span> <span className="font-bold font-mono text-[#1e3a5f]">{rq.numero}</span></div>
        <div><span className="text-gray-500">Estado:</span> <span className={`badge border ${ESTADO_STYLE[rq.estado]}`}>{rq.estado}</span></div>
        <div className="col-span-2"><span className="text-gray-500">Descripción:</span> <span className="font-medium">{rq.descripcion}</span></div>
        <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{rq.proveedor || '—'}</span></div>
        <div><span className="text-gray-500">Área:</span> {rq.area || '—'}</div>
        <div><span className="text-gray-500">Fecha RQ:</span> {fmtDate(rq.fechaRQ)}</div>
        {rq.fechaVence && <div><span className="text-gray-500">Límite pago:</span> <span className="font-medium">{fmtDate(rq.fechaVence)}</span></div>}
        <div><span className="text-gray-500">Monto:</span> {fmtMoney(parseFloat(rq.monto)||0)}</div>
        <div><span className="text-gray-500">IGV:</span> {fmtMoney(parseFloat(rq.igv)||0)}</div>
        <div><span className="text-gray-500">Total:</span> <span className="font-bold text-lg">{fmtMoney(rq.total||0)}</span></div>
        {rq.sedeId && <div><span className="text-gray-500">Sede:</span> {sedeMap[rq.sedeId]}</div>}
        {rq.observaciones && <div className="col-span-2"><span className="text-gray-500">Observaciones:</span> {rq.observaciones}</div>}
      </div>

      {rq.archivoPDF && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-600">📄 {rq.nombreArchivo || 'Documento adjunto'}</span>
            <a href={rq.archivoPDF} download={rq.nombreArchivo || 'rq.pdf'} className="text-xs text-blue-600 hover:underline">Descargar</a>
          </div>
          <iframe src={rq.archivoPDF} className="w-full h-80" title="RQ PDF" />
        </div>
      )}

      {/* Cambio de estado rápido */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Actualizar estado:</p>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.filter(e => e !== rq.estado).map(e => (
            <button key={e} onClick={() => cambiarEstado(e)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 ${ESTADO_STYLE[e]}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={() => { onClose(); onEdit(rq) }} className="btn-secondary flex items-center gap-1">
          <PencilSquareIcon className="w-4 h-4"/>Editar
        </button>
        <button onClick={onClose} className="btn-primary">Cerrar</button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────
export default function RQs() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmBox, setConfirmBox] = useState(null)
  const [detail, setDetail] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [search, setSearch] = useState('')

  const rqs = state.rqs || []
  const sedeMap = Object.fromEntries(state.sedes.map(s => [s.id, s.nombre]))

  const filtered = rqs
    .filter(r => !filtroEstado || r.estado === filtroEstado)
    .filter(r => !filtroArea || r.area === filtroArea)
    .filter(r => !search ||
      r.numero?.toLowerCase().includes(search.toLowerCase()) ||
      r.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      r.proveedor?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.fechaRQ) - new Date(a.fechaRQ))

  const alertas = useMemo(() =>
    rqs.filter(r => r.estado !== 'Pagado' && r.estado !== 'Rechazado' && alertaVencimiento(r.fechaVence))
  , [rqs])

  const totalPendiente = rqs
    .filter(r => r.estado !== 'Pagado' && r.estado !== 'Rechazado')
    .reduce((s, r) => s + (r.total || 0), 0)

  const totalPagado = rqs
    .filter(r => r.estado === 'Pagado')
    .reduce((s, r) => s + (r.total || 0), 0)

  const { isAdmin } = useAuth()

  const handleDelete = (id) => {
    setConfirmBox({
      message: '¿Eliminar este RQ?',
      onConfirm: () => {
        dispatch({ type: 'DELETE_RQ', id })
        toast('RQ eliminado')
        setConfirmBox(null)
      }
    })
  }

  const handleEdit = (rq) => { setEditing(rq); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditing(null) }

  const areas = [...new Set(rqs.map(r => r.area).filter(Boolean))]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Requerimientos de Pago (RQ)"
        subtitle="Gestión de requerimientos contables para procesamiento de pagos"
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4"/>Nuevo RQ
          </button>
        }
      />

      {/* Alertas vencimiento */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-red-700">
              {alertas.length} RQ{alertas.length > 1 ? 's' : ''} con fecha límite de pago vencida o próxima
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {alertas.map(r => `${r.numero} · ${fmtDate(r.fechaVence)}`).join(' | ')}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <BanknotesIcon className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">{rqs.length}</p>
            <p className="text-xs text-gray-500">Total RQs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">{rqs.filter(r => r.estado === 'Pendiente').length}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <BanknotesIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-orange-600">{fmtMoney(totalPendiente)}</p>
            <p className="text-xs text-gray-500">Por pagar</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{fmtMoney(totalPagado)}</p>
            <p className="text-xs text-gray-500">Pagado</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder="Buscar RQ, descripción o proveedor..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-auto" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input w-auto" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="table-th">N° RQ</th>
              <th className="table-th">Descripción</th>
              <th className="table-th">Proveedor</th>
              <th className="table-th">Área</th>
              <th className="table-th">Fecha RQ</th>
              <th className="table-th">Límite Pago</th>
              <th className="table-th text-right">Total</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Doc.</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(r => {
              const alerta = r.estado !== 'Pagado' && r.estado !== 'Rechazado' ? alertaVencimiento(r.fechaVence) : null
              const rowBg = alerta?.color === 'red' ? 'bg-red-50/30' : alerta?.color === 'orange' ? 'bg-orange-50/20' : ''
              return (
                <tr key={r.id} className={`hover:bg-gray-50/50 ${rowBg}`}>
                  <td className="table-td font-mono text-xs font-bold text-[#1e3a5f]">{r.numero}</td>
                  <td className="table-td max-w-[200px]">
                    <p className="truncate font-medium" title={r.descripcion}>{r.descripcion}</p>
                  </td>
                  <td className="table-td text-gray-600 text-xs">{r.proveedor || '—'}</td>
                  <td className="table-td text-xs">{r.area || '—'}</td>
                  <td className="table-td">{fmtDate(r.fechaRQ)}</td>
                  <td className="table-td">
                    {r.fechaVence ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-600">{fmtDate(r.fechaVence)}</p>
                        {alerta && (
                          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${alerta.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            <ExclamationTriangleIcon className="w-3 h-3"/>
                            {alerta.label}
                          </span>
                        )}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="table-td text-right font-semibold">{fmtMoney(r.total || 0)}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_STYLE[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="table-td">
                    {r.archivoPDF
                      ? <span title="Documento adjunto" className="text-green-500 text-base cursor-pointer" onClick={() => setDetail(r)}>📄</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(r)} className="text-blue-400 hover:text-blue-600 p-1 rounded">
                        <EyeIcon className="w-4 h-4"/>
                      </button>
                      {isAdmin && <>
                        <button onClick={() => handleEdit(r)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                          <PencilSquareIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1 rounded">
                          <TrashIcon className="w-4 h-4"/>
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="table-td text-center text-gray-400 py-10">
                No hay requerimientos de pago registrados
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? `Editar ${editing.numero}` : 'Nuevo Requerimiento de Pago'} onClose={handleClose} wide>
          <RQForm initial={editing} onClose={handleClose} />
        </Modal>
      )}
      {detail && (
        <Modal title={`RQ: ${detail.numero}`} onClose={() => setDetail(null)} wide>
          <RQDetail rq={detail} onClose={() => setDetail(null)} onEdit={handleEdit} />
        </Modal>
      )}
      {confirmBox && <Confirm {...confirmBox} onCancel={() => setConfirmBox(null)} />}
    </div>
  )
}
