import React from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import Modal from '../components/common/Modal'
import Confirm from '../components/common/Confirm'
import PageHeader from '../components/common/PageHeader'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

/* ── Mini-formulario reutilizable ─────────────────────────────────────────── */
function EgModal({ title, init, fields, onSave, onClose, extras }) {
  const [form, setForm] = React.useState({ ...init })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
            <input className="input" value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} required={!!f.required} />
          </div>
        ))}
        {extras && extras(form)}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="button" onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function EmpresasClientes() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()
  const toast = useToast()

  const isAdmin = user?.rol === 'Administrador' || user?.rol === 'Gerente General'

  const empresasGrupo = state.empresasGrupo || []
  const clientesRRHH  = state.clientesRRHH  || []

  const [openEg,  setOpenEg]  = React.useState({})
  const [openCli, setOpenCli] = React.useState({})

  const [mEg,        setMEg]        = React.useState(null)
  const [mCli,       setMCli]       = React.useState(null)
  const [mLoc,       setMLoc]       = React.useState(null)
  const [confirmDel, setConfirmDel] = React.useState(null)

  const toggleEg  = id => setOpenEg(p  => ({ ...p, [id]: !p[id] }))
  const toggleCli = id => setOpenCli(p => ({ ...p, [id]: !p[id] }))

  /* ─── Empresa ─── */
  const saveEg = (form) => {
    if (!form.nombre?.trim()) return
    if (mEg.mode === 'add') {
      dispatch({ type: 'ADD_EMPRESA_GRUPO', payload: { id: 'eg_' + Math.random().toString(36).slice(2, 8), clienteIds: [], activo: true, ...form } })
      toast('Empresa agregada')
    } else {
      dispatch({ type: 'UPDATE_EMPRESA_GRUPO', id: mEg.data.id, payload: form })
      toast('Empresa actualizada')
    }
    setMEg(null)
  }

  /* ─── Cliente ─── */
  const saveCli = (form) => {
    if (!form.nombre?.trim()) return
    if (mCli.mode === 'add') {
      const newId = 'cr_' + Math.random().toString(36).slice(2, 8)
      dispatch({ type: 'ADD_CLIENTE_RRHH', payload: { id: newId, locales: [], activo: true, ...form } })
      const eg = empresasGrupo.find(e => e.id === mCli.empresaId)
      if (eg) dispatch({ type: 'UPDATE_EMPRESA_GRUPO', id: eg.id, payload: { clienteIds: [...(eg.clienteIds || []), newId] } })
      toast('Cliente agregado y vinculado')
    } else {
      dispatch({ type: 'UPDATE_CLIENTE_RRHH', id: mCli.data.id, payload: form })
      toast('Cliente actualizado')
    }
    setMCli(null)
  }

  /* ─── Local ─── */
  const saveLoc = (form) => {
    if (!form.nombre?.trim()) return
    if (mLoc.mode === 'add') {
      dispatch({ type: 'ADD_LOCAL_RRHH', clienteId: mLoc.clienteId, payload: { id: 'loc_' + Math.random().toString(36).slice(2, 8), activo: true, ...form } })
      toast('Local agregado')
    } else {
      dispatch({ type: 'UPDATE_LOCAL_RRHH', clienteId: mLoc.clienteId, id: mLoc.id, payload: form })
      toast('Local actualizado')
    }
    setMLoc(null)
  }

  return (
    <div>
      <PageHeader title="Empresas y Clientes" subtitle="Estructura del grupo: empresas, clientes y locales" />

      <div className="space-y-4">
        {/* Header acción */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Haz clic en una empresa para ver sus clientes. Haz clic en un cliente para ver sus locales.
          </p>
          {isAdmin && (
            <button onClick={() => setMEg({ mode: 'add', data: {} })} className="btn-primary text-sm">
              + Nueva Empresa
            </button>
          )}
        </div>

        {empresasGrupo.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Sin empresas registradas
          </div>
        )}

        <div className="space-y-2">
          {empresasGrupo.map(eg => {
            const egClientes   = clientesRRHH.filter(c => (eg.clienteIds || []).includes(c.id))
            const totalLocales = egClientes.reduce((s, c) => s + (c.locales || []).length, 0)
            const isEgOpen     = !!openEg[eg.id]

            return (
              <div key={eg.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* ── Fila empresa ── */}
                <div
                  onClick={() => toggleEg(eg.id)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#1e3a5f] cursor-pointer select-none"
                >
                  <span className={`text-white text-xs transition-transform duration-150 ${isEgOpen ? 'rotate-90' : ''}`}>▶</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{eg.nombre}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${eg.activo !== false ? 'bg-green-400/20 text-green-200' : 'bg-gray-400/20 text-gray-300'}`}>
                        {eg.activo !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-[#8ab4d4] text-xs">
                      {eg.ruc ? `RUC: ${eg.ruc} · ` : ''}{egClientes.length} cliente(s) · {totalLocales} local(es)
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMEg({ mode: 'edit', data: eg })}
                        className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white">
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDel({ type: 'empresa', id: eg.id })}
                        className="p-1.5 rounded-lg hover:bg-red-400/20 text-white/50 hover:text-red-200">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Clientes ── */}
                {isEgOpen && (
                  <div className="bg-gray-50 divide-y divide-gray-100">
                    {egClientes.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Sin clientes vinculados</p>
                    )}

                    {egClientes.map(cli => {
                      const isCliOpen = !!openCli[cli.id]
                      const locales   = cli.locales || []
                      return (
                        <div key={cli.id}>
                          {/* Fila cliente */}
                          <div
                            onClick={() => toggleCli(cli.id)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 hover:bg-blue-100 cursor-pointer select-none transition-colors"
                          >
                            <span className={`text-blue-500 text-xs transition-transform duration-150 ${isCliOpen ? 'rotate-90' : ''}`}>▶</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-[#1e3a5f]">{cli.nombre}</span>
                              {cli.tipo && <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{cli.tipo}</span>}
                              {cli.ruc  && <span className="ml-2 text-xs text-gray-400">RUC: {cli.ruc}</span>}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 shrink-0">
                              {locales.length} local{locales.length !== 1 ? 'es' : ''}
                            </span>
                            {isAdmin && (
                              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setMCli({ mode: 'edit', empresaId: eg.id, data: cli })}
                                  className="p-1 rounded hover:bg-blue-200 text-blue-500"><PencilIcon className="w-3 h-3" /></button>
                                <button onClick={() => setConfirmDel({ type: 'cliente', id: cli.id })}
                                  className="p-1 rounded hover:bg-red-100 text-red-400"><TrashIcon className="w-3 h-3" /></button>
                              </div>
                            )}
                          </div>

                          {/* Locales del cliente */}
                          {isCliOpen && (
                            <div className="bg-white px-8 py-2 space-y-1">
                              {locales.length === 0 && (
                                <p className="text-xs text-gray-400 py-1">Sin locales registrados</p>
                              )}
                              {locales.map(loc => (
                                <div key={loc.id}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200">
                                  <span className="text-gray-400 text-sm">📍</span>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-700">{loc.nombre}</span>
                                    {loc.direccion && <span className="ml-2 text-xs text-gray-400">{loc.direccion}</span>}
                                    {loc.area && <span className="ml-1 text-xs text-gray-400">· {loc.area}</span>}
                                    {loc.piso && <span className="ml-1 text-xs text-gray-400">· {loc.piso}</span>}
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1">
                                      <button onClick={() => setMLoc({ mode: 'edit', clienteId: cli.id, id: loc.id, data: loc })}
                                        className="p-1 rounded hover:bg-blue-50 text-blue-400"><PencilIcon className="w-3 h-3" /></button>
                                      <button onClick={() => setConfirmDel({ type: 'local', clienteId: cli.id, id: loc.id })}
                                        className="p-1 rounded hover:bg-red-50 text-red-400"><TrashIcon className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {isAdmin && (
                                <button onClick={() => setMLoc({ mode: 'add', clienteId: cli.id, data: {} })}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 pt-1.5 pb-0.5">
                                  <PlusIcon className="w-3 h-3" /> Agregar local / sede
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Botón agregar cliente */}
                    {isAdmin && (
                      <div className="px-6 py-2.5">
                        <button onClick={() => setMCli({ mode: 'add', empresaId: eg.id, data: {} })}
                          className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                          <PlusIcon className="w-3 h-3" /> Agregar cliente a {eg.nombre}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal Empresa ── */}
      {mEg && (
        <EgModal title={mEg.mode === 'add' ? 'Nueva Empresa del Grupo' : 'Editar Empresa'}
          init={mEg.data} onSave={saveEg} onClose={() => setMEg(null)}
          fields={[
            { key: 'nombre',    label: 'Razón Social *', required: true },
            { key: 'ruc',       label: 'RUC' },
            { key: 'direccion', label: 'Dirección' },
          ]}
        />
      )}

      {/* ── Modal Cliente ── */}
      {mCli && (
        <EgModal title={mCli.mode === 'add' ? 'Nuevo Cliente' : 'Editar Cliente'}
          init={mCli.data} onSave={saveCli} onClose={() => setMCli(null)}
          fields={[
            { key: 'nombre',   label: 'Nombre *',                    required: true },
            { key: 'tipo',     label: 'Tipo (Colegio, Universidad…)' },
            { key: 'ruc',      label: 'RUC' },
            { key: 'contacto', label: 'Persona de contacto' },
            { key: 'telefono', label: 'Teléfono' },
          ]}
        />
      )}

      {/* ── Modal Local ── */}
      {mLoc && (
        <EgModal title={mLoc.mode === 'add' ? 'Nuevo Local / Sede' : 'Editar Local'}
          init={mLoc.data} onSave={saveLoc} onClose={() => setMLoc(null)}
          fields={[
            { key: 'nombre',    label: 'Nombre del local / sede *', required: true },
            { key: 'direccion', label: 'Dirección' },
            { key: 'piso',      label: 'Piso / Zona' },
            { key: 'area',      label: 'Área (m²)' },
          ]}
        />
      )}

      {/* ── Confirm eliminar ── */}
      {confirmDel && (
        <Confirm
          message={
            confirmDel.type === 'empresa' ? '¿Eliminar esta empresa del grupo?' :
            confirmDel.type === 'cliente' ? '¿Eliminar este cliente y todos sus locales?' :
            '¿Eliminar este local?'
          }
          danger confirmLabel="Eliminar"
          onConfirm={() => {
            if (confirmDel.type === 'empresa') dispatch({ type: 'DELETE_EMPRESA_GRUPO', id: confirmDel.id })
            else if (confirmDel.type === 'cliente') dispatch({ type: 'DELETE_CLIENTE_RRHH', id: confirmDel.id })
            else dispatch({ type: 'DELETE_LOCAL_RRHH', clienteId: confirmDel.clienteId, id: confirmDel.id })
            toast('Eliminado'); setConfirmDel(null)
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}
