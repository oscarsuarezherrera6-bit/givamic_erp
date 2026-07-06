/**
 * FacturacionClientes.jsx — Módulo de Facturación a Clientes
 * CRUD: N° factura, cliente, mes, tipo (Regular/Adicional), monto, estado, observación
 */
import { useState, useMemo } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import ExportMenu, { useSelection, Checkbox } from '../components/common/ExportMenu'

const TIPOS = ['Regular', 'Adicional']
const ESTADOS = ['Emitida', 'Pagada', 'Anulada']
const MESES_LABEL = {
  '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio',
  '07':'Julio','08':'Agosto','09':'Setiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'
}
function fmtMes(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return `${MESES_LABEL[m] || m} ${y}`
}
function fmtMonto(n) {
  return 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}
function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

const EMPTY_FORM = {
  numeroFactura: '', cliente: '', sedeId: '', sedeNombre: '',
  mes: currentYM(), tipo: 'Regular', monto: '', estado: 'Emitida', observacion: ''
}

const BADGE = {
  Emitida: 'bg-blue-100 text-blue-800',
  Pagada:  'bg-green-100 text-green-800',
  Anulada: 'bg-red-100 text-red-800',
}
const BADGE_TIPO = {
  Regular:   'bg-gray-100 text-gray-700',
  Adicional: 'bg-amber-100 text-amber-800',
}

// Columnas para exportación
const COLS_EXPORT = [
  { header: 'N° Factura',   key: 'numeroFactura', width: 18 },
  { header: 'Cliente',      key: 'cliente',       width: 30 },
  { header: 'Sede',         key: 'sedeNombre',    width: 22 },
  { header: 'Período',      key: r => fmtMes(r.mes), width: 16 },
  { header: 'Tipo',         key: 'tipo',          width: 12 },
  { header: 'Monto (S/)',   key: 'monto',         width: 14, total: true, totalFmt: v => `S/ ${v.toLocaleString('es-PE',{minimumFractionDigits:2})}` },
  { header: 'Estado',       key: 'estado',        width: 12 },
  { header: 'Observación',  key: 'observacion',   width: 40 },
]

