import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/layout/Toast'
import PageHeader from '../components/common/PageHeader'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import {
  MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon,
  ClipboardDocumentListIcon, UserIcon, CubeTransparentIcon,
  CalendarDaysIcon, ShieldCheckIcon,
  DocumentMagnifyingGlassIcon, ChartBarIcon,
  LinkIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'

const fmtTs = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})+
    ' '+d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
}
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})
}
const diffHours = (a,b) => {
  if (!a||!b) return null
  const ms = Math.abs(new Date(b)-new Date(a))
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000)
  if (h>=48) return `${Math.floor(h/24)} día${Math.floor(h/24)!==1?'s':''}`
  if (h>=1) return `${h}h ${m}m`
  return `${m} min`
}
const TIPO_COLOR = {
  'Crear':'bg-green-100 text-green-700','Modificar':'bg-blue-100 text-blue-700',
  'Eliminar':'bg-red-100 text-red-700','Aprobar':'bg-emerald-100 text-emerald-700',
  'Rechazar':'bg-rose-100 text-rose-700','Acceso':'bg-purple-100 text-purple-700',
  'Cierre sesión':'bg-slate-100 text-slate-600','Exportar PDF':'bg-amber-100 text-amber-700',
  'Exportar Excel':'bg-teal-100 text-teal-700','Elevar':'bg-orange-100 text-orange-700',
  'Consolidar':'bg-indigo-100 text-indigo-700',
}
const MODULOS_LIST = ['Sistema','Maestros','Máquinas','Facturas','Vales de Salida','Órdenes de Compra',
  'Conformidades','RQs','EPPs','Almacén','Cotizaciones','Requerimientos','Req.Pago','Cuentas por Pagar','Uniformes','Maquinas']
const TIPOS_LIST = ['Acceso','Cierre sesión','Crear','Modificar','Eliminar','Aprobar','Rechazar','Exportar PDF','Exportar Excel','Elevar','Consolidar']
const POR_PAGINA = 50

