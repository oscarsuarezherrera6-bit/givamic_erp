import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import { fmtDate, fmtMoney, genId, todayISO } from '../utils/helpers'
import PageHeader from '../components/common/PageHeader'
import Confirm from '../components/common/Confirm'
import {
  PlusIcon, DocumentArrowDownIcon, TrashIcon,
  EyeIcon, ArrowLeftIcon, TrophyIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import { generarPDFCotizacion } from '../utils/pdfCotizacion'

/* ─── constantes ─────────────────────────────────────────── */

const PESOS_DEFAULT = {
  precio: 0.70, sst: 0.00, espTecnica: 0.15,
  formaPago: 0.05, plazoEntrega: 0.05, condicion: 0.05
}

const CRITERIOS = [
  { n: '01', label: 'Precio',                          key: 'pPrecio',  peso: 'precio' },
  { n: '02', label: 'Cumplimiento SST / MA',           key: 'pSST',     peso: 'sst' },
  { n: '03', label: 'Cumplimiento Esp. Técnicas',      key: 'pEsp',     peso: 'espTecnica' },
  { n: '04', label: 'Forma de Pago / Crédito',         key: 'pPago',    peso: 'formaPago' },
  { n: '05', label: 'Plazo de Entrega',                key: 'pPlazo',   peso: 'plazoEntrega' },
  { n: '06', label: 'Condición del Proveedor',         key: 'pCond',    peso: 'condicion' },
]

const PROV_COLORS  = ['border-blue-300 bg-blue-50',   'border-green-300 bg-green-50',   'border-amber-300 bg-amber-50']
const PROV_HEADERS = ['bg-blue-600 text-white',        'bg-green-600 text-white',         'bg-amber-500 text-white']

function mkProv(n) {
  return {
    alias: `PROV. ${n}`, razonSocial: '', ruc: '',
    condicion: 'NUEVO', formaPago: 'CONTADO',
    diasCredito: 0, plazoEntrega: 0, vigencia: 0,
    cumpleEsp: 'Si', cumpleSST: 'Si',
    pdfFile: null, pdfNombre: ''
  }
}
function mkItem(n = 3) {
  return { id: genId(), descripcion: '', und: 'UND', cant: 1, precios: Array(n).fill(0), obs: '' }
}

const JUSTIF_OPTIONS = [
  'Proveedor exclusivo / homologado',
  'Monto menor al límite de comparación',
  'Urgencia operativa',
  'Proveedor fijo por contrato',
  'Otro',
]

/* ─── cálculo ────────────────────────────────────────────── */

function calcScore(provs, items, pesos) {
  const totales = provs.map((_, pi) =>
    items.reduce((s, it) => s + Number(it.precios[pi] || 0) * Number(it.cant || 0), 0)
  )
  const valid = totales.filter(t => t > 0)
  const minT  = valid.length ? Math.min(...valid) : 0

  const pPrecio = totales.map(t => (t > 0 && minT > 0) ? (minT / t) * 100 : 0)
  const pSST    = provs.map(p => p.cumpleSST === 'Si' ? 100 : 0)
  const pEsp    = provs.map(p => p.cumpleEsp === 'Si' ? 100 : 0)
  const pPago   = provs.map(p => p.formaPago === 'Crédito' ? 100 : 0)

  const plazos  = provs.map(p => Number(p.plazoEntrega || 0))
  const minP    = Math.min(...plazos.filter(p => p > 0).concat(Infinity))
  const pPlazo  = plazos.map(p => (p > 0 && isFinite(minP)) ? (minP / p) * 100 : 0)

  const pCond   = provs.map(p => p.condicion === 'HABITUAL' ? 100 : 0)

  const resultados = provs.map((_, i) =>
    pPrecio[i] * pesos.precio  +
    pSST[i]    * pesos.sst     +
    pEsp[i]    * pesos.espTecnica +
    pPago[i]   * pesos.formaPago  +
    pPlazo[i]  * pesos.plazoEntrega +
    pCond[i]   * pesos.condicion
  )

  const maxR       = Math.max(...resultados)
  const ganadorIdx = resultados.findIndex(r => r === maxR)

  return { totales, minT, pPrecio, pSST, pEsp, pPago, pPlazo, pCond, resultados, ganadorIdx }
}

/* ─── formulario ─────────────────────────────────────────── */

function CotizacionForm({ initial, onSave, onCancel }) {
  const { state } = useApp()

  const [form, setForm] = useState(() => initial ? { ...initial } : {
    modo: 'comparativa',   // 'comparativa' | 'unica'
    justificacion: '',
    solicitante: '', cargoResponsable: '', proyectoServicio: '',
    fechaSolicitud: todayISO(), fechaEvaluacion: todayISO(),
    nEvaluacion: '001', tipo: 'Bien',
    requisitoSST: 'No', requisitoMA: 'No',
    proveedores: [mkProv(1), mkProv(2), mkProv(3)],
    items: [mkItem(3)],
    pesos: { ...PESOS_DEFAULT },
    comentarios: '',
    aprobaciones: [
      { responsable: 'ELABORADO POR:',          cargo: 'Cord. Logística y Compras',  nombre: '', fecha: '' },
      { responsable: 'REVISADO Y APROBADO POR:', cargo: 'Administración',             nombre: '', fecha: '' },
      { responsable: 'REVISADO Y APROBADO POR:', cargo: 'Gerencia Administrativa',    nombre: '', fecha: '' },
    ]
  })

  const sf  = (k, v)     => setForm(p => ({ ...p, [k]: v }))
  const sp  = (i, k, v)  => setForm(p => ({ ...p, proveedores: p.proveedores.map((pr, j) => j === i ? { ...pr, [k]: v } : pr) }))

  const isUnica = form.modo === 'unica'
  const nProvs  = isUnica ? 1 : 3

  const handleModo = (modo) => {
    const n = modo === 'unica' ? 1 : 3
    setForm(p => ({
      ...p, modo,
      proveedores: modo === 'unica'
        ? [p.proveedores[0]]
        : p.proveedores.length < 3
          ? [p.proveedores[0], mkProv(2), mkProv(3)]
          : p.proveedores,
      items: p.items.map(it => ({
        ...it,
        precios: Array.from({ length: n }, (_, i) => Number(it.precios?.[i] ?? 0)),
      })),
    }))
  }

  const handlePDFProv = (i, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      sp(i, 'pdfFile', e.target.result)
      sp(i, 'pdfNombre', file.name)
    }
    reader.readAsDataURL(file)
  }
  const sit = (i, k, v)  => setForm(p => ({ ...p, items: p.items.map((it, j) => j === i ? { ...it, [k]: v } : it) }))
  const sip = (i, pi, v) => setForm(p => ({
    ...p,
    items: p.items.map((it, j) => {
      if (j !== i) return it
      const precios = [...it.precios]; precios[pi] = Number(v) || 0
      return { ...it, precios }
    })
  }))
  const sa    = (i, k, v)  => setForm(p => ({ ...p, aprobaciones: p.aprobaciones.map((a, j) => j === i ? { ...a, [k]: v } : a) }))
  const score = useMemo(() => calcScore(form.proveedores, form.items, form.pesos), [form.proveedores, form.items, form.pesos])

  const llenaProv = (i, provId) => {
    const p = state.proveedores.find(x => x.id === provId)
    if (!p) return
    sp(i, 'razonSocial', p.nombre)
    sp(i, 'ruc', p.ruc || '')
    sp(i, 'alias', p.nombre.split(' ')[0].toUpperCase())
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Cotización — SIG-FO-107"
        subtitle={isUnica ? 'Cotización Única — Proveedor Directo' : 'Cuadro Comparativo de Cotizaciones'}
        action={
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-secondary flex items-center gap-2">
              <ArrowLeftIcon className="w-4 h-4"/>Cancelar
            </button>
            <button onClick={() => onSave(form, score)} className="btn-primary flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4"/>Guardar
            </button>
          </div>
        }
      />

      {/* ── 0. Modalidad ───────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-2">Modalidad</span>
        {[
          { id: 'comparativa', label: 'Comparativa', sub: '3 proveedores + puntaje SIG-FO-107' },
          { id: 'unica',       label: 'Cotización Única', sub: 'Proveedor fijo / sin comparación' },
        ].map(opt => (
          <button key={opt.id} onClick={() => handleModo(opt.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
              form.modo === opt.id
                ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              form.modo === opt.id ? 'border-[#1e3a5f]' : 'border-gray-300'}`}>
              {form.modo === opt.id && <div className="w-2 h-2 rounded-full bg-[#1e3a5f]"/>}
            </div>
            <div>
              <p className={`text-sm font-bold ${form.modo === opt.id ? 'text-[#1e3a5f]' : 'text-gray-600'}`}>{opt.label}</p>
              <p className="text-[10px] text-gray-400">{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── 1. Datos generales ─────────────────────────────── */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Datos Generales</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { k:'solicitante',       l:'Solicitante' },
            { k:'cargoResponsable',  l:'Cargo del Responsable' },
            { k:'proyectoServicio',  l:'Proyecto / Servicio' },
          ].map(({k,l}) => (
            <div key={k}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{l}</label>
              <input className="input" value={form[k]} onChange={e => sf(k, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fecha de Solicitud</label>
            <input className="input" type="date" value={form.fechaSolicitud} onChange={e => sf('fechaSolicitud', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fecha de Evaluación</label>
            <input className="input" type="date" value={form.fechaEvaluacion} onChange={e => sf('fechaEvaluacion', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">N° de Evaluación</label>
            <input className="input" value={form.nEvaluacion} onChange={e => sf('nEvaluacion', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
            <select className="input" value={form.tipo} onChange={e => sf('tipo', e.target.value)}>
              <option>Bien</option><option>Servicio</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">¿Requisitos SST?</label>
            <select className="input" value={form.requisitoSST} onChange={e => sf('requisitoSST', e.target.value)}>
              <option>No</option><option>Sí</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">¿Requisitos MA?</label>
            <select className="input" value={form.requisitoMA} onChange={e => sf('requisitoMA', e.target.value)}>
              <option>No</option><option>Sí</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. Proveedores ─────────────────────────────────── */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">
          {isUnica ? 'Datos del Proveedor' : 'Datos de Proveedores'}
        </h2>
        <div className={`gap-4 ${isUnica ? 'max-w-md' : 'grid grid-cols-3'}`}>
          {form.proveedores.map((prov, i) => (
            <div key={i} className={`border-2 rounded-xl p-4 ${PROV_COLORS[i]}`}>
              {!isUnica && (
                <div className={`text-xs font-bold px-3 py-1 rounded-lg mb-3 text-center ${PROV_HEADERS[i]}`}>
                  PROVEEDOR {i + 1}
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Alias (nombre corto) *</label>
                  <input className="input text-xs" value={prov.alias} onChange={e => sp(i,'alias',e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Buscar en Maestros</label>
                  <select className="input text-xs" onChange={e => llenaProv(i, e.target.value)} defaultValue="">
                    <option value="">— seleccionar —</option>
                    {state.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Razón Social</label>
                  <input className="input text-xs" value={prov.razonSocial} onChange={e => sp(i,'razonSocial',e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">RUC</label>
                  <input className="input text-xs" value={prov.ruc} onChange={e => sp(i,'ruc',e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Condición</label>
                    <select className="input text-xs" value={prov.condicion} onChange={e => sp(i,'condicion',e.target.value)}>
                      <option>NUEVO</option><option>HABITUAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Forma de Pago</label>
                    <select className="input text-xs" value={prov.formaPago} onChange={e => sp(i,'formaPago',e.target.value)}>
                      <option>CONTADO</option>
                      <option value="Crédito">CRÉDITO</option>
                      <option value="% Adelanto">% ADELANTO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Días crédito</label>
                    <input className="input text-xs" type="number" min="0" value={prov.diasCredito} onChange={e => sp(i,'diasCredito',e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Plazo entrega (d)</label>
                    <input className="input text-xs" type="number" min="0" value={prov.plazoEntrega} onChange={e => sp(i,'plazoEntrega',e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Vigencia cot. (d)</label>
                    <input className="input text-xs" type="number" min="0" value={prov.vigencia} onChange={e => sp(i,'vigencia',e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200 mt-1">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Cumple Esp. Téc.</label>
                    <select className="input text-xs" value={prov.cumpleEsp} onChange={e => sp(i,'cumpleEsp',e.target.value)}>
                      <option value="Si">Sí</option><option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Cumple SST/MA</label>
                    <select className="input text-xs" value={prov.cumpleSST} onChange={e => sp(i,'cumpleSST',e.target.value)}>
                      <option value="Si">Sí</option><option value="No">No</option>
                    </select>
                  </div>
                </div>
                {/* PDF de cotización del proveedor */}
                <div className="pt-2 border-t border-gray-200 mt-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Cotización PDF</label>
                  {prov.pdfFile ? (
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <DocumentArrowDownIcon className="w-4 h-4 text-red-500 flex-shrink-0"/>
                      <span className="text-xs text-gray-700 truncate flex-1">{prov.pdfNombre}</span>
                      <a href={prov.pdfFile} download={prov.pdfNombre}
                        className="text-xs text-blue-600 hover:underline flex-shrink-0">Ver</a>
                      <button type="button" onClick={() => { sp(i,'pdfFile',null); sp(i,'pdfNombre','') }}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-3 py-2 transition-colors">
                      <PlusIcon className="w-4 h-4 text-gray-400"/>
                      <span className="text-xs text-gray-500">Cargar PDF del proveedor</span>
                      <input type="file" accept=".pdf" className="hidden"
                        onChange={e => handlePDFProv(i, e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Ítems ───────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide">
            {isUnica ? 'Ítems / Descripción' : 'Comparación Económica — Ítems'}
          </h2>
          <button onClick={() => setForm(p => ({ ...p, items: [...p.items, mkItem(nProvs)] }))}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <PlusIcon className="w-3.5 h-3.5"/>Agregar ítem
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-2 py-2 text-left w-6">#</th>
                <th className="px-2 py-2 text-left min-w-[180px]">Ítem / Descripción</th>
                <th className="px-2 py-2 text-center w-14">UND</th>
                <th className="px-2 py-2 text-right w-16">CANT.</th>
                {form.proveedores.map((p, i) => (
                  <th key={i} className="px-2 py-2 text-right min-w-[80px]">{p.alias} P.Unit.</th>
                ))}
                {form.proveedores.map((p, i) => (
                  <th key={`t${i}`} className="px-2 py-2 text-right min-w-[80px]">Total {p.alias}</th>
                ))}
                <th className="w-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {form.items.map((it, ii) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 text-gray-400 text-center">{ii + 1}</td>
                  <td className="px-2 py-1">
                    <input className="input text-xs py-0.5 w-full" value={it.descripcion}
                      onChange={e => sit(ii,'descripcion',e.target.value)} placeholder="Descripción" />
                  </td>
                  <td className="px-2 py-1">
                    <input className="input text-xs py-0.5 w-12 text-center" value={it.und}
                      onChange={e => sit(ii,'und',e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="input text-xs py-0.5 w-16 text-right" type="number" min="0" step="any"
                      value={it.cant} onChange={e => sit(ii,'cant',e.target.value)} />
                  </td>
                  {form.proveedores.map((_, pi) => (
                    <td key={pi} className="px-2 py-1">
                      <input className="input text-xs py-0.5 w-20 text-right" type="number" min="0" step="0.01"
                        value={it.precios[pi] || 0} onChange={e => sip(ii, pi, e.target.value)} />
                    </td>
                  ))}
                  {form.proveedores.map((_, pi) => (
                    <td key={`t${pi}`} className="px-2 py-1 text-right font-medium text-gray-700">
                      {fmtMoney(Number(it.precios[pi]||0) * Number(it.cant||0))}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center">
                    {form.items.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, items: p.items.filter((_,j) => j !== ii) }))}
                        className="text-red-400 hover:text-red-600">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-gray-700">TOTAL SIN IGV</td>
                {form.proveedores.map((_, i) => <td key={i} className="px-2 py-1"></td>)}
                {score.totales.map((t, i) => (
                  <td key={`f${i}`} className={`px-2 py-1.5 text-xs text-right font-bold ${i === score.ganadorIdx ? 'text-green-700' : 'text-gray-700'}`}>
                    {fmtMoney(t)}
                  </td>
                ))}
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} className="px-2 py-1 text-xs font-semibold text-right text-gray-600">IGV 18%</td>
                {form.proveedores.map((_, i) => <td key={i}></td>)}
                {score.totales.map((t, i) => (
                  <td key={`g${i}`} className="px-2 py-1 text-xs text-right text-gray-500">{fmtMoney(t * 0.18)}</td>
                ))}
                <td></td>
              </tr>
              <tr className="bg-[#1e3a5f]/5">
                <td colSpan={4} className="px-2 py-1.5 text-xs font-bold text-right text-[#1e3a5f]">TOTAL CON IGV</td>
                {form.proveedores.map((_, i) => <td key={i}></td>)}
                {score.totales.map((t, i) => (
                  <td key={`h${i}`} className={`px-2 py-1.5 text-xs text-right font-bold ${i === score.ganadorIdx ? 'text-green-700' : 'text-[#1e3a5f]'}`}>
                    {fmtMoney(t * 1.18)}
                  </td>
                ))}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!isUnica && score.minT > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Proveedor más económico:{' '}
            <span className="font-bold text-green-700">{form.proveedores[score.totales.indexOf(score.minT)]?.alias}</span>
            {' '}— {fmtMoney(score.minT)} s/IGV
          </p>
        )}
      </div>

      {/* ── 5. Justificación cotización única (solo modo única) */}
      {isUnica && (
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Justificación — Cotización Única</h2>
          <p className="text-xs text-gray-500 mb-3">Indicar el motivo por el que no se realiza comparación de tres cotizaciones.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {JUSTIF_OPTIONS.map(opt => (
              <button key={opt} onClick={() => sf('justificacion', opt)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
                  form.justificacion === opt
                    ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                    : 'border-gray-300 text-gray-600 hover:border-[#1e3a5f]/50'}`}>
                {opt}
              </button>
            ))}
          </div>
          <input className="input" value={form.justificacion}
            onChange={e => sf('justificacion', e.target.value)}
            placeholder="Descripción del motivo (requerida)..." />
        </div>
      )}

      {/* ── 5b. Evaluación con puntaje (solo modo comparativa) */}
      {!isUnica && <div className="card">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Evaluación con Puntaje y Pesos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-2 py-2 text-left w-8" rowSpan={2}>N°</th>
                <th className="px-2 py-2 text-left" rowSpan={2}>Criterio</th>
                <th className="px-2 py-2 text-center w-14" rowSpan={2}>Peso</th>
                {form.proveedores.map((p, i) => (
                  <th key={i} className="px-2 py-2 text-center" colSpan={2}>{p.alias || `PROV. ${i+1}`}</th>
                ))}
              </tr>
              <tr className="bg-[#1e3a5f]/70 text-white text-xs">
                {form.proveedores.flatMap((_, i) => [
                  <th key={`ph${i}`} className="px-2 py-1.5 text-center font-normal">Puntaje</th>,
                  <th key={`rh${i}`} className="px-2 py-1.5 text-center font-normal">Resultado</th>
                ])}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CRITERIOS.map(cr => (
                <tr key={cr.n} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 text-gray-400 text-center">{cr.n}</td>
                  <td className="px-2 py-1.5 font-medium">{cr.label}</td>
                  <td className="px-2 py-1.5 text-center text-gray-600">{form.pesos[cr.peso].toFixed(2)}</td>
                  {form.proveedores.flatMap((_, i) => [
                    <td key={`p${i}`} className="px-2 py-1.5 text-right text-gray-700">
                      {(score[cr.key]?.[i] ?? 0).toFixed(2)}
                    </td>,
                    <td key={`r${i}`} className={`px-2 py-1.5 text-right font-medium ${i === score.ganadorIdx ? 'text-green-700' : 'text-blue-700'}`}>
                      {((score[cr.key]?.[i] ?? 0) * form.pesos[cr.peso]).toFixed(4)}
                    </td>
                  ])}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="px-2 py-2 text-xs">TOTAL PONDERADO</td>
                {score.resultados.flatMap((r, i) => [
                  <td key={`tp${i}`} className="px-2 py-2"></td>,
                  <td key={`tr${i}`} className={`px-2 py-2 text-xs text-right ${i === score.ganadorIdx ? 'text-green-700 text-sm' : 'text-gray-700'}`}>
                    {r.toFixed(4)}
                    {i === score.ganadorIdx && ' 🏆'}
                  </td>
                ])}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Ganador */}
        {score.ganadorIdx >= 0 && score.resultados[score.ganadorIdx] > 0 && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-4">
            <TrophyIcon className="w-10 h-10 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Proveedor Ganador</p>
              <p className="text-xl font-bold text-green-700">{form.proveedores[score.ganadorIdx]?.alias}</p>
              <p className="text-xs text-gray-500">
                {form.proveedores[score.ganadorIdx]?.razonSocial
                  ? `${form.proveedores[score.ganadorIdx].razonSocial} — `
                  : ''}
                Puntaje final: <span className="font-bold">{(score.resultados[score.ganadorIdx]).toFixed(4)}</span>
                {' '}({(score.resultados[score.ganadorIdx] * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        )}
      </div>}

      {/* ── 6. Comentarios ─────────────────────────────────── */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Comentarios / Observaciones</h2>
        <textarea className="input" rows={3} value={form.comentarios}
          onChange={e => sf('comentarios', e.target.value)}
          placeholder="Observaciones generales de la evaluación..." />
      </div>

      {/* ── 7. Aprobaciones ────────────────────────────────── */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Aprobaciones</h2>
        <div className="space-y-3">
          {form.aprobaciones.map((ap, i) => (
            <div key={i} className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Responsable</label>
                <input className="input text-xs bg-gray-50 text-gray-500" value={ap.responsable} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Cargo</label>
                <input className="input text-xs" value={ap.cargo} onChange={e => sa(i,'cargo',e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nombre y Apellidos</label>
                <input className="input text-xs" value={ap.nombre} onChange={e => sa(i,'nombre',e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Fecha</label>
                <input className="input text-xs" type="date" value={ap.fecha} onChange={e => sa(i,'fecha',e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button onClick={() => onSave(form, score)} className="btn-primary flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4"/>Guardar Cotización
        </button>
      </div>
    </div>
  )
}

/* ─── lista ──────────────────────────────────────────────── */

export default function Cotizaciones() {
  const { state, dispatch } = useApp()
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [view, setView]       = useState('list') // 'list' | 'form'
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const cotizaciones = [...(state.cotizaciones || [])].sort(
    (a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)
  )

  const handleSave = (form, score) => {
    const esUnica = form.modo === 'unica'
    const payload = {
      ...form,
      ganador:    esUnica ? (form.proveedores[0]?.alias || form.proveedores[0]?.razonSocial || '') : (form.proveedores[score.ganadorIdx]?.alias || ''),
      ganadorIdx: esUnica ? 0 : score.ganadorIdx,
      resultados: esUnica ? [] : score.resultados,
      totales:    esUnica
        ? [form.items.reduce((s, it) => s + Number(it.precios?.[0] || 0) * Number(it.cant || 0), 0)]
        : score.totales,
    }
    if (editing) {
      dispatch({ type: 'UPDATE_COTIZACION', id: editing.id, payload })
      toast('Cotización actualizada')
    } else {
      dispatch({ type: 'ADD_COTIZACION', payload })
      toast('Cotización guardada')
    }
    setView('list'); setEditing(null)
  }

  const handleDelete = (c) => {
    dispatch({ type: 'DELETE_COTIZACION', id: c.id })
    toast('Cotización eliminada'); setConfirm(null)
  }

  const handlePDF = (c) => {
    generarPDFCotizacion(c, state.logo)
    toast(`PDF ${c.numero} descargado`)
  }

  if (view === 'form') {
    return (
      <CotizacionForm
        initial={editing}
        onSave={handleSave}
        onCancel={() => { setView('list'); setEditing(null) }}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Cotizaciones — SIG-FO-107"
        subtitle="Cuadro Comparativo de Cotizaciones"
        action={
          <button onClick={() => { setEditing(null); setView('form') }} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4"/>Nueva Cotización
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="table-th">N°</th>
            <th className="table-th">Modalidad</th>
            <th className="table-th">Fecha Solicitud</th>
            <th className="table-th">Solicitante</th>
            <th className="table-th">Proyecto / Servicio</th>
            <th className="table-th">Proveedor / Ganador</th>
            <th className="table-th text-right">Total s/IGV</th>
            <th className="table-th text-right">% Final</th>
            <th className="table-th">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {cotizaciones.map(c => {
              const esUnica  = c.modo === 'unica'
              const ganRes   = c.resultados?.[c.ganadorIdx]
              const totalGan = esUnica ? c.totales?.[0] : c.totales?.[c.ganadorIdx]
              return (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="table-td font-mono text-xs font-semibold text-[#1e3a5f]">{c.numero}</td>
                  <td className="table-td">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esUnica ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {esUnica ? 'Única' : 'Comparativa'}
                    </span>
                  </td>
                  <td className="table-td">{fmtDate(c.fechaSolicitud)}</td>
                  <td className="table-td">{c.solicitante}</td>
                  <td className="table-td">{c.proyectoServicio}</td>
                  <td className="table-td">
                    {c.ganador && (
                      <span className="flex items-center gap-1.5 font-semibold text-green-700">
                        {!esUnica && <TrophyIcon className="w-4 h-4 text-yellow-500"/>}{c.ganador}
                      </span>
                    )}
                  </td>
                  <td className="table-td text-right font-medium text-[#1e3a5f]">
                    {totalGan != null && totalGan > 0 ? fmtMoney(totalGan) : '—'}
                  </td>
                  <td className="table-td text-right font-medium">
                    {esUnica ? <span className="text-xs text-gray-400">—</span> : (ganRes !== undefined ? `${(ganRes * 100).toFixed(1)}%` : '—')}
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(c); setView('form') }}
                        className="text-blue-500 hover:text-blue-700" title="Ver/Editar">
                        <EyeIcon className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handlePDF(c)}
                        className="text-green-500 hover:text-green-700" title="Descargar PDF">
                        <DocumentArrowDownIcon className="w-4 h-4"/>
                      </button>
                      {isAdmin && (
                        <button onClick={() => setConfirm(c)}
                          className="text-red-400 hover:text-red-600" title="Eliminar">
                          <TrashIcon className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {cotizaciones.length === 0 && (
              <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">Sin cotizaciones registradas</td></tr>

            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <Confirm
          message={`¿Eliminar cotización "${confirm.numero}"?`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
