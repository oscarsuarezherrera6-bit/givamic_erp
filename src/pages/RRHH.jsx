import { useState, useMemo, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { AuthContext } from '../context/AuthContext'
import jsPDF from 'jspdf'

// ── helpers ────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const todayStr = () => new Date().toISOString().slice(0,10)
const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

// ── Confirm Modal ──────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel, confirmLabel='Confirmar', danger=false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-gray-700 text-sm mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={onConfirm} className={`text-sm px-4 py-2 rounded-lg font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: EMPRESAS DEL GRUPO
// ══════════════════════════════════════════════════════════════════════════════
function TabEmpresasGrupo({ isJefeRRHH }) {
  const { state, dispatch } = useContext(AppContext)
  const empresas = state.empresasGrupo || []
  const [modal, setModal] = useState(null) // null | { mode:'add'|'edit', data }
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState({ nombre:'', ruc:'', direccion:'', activo:true })

  const openAdd = () => { setForm({ nombre:'', ruc:'', direccion:'', activo:true }); setModal({ mode:'add' }) }
  const openEdit = e => { setForm({ ...e }); setModal({ mode:'edit', id:e.id }) }

  const save = () => {
    if (!form.nombre.trim()) return
    if (modal.mode === 'add') dispatch({ type:'ADD_EMPRESA_GRUPO', payload: form })
    else dispatch({ type:'UPDATE_EMPRESA_GRUPO', id: modal.id, payload: form })
    setModal(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Empresas del Grupo</h2>
        {isJefeRRHH && <button onClick={openAdd} className="btn-primary text-sm">+ Nueva Empresa</button>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Empresa','RUC','Dirección','Estado','Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {empresas.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Sin empresas registradas</td></tr>
            )}
            {empresas.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{e.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{e.ruc}</td>
                <td className="px-4 py-3 text-gray-600">{e.direccion}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isJefeRRHH && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDel(e.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 pt-5 pb-2 border-b">
              <h3 className="font-semibold text-gray-800">{modal.mode==='add' ? 'Nueva Empresa' : 'Editar Empresa'}</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[['Razón Social*','nombre'],['RUC','ruc'],['Dirección','direccion']].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-medium">{label}</label>
                  <input className="input-field mt-1" value={form[key]} onChange={e => setForm(p => ({...p,[key]:e.target.value}))} />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="eg-activo" checked={form.activo} onChange={e => setForm(p => ({...p,activo:e.target.checked}))} />
                <label htmlFor="eg-activo" className="text-sm text-gray-600">Activo</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t">
              <button onClick={() => setModal(null)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={save} className="btn-primary text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <Confirm
          message="¿Eliminar esta empresa? Se perderán todos sus datos."
          danger
          confirmLabel="Eliminar"
          onConfirm={() => { dispatch({ type:'DELETE_EMPRESA_GRUPO', id:confirmDel }); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: CLIENTES & LOCALES
// ══════════════════════════════════════════════════════════════════════════════
function TabClientesLocales({ isJefeRRHH }) {
  const { state, dispatch } = useContext(AppContext)
  const clientes = state.clientesRRHH || []
  const [expanded, setExpanded] = useState({})
  const [modalCliente, setModalCliente] = useState(null)
  const [modalLocal, setModalLocal] = useState(null)
  const [formC, setFormC] = useState({ nombre:'', tipo:'', ruc:'', contacto:'', telefono:'', activo:true })
  const [formL, setFormL] = useState({ nombre:'', direccion:'', piso:'', area:'', activo:true })
  const [confirmDel, setConfirmDel] = useState(null)

  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const saveCliente = () => {
    if (!formC.nombre.trim()) return
    if (modalCliente.mode === 'add') dispatch({ type:'ADD_CLIENTE_RRHH', payload: { ...formC, locales:[] } })
    else dispatch({ type:'UPDATE_CLIENTE_RRHH', id:modalCliente.id, payload: formC })
    setModalCliente(null)
  }

  const saveLocal = () => {
    if (!formL.nombre.trim()) return
    if (modalLocal.mode === 'add') dispatch({ type:'ADD_LOCAL_RRHH', clienteId:modalLocal.clienteId, payload: formL })
    else dispatch({ type:'UPDATE_LOCAL_RRHH', clienteId:modalLocal.clienteId, id:modalLocal.id, payload: formL })
    setModalLocal(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Clientes y Locales</h2>
        {isJefeRRHH && (
          <button onClick={() => { setFormC({ nombre:'', tipo:'', ruc:'', contacto:'', telefono:'', activo:true }); setModalCliente({ mode:'add' }) }}
            className="btn-primary text-sm">+ Nuevo Cliente</button>
        )}
      </div>

      <div className="space-y-3">
        {clientes.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Sin clientes registrados</p>}
        {clientes.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleExpand(c.id)}>
              <span className="text-gray-400 text-xs">{expanded[c.id] ? '▼' : '▶'}</span>
              <div className="flex-1">
                <span className="font-medium text-gray-800">{c.nombre}</span>
                <span className="ml-2 text-xs text-gray-400">{c.tipo}</span>
                <span className="ml-3 text-xs text-gray-400">RUC: {c.ruc || '—'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {(c.locales||[]).length} local{(c.locales||[]).length !== 1 ? 'es' : ''}
              </span>
              {isJefeRRHH && (
                <div className="flex gap-2 ml-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setFormC({...c}); setModalCliente({ mode:'edit', id:c.id }) }} className="text-blue-600 text-xs hover:underline">Editar</button>
                  <button onClick={() => setConfirmDel({ type:'cliente', id:c.id })} className="text-red-500 text-xs hover:underline">Eliminar</button>
                </div>
              )}
            </div>

            {expanded[c.id] && (
              <div className="border-t px-4 pb-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Locales</span>
                  {isJefeRRHH && (
                    <button onClick={() => { setFormL({ nombre:'', direccion:'', piso:'', area:'', activo:true }); setModalLocal({ mode:'add', clienteId:c.id }) }}
                      className="text-blue-600 text-xs hover:underline">+ Agregar Local</button>
                  )}
                </div>
                {(c.locales||[]).length === 0 && <p className="text-gray-400 text-xs py-2">Sin locales</p>}
                <div className="space-y-1">
                  {(c.locales||[]).map(l => (
                    <div key={l.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                      <span className="text-gray-500">📍</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-700">{l.nombre}</span>
                        <span className="ml-2 text-xs text-gray-400">{l.direccion}</span>
                        {l.area && <span className="ml-2 text-xs text-gray-400">• {l.area}</span>}
                      </div>
                      {isJefeRRHH && (
                        <div className="flex gap-2">
                          <button onClick={() => { setFormL({...l}); setModalLocal({ mode:'edit', clienteId:c.id, id:l.id }) }} className="text-blue-600 text-xs hover:underline">Editar</button>
                          <button onClick={() => setConfirmDel({ type:'local', clienteId:c.id, id:l.id })} className="text-red-500 text-xs hover:underline">Eliminar</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Cliente */}
      {modalCliente && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 pt-5 pb-2 border-b">
              <h3 className="font-semibold text-gray-800">{modalCliente.mode==='add' ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[['Nombre*','nombre'],['Tipo (Colegio, Universidad…)','tipo'],['RUC','ruc'],['Contacto','contacto'],['Teléfono','telefono']].map(([label,key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-medium">{label}</label>
                  <input className="input-field mt-1" value={formC[key]||''} onChange={e => setFormC(p => ({...p,[key]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t">
              <button onClick={() => setModalCliente(null)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={saveCliente} className="btn-primary text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Local */}
      {modalLocal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 pt-5 pb-2 border-b">
              <h3 className="font-semibold text-gray-800">{modalLocal.mode==='add' ? 'Nuevo Local' : 'Editar Local'}</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[['Nombre*','nombre'],['Dirección','direccion'],['Piso / Zona','piso'],['Área / m²','area']].map(([label,key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-medium">{label}</label>
                  <input className="input-field mt-1" value={formL[key]||''} onChange={e => setFormL(p => ({...p,[key]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t">
              <button onClick={() => setModalLocal(null)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={saveLocal} className="btn-primary text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <Confirm
          message={`¿Eliminar este ${confirmDel.type === 'cliente' ? 'cliente y todos sus locales' : 'local'}?`}
          danger confirmLabel="Eliminar"
          onConfirm={() => {
            if (confirmDel.type === 'cliente') dispatch({ type:'DELETE_CLIENTE_RRHH', id:confirmDel.id })
            else dispatch({ type:'DELETE_LOCAL_RRHH', clienteId:confirmDel.clienteId, id:confirmDel.id })
            setConfirmDel(null)
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: CAMBIAR ASIGNACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function ModalAsignacion({ usuario, onClose, onSave, empresasGrupo, clientesRRHH }) {
  const [form, setForm] = useState({
    empresaGrupoId: usuario.empresaGrupoId || '',
    clienteRRHHId:  usuario.clienteRRHHId  || '',
    localRRHHId:    usuario.localRRHHId    || '',
    fechaInicio:    todayStr(),
    esTemporal:     false,
    fechaFinPrevista: '',
    motivo: '',
  })

  const clientesFiltrados = clientesRRHH.filter(c => c.activo)
  const localesFiltrados  = (clientesFiltrados.find(c => c.id === form.clienteRRHHId)?.locales || []).filter(l => l.activo)

  const save = () => {
    if (!form.empresaGrupoId || !form.clienteRRHHId || !form.localRRHHId) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-5 pb-2 border-b">
          <h3 className="font-semibold text-gray-800">Cambiar Asignación — {usuario.nombre}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Empresa del Grupo*</label>
            <select className="input-field mt-1" value={form.empresaGrupoId}
              onChange={e => setForm(p => ({...p, empresaGrupoId:e.target.value}))}>
              <option value="">— Seleccionar —</option>
              {empresasGrupo.filter(e => e.activo).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Cliente*</label>
            <select className="input-field mt-1" value={form.clienteRRHHId}
              onChange={e => setForm(p => ({...p, clienteRRHHId:e.target.value, localRRHHId:''}))}>
              <option value="">— Seleccionar —</option>
              {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {form.clienteRRHHId && (
            <div>
              <label className="text-xs text-gray-500 font-medium">Local*</label>
              <select className="input-field mt-1" value={form.localRRHHId}
                onChange={e => setForm(p => ({...p, localRRHHId:e.target.value}))}>
                <option value="">— Seleccionar local —</option>
                {localesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.direccion}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 font-medium">Fecha de Inicio*</label>
            <input type="date" className="input-field mt-1" value={form.fechaInicio}
              onChange={e => setForm(p => ({...p, fechaInicio:e.target.value}))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="temporal" checked={form.esTemporal}
              onChange={e => setForm(p => ({...p, esTemporal:e.target.checked, fechaFinPrevista:''}))} />
            <label htmlFor="temporal" className="text-sm text-gray-600">Rotación temporal</label>
          </div>
          {form.esTemporal && (
            <div>
              <label className="text-xs text-gray-500 font-medium">Fecha fin prevista</label>
              <input type="date" className="input-field mt-1" value={form.fechaFinPrevista}
                onChange={e => setForm(p => ({...p, fechaFinPrevista:e.target.value}))} />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 font-medium">Motivo / Observación</label>
            <textarea className="input-field mt-1" rows={2} value={form.motivo}
              onChange={e => setForm(p => ({...p, motivo:e.target.value}))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={save} className="btn-primary text-sm">Guardar Asignación</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FICHA DEL TRABAJADOR
// ══════════════════════════════════════════════════════════════════════════════
function FichaTrabajador({ usuario, onBack, isJefeRRHH }) {
  const { state, dispatch } = useContext(AppContext)
  const { user } = useContext(AuthContext)
  const [showAsignacion, setShowAsignacion] = useState(false)
  const [confirmRetorno, setConfirmRetorno] = useState(null)

  const empresasGrupo  = state.empresasGrupo  || []
  const clientesRRHH   = state.clientesRRHH   || []
  const historial      = (state.historialAsignaciones || []).filter(h => h.usuarioId === usuario.id)
    .sort((a,b) => b.fecha.localeCompare(a.fecha))

  const empresa = empresasGrupo.find(e => e.id === usuario.empresaGrupoId)
  const cliente = clientesRRHH.find(c => c.id === usuario.clienteRRHHId)
  const local   = (cliente?.locales||[]).find(l => l.id === usuario.localRRHHId)

  const nombreEmpresa  = h => empresasGrupo.find(e => e.id === h.empresaGrupoIdNuevo)?.nombre || h.empresaGrupoIdNuevo || '—'
  const nombreCliente  = h => clientesRRHH.find(c => c.id === h.clienteRRHHIdNuevo)?.nombre || h.clienteRRHHIdNuevo || '—'
  const nombreLocal    = h => {
    const c = clientesRRHH.find(c => c.id === h.clienteRRHHIdNuevo)
    return (c?.locales||[]).find(l => l.id === h.localRRHHIdNuevo)?.nombre || h.localRRHHIdNuevo || '—'
  }

  const handleGuardarAsignacion = form => {
    dispatch({
      type: 'CAMBIAR_ASIGNACION',
      usuarioId: usuario.id,
      ...form,
      registradoPor: user?.email || '',
    })
    setShowAsignacion(false)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.setFont('helvetica','bold')
    doc.text('FICHA DE TRABAJADOR — RRHH', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica','normal')
    const lines = [
      `Nombre: ${usuario.nombre}`,
      `Email: ${usuario.email}`,
      `Cargo: ${usuario.cargo || '—'}`,
      `Área: ${usuario.area || '—'}`,
      `Rol ERP: ${usuario.rol}`,
      '',
      'ASIGNACIÓN ACTUAL',
      `Empresa: ${empresa?.nombre || '—'}`,
      `Cliente: ${cliente?.nombre || '—'}`,
      `Local: ${local?.nombre || '—'}`,
      `Desde: ${fmtDate(usuario.fechaInicioAsignacion)}`,
      usuario.esTemporal ? `Temporal hasta: ${fmtDate(usuario.fechaFinPrevista)}` : '',
      '',
      'HISTORIAL DE ASIGNACIONES',
      ...historial.map((h,i) => `${i+1}. ${fmtDate(h.fecha)} → ${nombreCliente(h)} / ${nombreLocal(h)}${h.esTemporal?' [TEMPORAL]':''}${h.retornoConfirmado?' [Retorno confirmado]':''}`),
    ].filter(l => l !== undefined)

    let y = 32
    lines.forEach(l => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(l, 14, y)
      y += 6
    })
    doc.save(`ficha-${usuario.nombre.replace(/ /g,'_')}.pdf`)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
        ← Volver a Trabajadores
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{usuario.nombre}</h2>
            <p className="text-sm text-gray-500">{usuario.cargo || '—'} · {usuario.area || '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{usuario.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPDF} className="btn-secondary text-sm">⬇ PDF</button>
            {isJefeRRHH && (
              <button onClick={() => setShowAsignacion(true)} className="btn-primary text-sm">Cambiar Asignación</button>
            )}
          </div>
        </div>

        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Asignación Actual</h3>
          {!usuario.empresaGrupoId ? (
            <p className="text-gray-400 text-sm">Sin asignación registrada</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Empresa del Grupo</p>
                <p className="font-medium text-gray-700">{empresa?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cliente</p>
                <p className="font-medium text-gray-700">{cliente?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Local</p>
                <p className="font-medium text-gray-700">{local?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Desde</p>
                <p className="font-medium text-gray-700">{fmtDate(usuario.fechaInicioAsignacion)}</p>
              </div>
              {usuario.esTemporal && (
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⏱ Rotación temporal — hasta {fmtDate(usuario.fechaFinPrevista)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historial timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Historial de Asignaciones</h3>
        {historial.length === 0 && <p className="text-gray-400 text-sm">Sin movimientos registrados</p>}
        <div className="relative">
          {historial.map((h, i) => (
            <div key={h.id} className="flex gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${h.esTemporal ? 'bg-yellow-400' : 'bg-blue-500'}`} />
                {i < historial.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">{fmtDate(h.fecha)}</span>
                  {h.esTemporal && <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">Temporal</span>}
                  {h.retornoConfirmado && <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Retorno confirmado</span>}
                </div>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {nombreCliente(h)} / {nombreLocal(h)}
                </p>
                <p className="text-xs text-gray-400">{nombreEmpresa(h)}</p>
                {h.motivo && <p className="text-xs text-gray-500 mt-0.5 italic">"{h.motivo}"</p>}
                {h.fechaFinPrevista && !h.retornoConfirmado && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-yellow-600">Fin previsto: {fmtDate(h.fechaFinPrevista)}</span>
                    {isJefeRRHH && (
                      <button onClick={() => setConfirmRetorno(h.id)}
                        className="text-xs text-blue-600 hover:underline">Confirmar retorno</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAsignacion && (
        <ModalAsignacion
          usuario={usuario}
          empresasGrupo={empresasGrupo}
          clientesRRHH={clientesRRHH}
          onClose={() => setShowAsignacion(false)}
          onSave={handleGuardarAsignacion}
        />
      )}

      {confirmRetorno && (
        <Confirm
          message="¿Confirmar el retorno del trabajador a su asignación anterior?"
          confirmLabel="Confirmar Retorno"
          onConfirm={() => {
            dispatch({ type:'CONFIRMAR_RETORNO', historialId:confirmRetorno, registradoPor:user?.email||'' })
            setConfirmRetorno(null)
          }}
          onCancel={() => setConfirmRetorno(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: TRABAJADORES
// ══════════════════════════════════════════════════════════════════════════════
function TabTrabajadores({ isJefeRRHH }) {
  const { state } = useContext(AppContext)
  const [ficha, setFicha] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  const trabajadores = (state.usuarios || []).filter(u => u.activo)
  const empresasGrupo = state.empresasGrupo || []
  const clientesRRHH  = state.clientesRRHH  || []

  const filtrados = useMemo(() => {
    return trabajadores.filter(u => {
      const q = search.toLowerCase()
      const matchQ = !q || u.nombre.toLowerCase().includes(q) || (u.cargo||'').toLowerCase().includes(q) || (u.area||'').toLowerCase().includes(q)
      const matchE = !filtroEmpresa || u.empresaGrupoId === filtroEmpresa
      const matchC = !filtroCliente || u.clienteRRHHId === filtroCliente
      return matchQ && matchE && matchC
    })
  }, [trabajadores, search, filtroEmpresa, filtroCliente])

  const nombreCliente = u => clientesRRHH.find(c => c.id === u.clienteRRHHId)?.nombre || '—'
  const nombreLocal   = u => {
    const c = clientesRRHH.find(c => c.id === u.clienteRRHHId)
    return (c?.locales||[]).find(l => l.id === u.localRRHHId)?.nombre || '—'
  }

  // Updated usuario from state (in case dispatch changed it)
  const getUpdated = u => (state.usuarios||[]).find(x => x.id === u.id) || u

  if (ficha) {
    const updated = getUpdated(ficha)
    return <FichaTrabajador usuario={updated} onBack={() => setFicha(null)} isJefeRRHH={isJefeRRHH} />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Trabajadores</h2>

      <div className="flex flex-wrap gap-3">
        <input className="input-field flex-1 min-w-[180px]" placeholder="Buscar por nombre, cargo, área…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
          <option value="">Todas las empresas</option>
          {empresasGrupo.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <select className="input-field" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clientesRRHH.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Trabajador','Cargo / Área','Empresa','Cliente / Local','Desde','Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin trabajadores que coincidan</td></tr>
              )}
              {filtrados.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setFicha(u)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{u.nombre}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{u.cargo || '—'}</div>
                    <div className="text-xs text-gray-400">{u.area || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {empresasGrupo.find(e => e.id === u.empresaGrupoId)?.nombre || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{nombreCliente(u)}</div>
                    <div className="text-xs text-gray-400">{u.clienteRRHHId ? nombreLocal(u) : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(u.fechaInicioAsignacion)}</td>
                  <td className="px-4 py-3">
                    {u.esTemporal
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Temporal</span>
                      : u.empresaGrupoId
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Asignado</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Sin asignación</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ROTACIONES / HISTORIAL MASIVO
// ══════════════════════════════════════════════════════════════════════════════
function TabRotaciones({ isJefeRRHH }) {
  const { state, dispatch } = useContext(AppContext)
  const { user } = useContext(AuthContext)
  const historial     = [...(state.historialAsignaciones || [])].sort((a,b) => b.fecha.localeCompare(a.fecha))
  const usuarios      = state.usuarios || []
  const empresasGrupo = state.empresasGrupo || []
  const clientesRRHH  = state.clientesRRHH  || []
  const [confirmRetorno, setConfirmRetorno] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos') // todos | temporal | permanente | pendiente

  const nombre    = id => usuarios.find(u => u.id === id)?.nombre || id
  const empresa   = id => empresasGrupo.find(e => e.id === id)?.nombre || '—'
  const cliente   = id => clientesRRHH.find(c => c.id === id)?.nombre || '—'
  const localNm   = (cid, lid) => (clientesRRHH.find(c => c.id === cid)?.locales||[]).find(l => l.id === lid)?.nombre || '—'

  const filtrado = useMemo(() => historial.filter(h => {
    if (filtroTipo === 'temporal')   return h.esTemporal && !h.retornoConfirmado
    if (filtroTipo === 'permanente') return !h.esTemporal
    if (filtroTipo === 'pendiente')  return h.esTemporal && !h.retornoConfirmado && h.fechaFinPrevista && h.fechaFinPrevista < todayStr()
    return true
  }), [historial, filtroTipo])

  const vencidas = historial.filter(h => h.esTemporal && !h.retornoConfirmado && h.fechaFinPrevista && h.fechaFinPrevista < todayStr())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Rotaciones e Historial</h2>
        {vencidas.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            ⚠ {vencidas.length} rotación{vencidas.length > 1 ? 'es' : ''} temporal vencida{vencidas.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['todos','Todos'],['temporal','Temporales activas'],['permanente','Permanentes'],['pendiente','Vencidas sin retorno']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtroTipo===v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Fecha','Trabajador','Destino','Tipo','Motivo','Estado','Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrado.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin registros</td></tr>
              )}
              {filtrado.map(h => {
                const vencida = h.esTemporal && !h.retornoConfirmado && h.fechaFinPrevista && h.fechaFinPrevista < todayStr()
                return (
                  <tr key={h.id} className={`hover:bg-gray-50 ${vencida ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(h.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{nombre(h.usuarioId)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{cliente(h.clienteRRHHIdNuevo)}</div>
                      <div className="text-xs text-gray-400">{localNm(h.clienteRRHHIdNuevo, h.localRRHHIdNuevo)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {h.esTemporal
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Temporal</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Permanente</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{h.motivo || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {h.retornoConfirmado
                        ? <span className="text-green-600">✓ Retornado {fmtDate(h.fechaRetorno)}</span>
                        : vencida
                          ? <span className="text-red-600 font-medium">Vencida {fmtDate(h.fechaFinPrevista)}</span>
                          : h.fechaFinPrevista
                            ? <span className="text-yellow-600">Hasta {fmtDate(h.fechaFinPrevista)}</span>
                            : <span className="text-gray-400">Vigente</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {isJefeRRHH && h.esTemporal && !h.retornoConfirmado && (
                        <button onClick={() => setConfirmRetorno(h.id)} className="text-blue-600 text-xs hover:underline">Confirmar retorno</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmRetorno && (
        <Confirm
          message="¿Confirmar el retorno del trabajador a su asignación anterior?"
          confirmLabel="Confirmar Retorno"
          onConfirm={() => {
            dispatch({ type:'CONFIRMAR_RETORNO', historialId:confirmRetorno, registradoPor:user?.email||'' })
            setConfirmRetorno(null)
          }}
          onCancel={() => setConfirmRetorno(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD RRHH
// ══════════════════════════════════════════════════════════════════════════════
function TabDashboard() {
  const { state } = useContext(AppContext)
  const usuarios      = (state.usuarios || []).filter(u => u.activo)
  const historial     = state.historialAsignaciones || []
  const empresasGrupo = state.empresasGrupo || []
  const clientesRRHH  = state.clientesRRHH  || []

  const asignados     = usuarios.filter(u => u.empresaGrupoId)
  const temporales    = usuarios.filter(u => u.esTemporal)
  const sinAsignar    = usuarios.filter(u => !u.empresaGrupoId)
  const vencidas      = historial.filter(h => h.esTemporal && !h.retornoConfirmado && h.fechaFinPrevista && h.fechaFinPrevista < todayStr())

  // Distribución por empresa
  const porEmpresa = empresasGrupo.map(e => ({
    nombre: e.nombre,
    count: usuarios.filter(u => u.empresaGrupoId === e.id).length
  })).filter(e => e.count > 0).sort((a,b) => b.count - a.count)

  // Distribución por cliente
  const porCliente = clientesRRHH.map(c => ({
    nombre: c.nombre,
    count: usuarios.filter(u => u.clienteRRHHId === c.id).length
  })).filter(c => c.count > 0).sort((a,b) => b.count - a.count)

  const widgets = [
    { label:'Total Trabajadores', value:usuarios.length, color:'blue' },
    { label:'Asignados',          value:asignados.length, color:'green' },
    { label:'Rotaciones Temp.',   value:temporales.length, color:'yellow' },
    { label:'Sin Asignación',     value:sinAsignar.length, color:'gray' },
  ]
  const colorMap = { blue:'bg-blue-50 text-blue-700 border-blue-100', green:'bg-green-50 text-green-700 border-green-100', yellow:'bg-yellow-50 text-yellow-700 border-yellow-100', gray:'bg-gray-50 text-gray-600 border-gray-100' }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Dashboard RRHH</h2>

      {vencidas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">{vencidas.length} rotación{vencidas.length>1?'es':''} temporal vencida{vencidas.length>1?'s':''}</p>
            <p className="text-xs text-red-500">Revisar la pestaña Rotaciones e Historial para confirmar retornos</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {widgets.map(w => (
          <div key={w.label} className={`rounded-xl border p-4 ${colorMap[w.color]}`}>
            <p className="text-3xl font-bold">{w.value}</p>
            <p className="text-xs font-medium mt-1 opacity-80">{w.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Personal por Empresa del Grupo</h3>
          {porEmpresa.length === 0 ? <p className="text-gray-400 text-sm">Sin datos</p> : (
            <div className="space-y-2">
              {porEmpresa.map(e => {
                const pct = Math.round((e.count / asignados.length) * 100) || 0
                return (
                  <div key={e.nombre}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-gray-700 truncate pr-2">{e.nombre}</span>
                      <span className="text-gray-500 flex-shrink-0">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Personal por Cliente</h3>
          {porCliente.length === 0 ? <p className="text-gray-400 text-sm">Sin datos</p> : (
            <div className="space-y-2">
              {porCliente.map(c => {
                const pct = Math.round((c.count / asignados.length) * 100) || 0
                return (
                  <div key={c.nombre}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-gray-700 truncate pr-2">{c.nombre}</span>
                      <span className="text-gray-500 flex-shrink-0">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Últimos Movimientos</h3>
        {historial.length === 0 ? <p className="text-gray-400 text-sm">Sin movimientos</p> : (
          <div className="space-y-1.5">
            {[...historial].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0,5).map(h => {
              const trab = (state.usuarios||[]).find(u => u.id === h.usuarioId)?.nombre || h.usuarioId
              const cli  = clientesRRHH.find(c => c.id === h.clienteRRHHIdNuevo)?.nombre || '—'
              return (
                <div key={h.id} className="flex items-center gap-3 text-sm py-1">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{fmtDate(h.fecha)}</span>
                  <span className="font-medium text-gray-700 flex-1">{trab}</span>
                  <span className="text-gray-500 text-xs flex-1">{cli}</span>
                  {h.esTemporal && <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">Temp</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL RRHH
// ══════════════════════════════════════════════════════════════════════════════
export default function RRHH() {
  const { user } = useContext(AuthContext)
  const isJefeRRHH = user?.rol === 'Jefe RRHH' || user?.rol === 'Administrador'

  const TABS = [
    { id:'dashboard',   label:'Dashboard' },
    { id:'trabajadores',label:'Trabajadores' },
    { id:'empresas',    label:'Maestro Empresas' },
    { id:'clientes',    label:'Clientes & Locales' },
    { id:'rotaciones',  label:'Rotaciones / Historial' },
  ]

  const [tab, setTab] = useState('dashboard')

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Recursos Humanos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de empresas, clientes, locales y asignación de personal</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard'    && <TabDashboard />}
      {tab === 'trabajadores' && <TabTrabajadores isJefeRRHH={isJefeRRHH} />}
      {tab === 'empresas'     && <TabEmpresasGrupo isJefeRRHH={isJefeRRHH} />}
      {tab === 'clientes'     && <TabClientesLocales isJefeRRHH={isJefeRRHH} />}
      {tab === 'rotaciones'   && <TabRotaciones isJefeRRHH={isJefeRRHH} />}
    </div>
  )
}