export default function FacturacionClientes() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()
  const { showToast } = useToast()
  const facturas = state.facturasClientes || []
  const sedes = (state.sedes || []).filter(s => !s.esCentral)

  // ── Filtros ──
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtered = useMemo(() => {
    return facturas.filter(f => {
      if (filtroMes && f.mes !== filtroMes) return false
      if (filtroCliente && !f.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) return false
      if (filtroTipo && f.tipo !== filtroTipo) return false
      if (filtroEstado && f.estado !== filtroEstado) return false
      return true
    }).sort((a,b) => b.mes.localeCompare(a.mes) || b.numeroFactura.localeCompare(a.numeroFactura))
  }, [facturas, filtroMes, filtroCliente, filtroTipo, filtroEstado])

  const { selected, toggleOne, toggleAll, clearSelection, isSelected, allSelected, someSelected } = useSelection(filtered)

  // ── Formulario ──
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setErrors({})
    setShowForm(true)
  }
  const openEdit = (f) => {
    setForm({ ...f })
    setEditId(f.id)
    setErrors({})
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setErrors({}) }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSedeField = (sedeId) => {
    const s = sedes.find(x => x.id === sedeId)
    setForm(f => ({ ...f, sedeId, sedeNombre: s?.nombre || '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.numeroFactura.trim()) e.numeroFactura = 'Requerido'
    if (!form.cliente.trim()) e.cliente = 'Requerido'
    if (!form.mes) e.mes = 'Requerido'
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) e.monto = 'Monto inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const payload = { ...form, monto: Number(form.monto) }
    if (editId) {
      dispatch({ type: 'UPDATE_FACTURA_CLIENTE', id: editId, payload })
      showToast('Factura actualizada', 'success')
    } else {
      dispatch({ type: 'ADD_FACTURA_CLIENTE', payload })
      showToast('Factura registrada', 'success')
    }
    closeForm()
  }

  const handleDelete = (id, numero) => {
    if (!window.confirm(`¿Eliminar la factura ${numero}?`)) return
    dispatch({ type: 'DELETE_FACTURA_CLIENTE', id })
    showToast('Factura eliminada', 'info')
    clearSelection()
  }

  const handleEstado = (f, nuevoEstado) => {
    dispatch({ type: 'UPDATE_FACTURA_CLIENTE', id: f.id, payload: { estado: nuevoEstado } })
    showToast(`Factura marcada como ${nuevoEstado}`, 'success')
  }

  // Totales
  const totalFiltrado = filtered.reduce((s, f) => s + (Number(f.monto)||0), 0)
  const totalSeleccionado = filtered.filter(f => isSelected(f.id)).reduce((s, f) => s + (Number(f.monto)||0), 0)

  const filtroLabel = [filtroMes && fmtMes(filtroMes), filtroCliente, filtroTipo, filtroEstado].filter(Boolean).join(' | ')

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Facturación Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro y control de facturas emitidas a clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            modulo="FacturacionClientes"
            data={filtered}
            selected={selected}
            columns={COLS_EXPORT}
            filtroLabel={filtroLabel}
          />
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Período</label>
            <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente</label>
            <input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none bg-white">
              <option value="">Todos</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none bg-white">
              <option value="">Todos</option>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        {(filtroMes || filtroCliente || filtroTipo || filtroEstado) && (
          <button onClick={() => { setFiltroMes(''); setFiltroCliente(''); setFiltroTipo(''); setFiltroEstado('') }}
            className="mt-2 text-xs text-[#1e3a5f] hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Registros', value: filtered.length, color: 'text-[#1e3a5f]' },
          { label: 'Total filtrado', value: fmtMonto(totalFiltrado), color: 'text-emerald-700' },
          { label: 'Seleccionados', value: selected.length, color: 'text-amber-700' },
          { label: 'Monto selec.', value: selected.length > 0 ? fmtMonto(totalSeleccionado) : '—', color: 'text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-black ${color} mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="p-3 w-8">
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">N° FACTURA</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">CLIENTE</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">SEDE</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">PERÍODO</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">TIPO</th>
                <th className="text-right p-3 font-semibold text-gray-600 text-xs">MONTO</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs">ESTADO</th>
                <th className="text-left p-3 font-semibold text-gray-600 text-xs w-48">OBSERVACIÓN</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                    <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No hay facturas registradas
                  </td>
                </tr>
              )}
              {filtered.map(f => (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${isSelected(f.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <Checkbox checked={isSelected(f.id)} onChange={() => toggleOne(f.id)} />
                  </td>
                  <td className="p-3 font-mono text-xs font-semibold text-[#1e3a5f]">{f.numeroFactura}</td>
                  <td className="p-3 font-medium text-gray-800 max-w-[180px] truncate">{f.cliente}</td>
                  <td className="p-3 text-gray-600 text-xs">{f.sedeNombre || '—'}</td>
                  <td className="p-3 text-gray-600 text-xs whitespace-nowrap">{fmtMes(f.mes)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${BADGE_TIPO[f.tipo]}`}>
                      {f.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-gray-800 whitespace-nowrap">{fmtMonto(f.monto)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${BADGE[f.estado]}`}>
                      {f.estado}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate" title={f.observacion}>{f.observacion || '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {f.estado === 'Emitida' && (
                        <button onClick={() => handleEstado(f, 'Pagada')} title="Marcar como Pagada"
                          className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      {f.estado !== 'Anulada' && (
                        <button onClick={() => openEdit(f)} title="Editar"
                          className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(f.id, f.numeroFactura)} title="Eliminar"
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={6} className="p-3 text-xs font-bold text-gray-600">TOTAL ({filtered.length} registros)</td>
                  <td className="p-3 text-right font-black text-[#1e3a5f] whitespace-nowrap">{fmtMonto(totalFiltrado)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1e3a5f]">
                {editId ? 'Editar Factura' : 'Nueva Factura Cliente'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="N° Factura" error={errors.numeroFactura} required>
                  <input value={form.numeroFactura} onChange={e => setField('numeroFactura', e.target.value)}
                    placeholder="FC-001-0001"
                    className={inp(errors.numeroFactura)} />
                </F>
                <F label="Período" error={errors.mes} required>
                  <input type="month" value={form.mes} onChange={e => setField('mes', e.target.value)}
                    className={inp(errors.mes)} />
                </F>
              </div>
              <F label="Cliente" error={errors.cliente} required>
                <input value={form.cliente} onChange={e => setField('cliente', e.target.value)}
                  placeholder="Nombre del cliente o empresa"
                  className={inp(errors.cliente)} />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Sede">
                  <select value={form.sedeId} onChange={e => setSedeField(e.target.value)} className={inp()}>
                    <option value="">Sin sede específica</option>
                    {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </F>
                <F label="Tipo">
                  <select value={form.tipo} onChange={e => setField('tipo', e.target.value)} className={inp()}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Monto (S/)" error={errors.monto} required>
                  <input type="number" value={form.monto} onChange={e => setField('monto', e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    className={inp(errors.monto)} />
                </F>
                <F label="Estado">
                  <select value={form.estado} onChange={e => setField('estado', e.target.value)} className={inp()}>
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </F>
              </div>
              <F label="Observación / Variación">
                <textarea value={form.observacion} onChange={e => setField('observacion', e.target.value)}
                  rows={2} placeholder="Descripción de servicios adicionales o variaciones..."
                  className={inp() + ' resize-none'} />
              </F>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-[#1e3a5f] hover:bg-[#2a4f7a] text-white rounded-lg transition-colors shadow-sm">
                {editId ? 'Guardar cambios' : 'Registrar factura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers de formulario
function F({ label, children, error, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
function inp(err) {
  return `w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:ring-2 bg-white
    ${err ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]'}`
}