function exportExcel(rows, nombre='auditoria') {
  const data = [['Fecha/Hora','Usuario','Rol','Módulo','Tipo','Descripción'],
    ...rows.map(r=>[fmtTs(r.timestamp),r.usuario||'—',r.rol||'—',r.modulo||'—',r.tipo||'—',r.descripcion||'—'])]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols']=[{wch:22},{wch:22},{wch:24},{wch:18},{wch:14},{wch:60}]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,ws,'Log')
  XLSX.writeFile(wb,`${nombre}_${new Date().toISOString().slice(0,10)}.xlsx`)
}
function exportExcelReport(rows,cols,sheet,nombre) {
  const ws = XLSX.utils.aoa_to_sheet([cols,...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,ws,sheet)
  XLSX.writeFile(wb,`${nombre}_${new Date().toISOString().slice(0,10)}.xlsx`)
}

function exportPDFTrazabilidad(docNum,eventos,vinculados,logoBase64) {
  const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
  const W=210,M=15; let y=15
  if (logoBase64){try{doc.addImage(logoBase64,'PNG',M,y,28,14)}catch{}}
  doc.setFont('helvetica','bold');doc.setFontSize(14)
  doc.text('GIVAMIC — Trazabilidad de Documento',W/2,y+5,{align:'center'})
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(80)
  doc.text(`Documento: ${docNum}  |  Generado: ${fmtTs(new Date().toISOString())}`,W/2,y+12,{align:'center'})
  doc.setTextColor(0);y+=24
  doc.setDrawColor(30,58,95);doc.line(M,y,W-M,y);y+=6
  if(vinculados.length>0){
    doc.setFont('helvetica','bold');doc.setFontSize(9)
    doc.text('DOCUMENTOS VINCULADOS:',M,y);y+=5
    doc.setFont('helvetica','normal');doc.setFontSize(8)
    doc.text(vinculados.join('  →  '),M,y);y+=8
  }
  doc.setFont('helvetica','bold');doc.setFontSize(9)
  doc.text('LÍNEA DE TIEMPO:',M,y);y+=5
  const cols=[M,M+38,M+62,M+90,M+120,M+148]
  const hdrs=['Fecha/Hora','Usuario','Cargo','Módulo','Tipo','Descripción']
  doc.setFillColor(30,58,95);doc.rect(M,y,W-2*M,6,'F')
  doc.setTextColor(255);doc.setFontSize(7)
  hdrs.forEach((h,i)=>doc.text(h,cols[i]+1,y+4))
  doc.setTextColor(0);y+=7
  doc.setFont('helvetica','normal');doc.setFontSize(7)
  eventos.forEach((e,idx)=>{
    if(y>270){doc.addPage();y=15}
    if(idx%2===0){doc.setFillColor(248,250,252);doc.rect(M,y,W-2*M,6,'F')}
    [fmtTs(e.timestamp),e.usuario||'—',e.rol||'—',e.modulo||'—',e.tipo||'—',(e.descripcion||'—').slice(0,55)]
      .forEach((v,i)=>doc.text(String(v),cols[i]+1,y+4))
    y+=6
  })
  y+=8;doc.setDrawColor(180);doc.line(M,y,W-M,y);y+=5
  doc.setFontSize(7);doc.setTextColor(100)
  doc.text(`Generado por GIVAMIC ERP el ${fmtTs(new Date().toISOString())} — Documento de evidencia para auditoría ISO`,W/2,y,{align:'center'})
  doc.save(`trazabilidad_${docNum}_${new Date().toISOString().slice(0,10)}.pdf`)
}

function KpiCard({icon:Icon,label,value,color}){
  return(
    <div className="card flex items-center gap-4 py-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5"/>
      </div>
      <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
    </div>
  )
}
function Tab({active,onClick,icon:Icon,label}){
  return(
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all
        ${active?'bg-[#1e3a5f] text-white shadow':'text-gray-600 hover:bg-gray-100'}`}>
      <Icon className="w-4 h-4"/>{label}
    </button>
  )
}

/* ── SECCIÓN 1: LOG GENERAL ─────────────────────────────────────────────── */
function SeccionLog({log}){
  const toast=useToast()
  const [search,setSearch]=useState('')
  const [filtroModulo,setFiltroModulo]=useState('')
  const [filtroTipo,setFiltroTipo]=useState('')
  const [filtroUsuario,setFiltroUsuario]=useState('')
  const [fechaDesde,setFechaDesde]=useState('')
  const [fechaHasta,setFechaHasta]=useState('')
  const [pagina,setPagina]=useState(1)

  const hoy=new Date().toISOString().slice(0,10)
  const accionesHoy=log.filter(e=>e.timestamp?.slice(0,10)===hoy).length
  const accionesSemana=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-7);return log.filter(e=>new Date(e.timestamp)>=d).length},[log])
  const topUsuario=useMemo(()=>{const c={};log.forEach(e=>{if(e.usuario)c[e.usuario]=(c[e.usuario]||0)+1});const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return t?`${t[0]} (${t[1]})`:'—'},[log])
  const usuarios=useMemo(()=>[...new Set(log.map(e=>e.usuario).filter(Boolean))].sort(),[log])
  const filtrados=useMemo(()=>log.filter(e=>{
    if(search&&!`${e.descripcion} ${e.usuario} ${e.modulo}`.toLowerCase().includes(search.toLowerCase()))return false
    if(filtroModulo&&e.modulo!==filtroModulo)return false
    if(filtroTipo&&e.tipo!==filtroTipo)return false
    if(filtroUsuario&&e.usuario!==filtroUsuario)return false
    if(fechaDesde&&e.timestamp?.slice(0,10)<fechaDesde)return false
    if(fechaHasta&&e.timestamp?.slice(0,10)>fechaHasta)return false
    return true
  }),[log,search,filtroModulo,filtroTipo,filtroUsuario,fechaDesde,fechaHasta])
  const totalPags=Math.max(1,Math.ceil(filtrados.length/POR_PAGINA))
  const pagRows=filtrados.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA)
  const limpiar=()=>{setSearch('');setFiltroModulo('');setFiltroTipo('');setFiltroUsuario('');setFechaDesde('');setFechaHasta('');setPagina(1)}
  const integridad=useMemo(()=>{const ids=log.map(e=>e.id);return ids.length===new Set(ids).size},[log])

  return(
    <div className="space-y-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${integridad?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>
        <ShieldCheckIcon className="w-4 h-4 shrink-0"/>
        {integridad?`Log íntegro — sin modificaciones detectadas (${log.length.toLocaleString()} eventos)`:'⚠ Anomalía detectada en el log — contacte al administrador'}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={ClipboardDocumentListIcon} label="Acciones hoy"       value={accionesHoy}              color="bg-blue-100 text-blue-600"/>
        <KpiCard icon={CalendarDaysIcon}          label="Últimos 7 días"      value={accionesSemana}           color="bg-purple-100 text-purple-600"/>
        <KpiCard icon={UserIcon}                  label="Usuario más activo"  value={topUsuario}               color="bg-green-100 text-green-600"/>
        <KpiCard icon={CubeTransparentIcon}       label="Total en log"        value={log.length.toLocaleString()} color="bg-amber-100 text-amber-600"/>
      </div>
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <FunnelIcon className="w-4 h-4"/>Filtros
          </div>
          <button onClick={()=>{exportExcel(filtrados);toast('Excel exportado','success')}} className="btn-secondary flex items-center gap-1.5 text-xs">
            <ArrowDownTrayIcon className="w-3.5 h-3.5"/>Exportar Excel
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative col-span-2 md:col-span-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none"/>
            <input className="input pl-8 text-sm" placeholder="Buscar..." value={search} onChange={e=>{setSearch(e.target.value);setPagina(1)}}/>
          </div>
          <select className="input text-sm" value={filtroModulo} onChange={e=>{setFiltroModulo(e.target.value);setPagina(1)}}>
            <option value="">Todos los módulos</option>{MODULOS_LIST.map(m=><option key={m}>{m}</option>)}
          </select>
          <select className="input text-sm" value={filtroTipo} onChange={e=>{setFiltroTipo(e.target.value);setPagina(1)}}>
            <option value="">Todos los tipos</option>{TIPOS_LIST.map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="input text-sm" value={filtroUsuario} onChange={e=>{setFiltroUsuario(e.target.value);setPagina(1)}}>
            <option value="">Todos los usuarios</option>{usuarios.map(u=><option key={u}>{u}</option>)}
          </select>
          <input type="date" className="input text-sm" value={fechaDesde} onChange={e=>{setFechaDesde(e.target.value);setPagina(1)}} title="Desde"/>
          <input type="date" className="input text-sm" value={fechaHasta} onChange={e=>{setFechaHasta(e.target.value);setPagina(1)}} title="Hasta"/>
        </div>
        {(search||filtroModulo||filtroTipo||filtroUsuario||fechaDesde||fechaHasta)&&(
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filtrados.length} resultado{filtrados.length!==1?'s':''}</span>
            <button onClick={limpiar} className="text-[#1e3a5f] hover:underline font-medium">Limpiar filtros</button>
          </div>
        )}
      </div>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              {['Fecha / Hora','Usuario','Rol','Módulo','Tipo','Descripción'].map(h=><th key={h} className="table-th whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {pagRows.length===0?(
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-16">
                  <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                  {log.length===0?'Aún no hay acciones registradas.':'Sin resultados para los filtros aplicados.'}
                </td></tr>
              ):pagRows.map(e=>(
                <tr key={e.id} className="hover:bg-gray-50/60">
                  <td className="table-td whitespace-nowrap font-mono text-xs text-gray-500">{fmtTs(e.timestamp)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#1e3a5f]">{(e.usuario||'?')[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-700">{e.usuario||'—'}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={`badge text-xs ${e.rol==='Administrador'?'bg-purple-100 text-purple-700':e.rol==='Auditor'?'bg-teal-100 text-teal-700':'bg-gray-100 text-gray-600'}`}>{e.rol||'—'}</span>
                  </td>
                  <td className="table-td text-gray-700 font-medium text-xs">{e.modulo||'—'}</td>
                  <td className="table-td"><span className={`badge text-xs ${TIPO_COLOR[e.tipo]||'bg-gray-100 text-gray-600'}`}>{e.tipo||'—'}</span></td>
                  <td className="table-td text-gray-600 text-xs max-w-xs truncate" title={e.descripcion}>{e.descripcion||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPags>1&&(
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Mostrando {((pagina-1)*POR_PAGINA)+1}–{Math.min(pagina*POR_PAGINA,filtrados.length)} de {filtrados.length}</span>
            <div className="flex gap-1">
              <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
              {Array.from({length:Math.min(5,totalPags)},(_,i)=>{
                const p=pagina<=3?i+1:pagina>totalPags-2?totalPags-4+i:pagina-2+i
                if(p<1||p>totalPags)return null
                return <button key={p} onClick={()=>setPagina(p)} className={`px-3 py-1 rounded border ${p===pagina?'bg-[#1e3a5f] text-white border-[#1e3a5f]':'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              })}
              <button onClick={()=>setPagina(p=>Math.min(totalPags,p+1))} disabled={pagina===totalPags} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── SECCIÓN 2: TRAZABILIDAD ─────────────────────────────────────────────── */
function SeccionTrazabilidad({log,state}){
  const toast=useToast()
  const [query,setQuery]=useState('')
  const [resultado,setResultado]=useState(null)

  const buscar=useCallback(()=>{
    const q=query.trim().toUpperCase()
    if(!q)return toast('Ingrese un número de documento','error')
    const eventos=log.filter(e=>(e.descripcion||'').toUpperCase().includes(q)||(e.documentoRef||'').toUpperCase()===q)
      .sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))
    let docInfo=null; const vinculados=[]
    if(q.startsWith('REQ-')){
      const req=(state.requerimientos||[]).find(r=>(r.numero||'').toUpperCase()===q)
      if(req){docInfo={tipo:'Requerimiento',numero:req.numero,estado:req.estado,fecha:req.fecha};if(req.ocVinculada)vinculados.push(req.ocVinculada)}
    }else if(q.startsWith('OC-')){
      const oc=(state.ordenesCompra||[]).find(o=>(o.numero||'').toUpperCase()===q)
      if(oc){
        docInfo={tipo:'Orden de Compra',numero:oc.numero,estado:oc.estado,fecha:oc.fecha}
        if(oc.facturaId){const f=(state.facturas||[]).find(f=>f.id===oc.facturaId);if(f)vinculados.push(f.numero)}
      }
    }else if(q.startsWith('FAC-')||q.startsWith('FT-')){
      const fac=(state.facturas||[]).find(f=>(f.numero||'').toUpperCase()===q)
      if(fac)docInfo={tipo:'Factura',numero:fac.numero,estado:fac.estado,fecha:fac.fecha}
    }
    setResultado({q,eventos,docInfo,vinculados})
  },[query,log,state,toast])

  const handlePDF=()=>{
    if(!resultado?.eventos?.length)return toast('Sin eventos para exportar','error')
    exportPDFTrazabilidad(resultado.q,resultado.eventos,[resultado.q,...resultado.vinculados],state.logo||state.config?.logoBase64)
    toast('PDF de evidencia generado','success')
  }

  return(
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm font-semibold text-gray-700 mb-3">Buscar documento por número</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DocumentMagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none"/>
            <input className="input pl-9 text-sm w-full" placeholder="REQ-0001 / OC-0003 / FAC-0012..."
              value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscar()}/>
          </div>
          <button onClick={buscar} className="btn-primary text-sm px-5">Buscar</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Ingrese el número exacto para ver la trazabilidad completa</p>
      </div>
      {resultado&&(
        <>
          <div className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-[#1e3a5f]">{resultado.q}</span>
                  {resultado.docInfo&&<span className="badge bg-blue-100 text-blue-700">{resultado.docInfo.tipo}</span>}
                  {resultado.docInfo?.estado&&<span className="badge bg-green-100 text-green-700">{resultado.docInfo.estado}</span>}
                </div>
                {resultado.docInfo?.fecha&&<p className="text-xs text-gray-500">Creado el {fmtDate(resultado.docInfo.fecha)}</p>}
              </div>
              <button onClick={handlePDF} className="btn-secondary text-xs flex items-center gap-1.5">
                <ArrowDownTrayIcon className="w-3.5 h-3.5"/>Exportar PDF evidencia ISO
              </button>
            </div>
            {resultado.vinculados.length>0&&(
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1.5">
                  <LinkIcon className="w-3.5 h-3.5"/>Documentos vinculados
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[resultado.q,...resultado.vinculados].map((d,i,arr)=>(
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="bg-white border border-blue-200 text-blue-800 text-xs font-mono px-2 py-0.5 rounded">{d}</span>
                      {i<arr.length-1&&<ArrowRightIcon className="w-3 h-3 text-blue-400"/>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {resultado.eventos.length===0&&<p className="text-sm text-gray-400 text-center py-8">No se encontraron eventos en el log para este documento.</p>}
          </div>
          {resultado.eventos.length>0&&(
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">Línea de tiempo — {resultado.eventos.length} evento{resultado.eventos.length!==1?'s':''}</span>
              </div>
              <div className="p-4 space-y-2">
                {resultado.eventos.map((e,idx)=>{
                  const prev=resultado.eventos[idx-1]
                  const delta=prev?diffHours(prev.timestamp,e.timestamp):null
                  return(
                    <div key={e.id}>
                      {delta&&(
                        <div className="flex items-center gap-2 my-1.5 ml-5">
                          <div className="w-px h-4 bg-gray-200 ml-1"/>
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">⏱ {delta} después</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${(TIPO_COLOR[e.tipo]||'bg-gray-200 text-gray-600').split(' ')[0]}`}/>
                          {idx<resultado.eventos.length-1&&<div className="w-px flex-1 bg-gray-100 mt-1"/>}
                        </div>
                        <div className="pb-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-mono text-gray-400">{fmtTs(e.timestamp)}</span>
                            <span className={`badge text-[10px] ${TIPO_COLOR[e.tipo]||'bg-gray-100 text-gray-600'}`}>{e.tipo}</span>
                            <span className="text-xs font-medium text-gray-700">{e.usuario}</span>
                            {e.rol&&<span className="text-[10px] text-gray-400">({e.rol})</span>}
                          </div>
                          <p className="text-xs text-gray-600">{e.descripcion}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── SECCIÓN 3: REPORTES ISO ─────────────────────────────────────────────── */
function SeccionReportes({log,state}){
  const toast=useToast()
  const [rep,setRep]=useState('1')
  const [fechaDesde,setDesde]=useState('')
  const [fechaHasta,setHasta]=useState('')

  const inPeriod=useCallback((e)=>{
    if(fechaDesde&&e.timestamp?.slice(0,10)<fechaDesde)return false
    if(fechaHasta&&e.timestamp?.slice(0,10)>fechaHasta)return false
    return true
  },[fechaDesde,fechaHasta])

  const reporte1=useMemo(()=>log.filter(e=>e.tipo==='Aprobar'&&inPeriod(e)),[log,inPeriod])
  const reporte2=useMemo(()=>{
    const docs={}
    log.forEach(e=>{const m=(e.descripcion||'').match(/REQ-\d+|OC-\d+|FAC-\d+/i);if(!m)return;const k=m[0].toUpperCase();if(!docs[k])docs[k]=[];docs[k].push(e)})
    return Object.entries(docs).map(([num,evs])=>{
      const sorted=evs.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))
      const aprobacion=sorted.find(e=>e.tipo==='Aprobar')
      return{num,creacion:fmtTs(sorted[0]?.timestamp),aprobacion:fmtTs(aprobacion?.timestamp),tiempoRespuesta:aprobacion?diffHours(sorted[0]?.timestamp,aprobacion?.timestamp):'Pendiente',total:sorted.length}
    })
  },[log])
  const reporte3=useMemo(()=>{
    const map={}
    ;(state.requerimientos||[]).forEach(r=>{const k=r.estado||'Sin estado';if(!map[k])map[k]={estado:k,count:0,sedes:{}};map[k].count++;const s=r.sede||'Sin sede';map[k].sedes[s]=(map[k].sedes[s]||0)+1})
    return Object.values(map).sort((a,b)=>b.count-a.count)
  },[state.requerimientos])
  const reporte4=useMemo(()=>{
    const users={}
    log.filter(inPeriod).forEach(e=>{
      if(!e.usuario)return
      if(!users[e.usuario])users[e.usuario]={usuario:e.usuario,rol:e.rol,accesos:0,acciones:0,ultimoAcceso:''}
      if(e.tipo==='Acceso')users[e.usuario].accesos++;else users[e.usuario].acciones++
      if(!users[e.usuario].ultimoAcceso||e.timestamp>users[e.usuario].ultimoAcceso)users[e.usuario].ultimoAcceso=e.timestamp
    })
    return Object.values(users).sort((a,b)=>b.acciones-a.acciones)
  },[log,inPeriod])

  const exportR1=()=>{exportExcelReport(reporte1.map(e=>[fmtTs(e.timestamp),e.usuario||'—',e.rol||'—',e.modulo||'—',e.descripcion||'—']),['Fecha/Hora','Usuario','Cargo','Módulo','Descripción'],'Aprobaciones','reporte_aprobaciones');toast('Excel exportado','success')}
  const exportR4=()=>{exportExcelReport(reporte4.map(u=>[u.usuario,u.rol||'—',u.accesos,u.acciones,fmtTs(u.ultimoAcceso)]),['Usuario','Rol','Inicios sesión','Acciones','Último acceso'],'Accesos','reporte_accesos');toast('Excel exportado','success')}
  const exportR5=()=>{
    const rows=log.filter(inPeriod).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).map(e=>[fmtTs(e.timestamp),e.usuario||'—',e.rol||'—',e.modulo||'—',e.tipo||'—',e.descripcion||'—'])
    exportExcelReport(rows,['Fecha/Hora','Usuario','Rol','Módulo','Tipo','Descripción'],'Trazabilidad','trazabilidad_masiva')
    toast('Excel de trazabilidad masiva exportado','success')
  }

  const TABS_REP=[{id:'1',label:'Aprobaciones'},{id:'2',label:'Tiempos respuesta'},{id:'3',label:'REQs por estado'},{id:'4',label:'Accesos'},{id:'5',label:'Trazabilidad masiva'}]

  return(
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período:</span>
          <input type="date" className="input text-sm w-40" value={fechaDesde} onChange={e=>setDesde(e.target.value)}/>
          <span className="text-gray-400 text-xs">—</span>
          <input type="date" className="input text-sm w-40" value={fechaHasta} onChange={e=>setHasta(e.target.value)}/>
          {(fechaDesde||fechaHasta)&&<button onClick={()=>{setDesde('');setHasta('')}} className="text-xs text-[#1e3a5f] hover:underline">Limpiar</button>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TABS_REP.map(t=>(
          <button key={t.id} onClick={()=>setRep(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${rep===t.id?'bg-[#1e3a5f] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.id}. {t.label}
          </button>
        ))}
      </div>

      {rep==='1'&&(
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Aprobaciones ({reporte1.length})</span>
            <button onClick={exportR1} className="btn-secondary text-xs flex items-center gap-1"><ArrowDownTrayIcon className="w-3.5 h-3.5"/>Excel</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-gray-50"><tr>{['Fecha/Hora','Usuario','Cargo','Módulo','Descripción'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {reporte1.length===0?<tr><td colSpan={5} className="table-td text-center text-gray-400 py-10">Sin aprobaciones en el período</td></tr>
              :reporte1.map(e=><tr key={e.id} className="hover:bg-gray-50/60">
                <td className="table-td font-mono whitespace-nowrap">{fmtTs(e.timestamp)}</td>
                <td className="table-td font-medium">{e.usuario||'—'}</td>
                <td className="table-td"><span className="badge bg-purple-100 text-purple-700">{e.rol||'—'}</span></td>
                <td className="table-td">{e.modulo||'—'}</td>
                <td className="table-td text-gray-600 max-w-xs truncate">{e.descripcion||'—'}</td>
              </tr>)}
            </tbody>
          </table></div>
        </div>
      )}
      {rep==='2'&&(
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Tiempos de respuesta ({reporte2.length})</span>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-gray-50"><tr>{['Documento','Creación','1ª aprobación','Tiempo respuesta','N° eventos'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {reporte2.length===0?<tr><td colSpan={5} className="table-td text-center text-gray-400 py-10">Sin datos suficientes</td></tr>
              :reporte2.map(r=><tr key={r.num} className="hover:bg-gray-50/60">
                <td className="table-td font-mono font-bold text-[#1e3a5f]">{r.num}</td>
                <td className="table-td whitespace-nowrap">{r.creacion}</td>
                <td className="table-td whitespace-nowrap">{r.aprobacion}</td>
                <td className="table-td"><span className={`badge ${r.tiempoRespuesta==='Pendiente'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{r.tiempoRespuesta}</span></td>
                <td className="table-td text-center">{r.total}</td>
              </tr>)}
            </tbody>
          </table></div>
        </div>
      )}
      {rep==='3'&&(
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-gray-700">Requerimientos por estado ({(state.requerimientos||[]).length} total)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {reporte3.map(r=>(
              <div key={r.estado} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-2xl font-bold text-[#1e3a5f]">{r.count}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight">{r.estado}</p>
                {Object.entries(r.sedes).map(([sede,n])=>(
                  <div key={sede} className="flex justify-between text-[10px] text-gray-400 mt-1"><span>{sede}</span><span>{n}</span></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {rep==='4'&&(
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Accesos y usuarios ({reporte4.length})</span>
            <button onClick={exportR4} className="btn-secondary text-xs flex items-center gap-1"><ArrowDownTrayIcon className="w-3.5 h-3.5"/>Excel</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-gray-50"><tr>{['Usuario','Rol','Inicios sesión','Acciones','Último acceso'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {reporte4.length===0?<tr><td colSpan={5} className="table-td text-center text-gray-400 py-10">Sin registros en el período</td></tr>
              :reporte4.map(u=><tr key={u.usuario} className="hover:bg-gray-50/60">
                <td className="table-td">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#1e3a5f]">{u.usuario[0].toUpperCase()}</span>
                    </div>
                    <span className="font-medium">{u.usuario}</span>
                  </div>
                </td>
                <td className="table-td"><span className="badge bg-gray-100 text-gray-600">{u.rol||'—'}</span></td>
                <td className="table-td text-center font-bold text-purple-600">{u.accesos}</td>
                <td className="table-td text-center font-bold text-blue-600">{u.acciones}</td>
                <td className="table-td font-mono whitespace-nowrap">{fmtTs(u.ultimoAcceso)}</td>
              </tr>)}
            </tbody>
          </table></div>
        </div>
      )}
      {rep==='5'&&(
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Trazabilidad masiva — exportar todos los eventos</p>
            <p className="text-xs text-gray-500">Genera un Excel con todos los eventos del período. Una fila por evento, ideal para análisis masivo del auditor ISO.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">¿Qué incluye?</p>
            <p className="text-xs text-blue-600">Fecha/Hora · Usuario · Rol · Módulo · Tipo de acción · Descripción completa</p>
          </div>
          <button onClick={exportR5} className="btn-primary flex items-center gap-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4"/>
            Exportar Excel — Trazabilidad masiva{(fechaDesde||fechaHasta)&&` (${fechaDesde||'…'} — ${fechaHasta||'…'})`}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────── */
export default function Auditoria(){
  const {state}=useApp()
  const {isAdmin,isAuditor}=useAuth()
  const [tab,setTab]=useState('log')
  const log=useMemo(()=>state.auditLog||[],[state.auditLog])

  if(!isAdmin&&!isAuditor){
    return(
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheckIcon className="w-16 h-16 text-gray-300"/>
        <p className="text-gray-500 font-semibold">Acceso restringido — Sólo Administrador y Auditor ISO</p>
      </div>
    )
  }

  return(
    <div className="space-y-4">
      <PageHeader title="Auditoría del Sistema"
        subtitle={`${log.length.toLocaleString()} eventos — log inmutable · acceso exclusivo Admin / Auditor`}/>
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm w-fit">
        <Tab active={tab==='log'}  onClick={()=>setTab('log')}  icon={ClipboardDocumentListIcon}   label="Log General"/>
        <Tab active={tab==='traz'} onClick={()=>setTab('traz')} icon={DocumentMagnifyingGlassIcon} label="Trazabilidad"/>
        <Tab active={tab==='rep'}  onClick={()=>setTab('rep')}  icon={ChartBarIcon}                label="Reportes ISO"/>
      </div>
      {tab==='log'  &&<SeccionLog  log={log}/>}
      {tab==='traz' &&<SeccionTrazabilidad log={log} state={state}/>}
      {tab==='rep'  &&<SeccionReportes log={log} state={state}/>}
    </div>
  )
}
