import jsPDF from 'jspdf'

/* ── helpers ─────────────────────────────────────────────── */
const NK  = [30, 30, 30]
const BL  = [30, 58, 95]
const GR  = [108, 108, 108]
const LGR = [220, 220, 220]
const GRN = [22, 120, 60]
const WHT = [255, 255, 255]
const YEL = [245, 158, 11]

const fmt  = n => `S/ ${Number(n||0).toFixed(2)}`
const fmtP = n => `${(Number(n||0)*100).toFixed(1)}%`
const fmtN = (n,d=2) => Number(n||0).toFixed(d)

function rect(doc, x, y, w, h, fill, stroke) {
  if (fill)   { doc.setFillColor(...fill);   doc.rect(x,y,w,h,'F') }
  if (stroke) { doc.setDrawColor(...stroke); doc.rect(x,y,w,h,'S') }
}
function hdr(doc, x, y, w, h, bg, text, fsize=7, bold=true) {
  rect(doc, x, y, w, h, bg, null)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fsize)
  doc.setTextColor(...WHT)
  doc.text(text, x + w/2, y + h/2 + fsize*0.35, { align: 'center' })
}
function cell(doc, x, y, w, h, text, opts={}) {
  rect(doc, x, y, w, h, opts.bg || null, LGR)
  const color = opts.color || NK
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  doc.setFontSize(opts.fs || 7)
  doc.setTextColor(...color)
  const align = opts.align || 'left'
  const tx = align === 'right' ? x+w-1.5 : align === 'center' ? x+w/2 : x+1.5
  const lines = doc.splitTextToSize(String(text ?? ''), w-3)
  doc.text(lines[0] ?? '', tx, y + h/2 + (opts.fs||7)*0.35, { align })
}

/* ── generador principal ─────────────────────────────────── */
export function generarPDFCotizacion(cot, logo) {
  const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW   = 297   // page width
  const PH   = 210   // page height
  const ML   = 8     // margin left
  const MR   = 8     // margin right
  const W    = PW - ML - MR  // 281mm usable
  let y      = 8

  const provs = cot.proveedores || []
  const NP    = provs.length     // 3
  const items = cot.items || []
  const pesos = cot.pesos || {}
  const score = buildScore(provs, items, pesos)

  /* ══ HEADER ══════════════════════════════════════════════ */
  const LOGO_W = 28
  const HDR_H  = 22
  const TITLE_W = W - LOGO_W - 50
  const CODE_W  = 50

  // Logo
  if (logo) {
    try { doc.addImage(logo, 'PNG', ML+6.9, y+2, 14.2, 18) } catch {}
  } else {
    rect(doc, ML, y, LOGO_W, HDR_H, BL, null)
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...WHT)
    doc.text('GIVAMIC', ML + LOGO_W/2, y + HDR_H/2 + 1.5, { align:'center' })
  }

  // Title
  rect(doc, ML + LOGO_W, y, TITLE_W, HDR_H/2, BL, null)
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...WHT)
  doc.text('SISTEMA INTEGRADO DE GESTIÓN', ML + LOGO_W + TITLE_W/2, y + HDR_H/4 + 1.5, { align:'center' })
  rect(doc, ML + LOGO_W, y + HDR_H/2, TITLE_W, HDR_H/2, [40,75,120], null)
  doc.setFontSize(8.5)
  doc.text('CUADRO COMPARATIVO DE COTIZACIONES', ML + LOGO_W + TITLE_W/2, y + HDR_H*3/4 + 1.5, { align:'center' })

  // Code block
  const cx = ML + LOGO_W + TITLE_W
  const rh = HDR_H / 3
  ;[
    ['CÓDIGO:',  'SIG-FO-107'],
    ['VERSIÓN:', '003'],
    ['FECHA:',   '2026-03-01'],
  ].forEach(([lbl, val], i) => {
    rect(doc, cx, y + rh*i, CODE_W, rh, [240,244,248], LGR)
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BL)
    doc.text(lbl, cx+1.5, y + rh*i + rh/2 + 2)
    doc.setFont('helvetica','normal'); doc.setTextColor(...NK)
    doc.text(val, cx+CODE_W-1.5, y + rh*i + rh/2 + 2, { align:'right' })
  })

  y += HDR_H + 3

  /* ══ DATOS GENERALES ═════════════════════════════════════ */
  const DG_H = 5.5
  rect(doc, ML, y, W, DG_H, BL, null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('DATOS GENERALES', ML + 2, y + DG_H/2 + 1.5)
  y += DG_H

  const half = W/2 - 1
  const dg = [
    [['Solicitante:',          cot.solicitante||''],   ['Fecha de Solicitud:',   cot.fechaSolicitud||'']],
    [['Cargo Responsable:',    cot.cargoResponsable||''], ['Fecha de Evaluación:',  cot.fechaEvaluacion||'']],
    [['Proyecto / Servicio:',  cot.proyectoServicio||''], ['Tipo:',                 cot.tipo||'']],
    [['¿Requisitos SST?',      cot.requisitoSST||'No'], ['¿Requisitos MA?',       cot.requisitoMA||'No']],
  ]
  const fh = 5
  dg.forEach(row => {
    row.forEach(([lbl, val], ci) => {
      const rx = ML + ci*(half+2)
      rect(doc, rx, y, half, fh, [245,247,250], LGR)
      doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...BL)
      doc.text(lbl, rx+1.5, y+fh/2+1)
      doc.setFont('helvetica','normal'); doc.setTextColor(...NK)
      doc.text(String(val), rx+half-1.5, y+fh/2+1, { align:'right' })
    })
    y += fh
  })
  y += 3

  /* ══ COMPARACIÓN ECONÓMICA ════════════════════════════════ */
  rect(doc, ML, y, W, 5.5, [30,80,140], null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('COMPARACIÓN ECONÓMICA Y COMERCIAL', ML+2, y+3.5)
  y += 5.5

  // Column widths: N°, Descripción, UND, CANT, P1, P2, P3, T1, T2, T3, MenorP, Prov.Econ.
  const NC  = 6
  const DC  = 52
  const UC  = 10
  const QC  = 12
  const PC  = (W - NC - DC - UC - QC - 22 - 24) / (NP * 2)  // price + total per prov
  const MPC = 22
  const PEC = 24

  const ITH = 8
  // header row
  let cx2 = ML
  hdr(doc, cx2, y, NC,  ITH, BL, 'N°',     6.5)    ; cx2+=NC
  hdr(doc, cx2, y, DC,  ITH, BL, 'ÍTEM / DESCRIPCIÓN', 6.5) ; cx2+=DC
  hdr(doc, cx2, y, UC,  ITH, BL, 'UND.',   6.5)    ; cx2+=UC
  hdr(doc, cx2, y, QC,  ITH, BL, 'CANT.',  6.5)    ; cx2+=QC
  provs.forEach((p,i) => {
    hdr(doc, cx2, y, PC*2, ITH, [30+i*15,58+i*10,95+i*5], `${p.alias||`PROV.${i+1}`}`, 6.5)
    cx2 += PC*2
  })
  hdr(doc, cx2, y, MPC, ITH, [20,100,60], 'MENOR PRECIO', 6)     ; cx2+=MPC
  hdr(doc, cx2, y, PEC, ITH, [20,100,60], 'PROV. MÁS ECONÓMICO', 5.5) ; cx2+=PEC
  y += ITH

  // sub-header for P.Unit / Total
  cx2 = ML + NC + DC + UC + QC
  provs.forEach(() => {
    hdr(doc, cx2, y, PC, 5, [50,90,140], 'P. Unit.', 6)  ; cx2+=PC
    hdr(doc, cx2, y, PC, 5, [50,90,140], 'Total',    6)  ; cx2+=PC
  })
  hdr(doc, cx2, y, MPC, 5, [40,130,80], '', 6) ; cx2+=MPC
  hdr(doc, cx2, y, PEC, 5, [40,130,80], '', 6) ; cx2+=PEC
  y += 5

  // items
  const RH = 6
  items.forEach((it, ii) => {
    const totals = provs.map((_, pi) => Number(it.precios[pi]||0)*Number(it.cant||0))
    const minT   = Math.min(...totals.filter(t=>t>0).concat(Infinity))
    const minIdx = totals.indexOf(minT)

    cx2 = ML
    cell(doc, cx2, y, NC,  RH, ii+1,          { align:'center' }) ; cx2+=NC
    cell(doc, cx2, y, DC,  RH, it.descripcion, {})                 ; cx2+=DC
    cell(doc, cx2, y, UC,  RH, it.und,         { align:'center' }) ; cx2+=UC
    cell(doc, cx2, y, QC,  RH, it.cant,        { align:'right'  }) ; cx2+=QC
    provs.forEach((_, pi) => {
      const bg = pi===minIdx ? [230,255,235] : null
      cell(doc, cx2, y, PC, RH, fmt(it.precios[pi]||0), { align:'right', bg }) ; cx2+=PC
      cell(doc, cx2, y, PC, RH, fmt(totals[pi]),        { align:'right', bg, bold: pi===minIdx }) ; cx2+=PC
    })
    const minVal = isFinite(minT) ? minT : 0
    cell(doc, cx2, y, MPC, RH, fmt(minVal),                     { align:'right', color:GRN, bold:true }) ; cx2+=MPC
    cell(doc, cx2, y, PEC, RH, isFinite(minT)?provs[minIdx]?.alias:'', { align:'center', color:GRN, bold:true }) ; cx2+=PEC
    y += RH
  })

  // totals row
  cx2 = ML
  ;[NC,DC,UC,QC].forEach(w => { rect(doc,cx2,y,w,RH,[245,247,250],LGR); cx2+=w })
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BL)
  doc.text('TOTAL SIN IGV', ML+NC+DC+UC+QC-1.5, y+RH/2+1.5, { align:'right' })
  provs.forEach((_, pi) => {
    cell(doc, cx2, y, PC, RH, '', {}) ; cx2+=PC
    cell(doc, cx2, y, PC, RH, fmt(score.totales[pi]), { align:'right', bold:pi===score.ganadorIdx, color:pi===score.ganadorIdx?GRN:NK }) ; cx2+=PC
  })
  cell(doc, cx2, y, MPC, RH, fmt(score.minT), { align:'right', color:GRN, bold:true }) ; cx2+=MPC
  cell(doc, cx2, y, PEC, RH, provs[score.ganadorIdx]?.alias||'', { align:'center', color:GRN, bold:true }) ; cx2+=PEC
  y += RH

  // IGV + total con IGV
  ;['IGV 18%', 'TOTAL CON IGV'].forEach((lbl, ri) => {
    cx2 = ML
    rect(doc,cx2,y,NC+DC+UC+QC,RH,[245,247,250],LGR)
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...BL)
    doc.text(lbl, ML+NC+DC+UC+QC-1.5, y+RH/2+1.5, { align:'right' })
    cx2 += NC+DC+UC+QC
    const mult = ri===0 ? 0.18 : 1.18
    provs.forEach((_, pi) => {
      cell(doc, cx2, y, PC, RH, '', {}) ; cx2+=PC
      cell(doc, cx2, y, PC, RH, fmt(score.totales[pi]*mult), {
        align:'right',
        bold: ri===1 && pi===score.ganadorIdx,
        color: ri===1 && pi===score.ganadorIdx ? GRN : NK,
        bg: ri===1 && pi===score.ganadorIdx ? [230,255,235] : null
      }) ; cx2+=PC
    })
    cell(doc, cx2, y, MPC, RH, ri===1?fmt(score.minT*1.18):'', { align:'right', color:GRN, bold:true }) ; cx2+=MPC
    cell(doc, cx2, y, PEC, RH, '', {}) ; cx2+=PEC
    y += RH
  })

  y += 3

  /* ══ RESUMEN POR PROVEEDOR ════════════════════════════════ */
  // Check if new page needed
  if (y > 155) { doc.addPage(); y = 8 }

  rect(doc, ML, y, W, 5.5, [30,80,140], null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('RESUMEN POR PROVEEDOR', ML+2, y+3.5)
  y += 5.5

  const LW   = 55
  const CRSW = (W - LW) / NP
  const SRH  = 5.5

  // Prov headers
  cx2 = ML + LW
  provs.forEach((p, i) => {
    hdr(doc, cx2, y, CRSW, SRH, [30+i*15,58+i*10,95+i*5], p.alias||`PROV.${i+1}`, 6.5)
    cx2 += CRSW
  })
  y += SRH

  const resRows = [
    { lbl:'Razón Social',                   key:'razonSocial' },
    { lbl:'RUC',                            key:'ruc' },
    { lbl:'Condición del Proveedor',        key:'condicion' },
    { lbl:'Forma de Pago',                  key:'formaPago' },
    { lbl:'Días de pago a crédito',         key:'diasCredito' },
    { lbl:'Plazo de entrega (días)',         key:'plazoEntrega' },
    { lbl:'Vigencia de la cotización (d)',   key:'vigencia' },
  ]
  resRows.forEach(row => {
    rect(doc, ML, y, LW, SRH, [240,245,250], LGR)
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...BL)
    doc.text(row.lbl, ML+1.5, y+SRH/2+1)
    cx2 = ML + LW
    provs.forEach(p => {
      cell(doc, cx2, y, CRSW, SRH, p[row.key]??'—', { align:'center' })
      cx2 += CRSW
    })
    y += SRH
  })
  y += 3

  /* ══ PÁGINA 2: EVALUACIÓN PUNTAJE ════════════════════════ */
  doc.addPage(); y = 8

  // Mini header
  rect(doc, ML, y, W, 5.5, BL, null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('SIG-FO-107 — CUADRO COMPARATIVO DE COTIZACIONES (continuación)', ML+2, y+3.5)
  y += 5.5 + 3

  // Técnica y SST
  rect(doc, ML, y, W, 5.5, [30,80,140], null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('COMPARACIÓN TÉCNICA Y SST/MA', ML+2, y+3.5)
  y += 5.5

  const tecRows = [
    { lbl:'La oferta cumple las especificaciones técnicas, experiencia y documentación requerida', key:'cumpleEsp' },
    { lbl:'El proveedor cumple los requisitos mínimos de SST y ambientales aplicables',           key:'cumpleSST' },
  ]
  tecRows.forEach(row => {
    rect(doc, ML, y, LW*2, SRH, [240,245,250], LGR)
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...NK)
    const lines = doc.splitTextToSize(row.lbl, LW*2-3)
    doc.text(lines[0], ML+1.5, y+SRH/2+1)
    cx2 = ML + LW*2
    const cw = (W - LW*2) / NP
    provs.forEach(p => {
      const val = p[row.key] === 'Si' ? 'SÍ ✓' : 'NO ✗'
      const color = p[row.key] === 'Si' ? GRN : [200,40,40]
      cell(doc, cx2, y, cw, SRH, val, { align:'center', color, bold:true })
      cx2 += cw
    })
    y += SRH
  })
  y += 4

  /* ── Evaluación con puntaje ────────────────────────────── */
  rect(doc, ML, y, W, 5.5, [30,80,140], null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('EVALUACIÓN CON PUNTAJE Y PESOS', ML+2, y+3.5)
  y += 5.5

  const ELW  = 8     // N°
  const ECW  = 60    // criterio
  const EPW  = 14    // peso
  const EPVW = (W - ELW - ECW - EPW) / (NP * 2)  // puntaje / resultado each

  // Header
  cx2 = ML
  hdr(doc, cx2, y, ELW, 11, BL, 'N°',      6)    ; cx2+=ELW
  hdr(doc, cx2, y, ECW, 11, BL, 'CRITERIO', 6)   ; cx2+=ECW
  hdr(doc, cx2, y, EPW, 11, BL, 'PESO',     6)   ; cx2+=EPW
  provs.forEach((p, i) => {
    hdr(doc, cx2, y, EPVW*2, 6, [30+i*15,58+i*10,95+i*5], p.alias||`PROV.${i+1}`, 6)
    cx2 += EPVW*2
  })
  // sub-header
  cx2 = ML + ELW + ECW + EPW
  provs.forEach(() => {
    hdr(doc, cx2, y+6, EPVW, 5, [50,90,140], 'Puntaje',   5.5) ; cx2+=EPVW
    hdr(doc, cx2, y+6, EPVW, 5, [50,90,140], 'Resultado',  5.5) ; cx2+=EPVW
  })
  y += 11

  const scoreKeys = ['pPrecio','pSST','pEsp','pPago','pPlazo','pCond']
  const criterioLabels = [
    ['01','Precio',                        'precio'],
    ['02','Cumplimiento SST / MA',         'sst'],
    ['03','Cumplimiento Esp. Técnicas',    'espTecnica'],
    ['04','Forma de Pago / Crédito',       'formaPago'],
    ['05','Plazo de Entrega',              'plazoEntrega'],
    ['06','Condición del Proveedor',       'condicion'],
  ]
  const ERH = 6
  criterioLabels.forEach(([n, lbl, pk], ci) => {
    cx2 = ML
    const bg = ci%2===0 ? WHT : [248,250,252]
    cell(doc, cx2, y, ELW, ERH, n,    { align:'center', bg }) ; cx2+=ELW
    cell(doc, cx2, y, ECW, ERH, lbl,  { bg })                  ; cx2+=ECW
    cell(doc, cx2, y, EPW, ERH, (pesos[pk]||0).toFixed(2), { align:'center', bg }) ; cx2+=EPW
    provs.forEach((_, i) => {
      const puntaje   = score[scoreKeys[ci]]?.[i] ?? 0
      const resultado = puntaje * (pesos[pk]||0)
      const isWinner  = i === score.ganadorIdx
      cell(doc, cx2, y, EPVW, ERH, fmtN(puntaje,2), { align:'right', bg }) ; cx2+=EPVW
      cell(doc, cx2, y, EPVW, ERH, fmtN(resultado,4), {
        align:'right', bg: isWinner ? [230,255,235] : bg, color: isWinner ? GRN : NK, bold: isWinner
      }) ; cx2+=EPVW
    })
    y += ERH
  })

  // Total ponderado
  cx2 = ML
  rect(doc, cx2, y, ELW+ECW+EPW, ERH, [230,235,245], LGR)
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BL)
  doc.text('TOTAL PONDERADO', ML+ELW+ECW+EPW-1.5, y+ERH/2+1.5, { align:'right' })
  cx2 += ELW+ECW+EPW
  provs.forEach((_, i) => {
    const r = score.resultados[i]
    cell(doc, cx2, y, EPVW, ERH, '', {}) ; cx2+=EPVW
    cell(doc, cx2, y, EPVW, ERH, fmtN(r,4), {
      align:'right',
      bg:    i===score.ganadorIdx ? [210,245,215] : [230,235,245],
      color: i===score.ganadorIdx ? GRN : NK,
      bold:  i===score.ganadorIdx
    }) ; cx2+=EPVW
  })
  y += ERH + 4

  /* ── Resultado final ─────────────────────────────────────── */
  rect(doc, ML, y, W, 5.5, [20,100,60], null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('RESULTADO FINAL', ML+2, y+3.5)
  y += 5.5

  // Table: Proveedor | % Final | Ganador?
  const RFW1 = 70; const RFW2 = 30; const RFW3 = W - RFW1 - RFW2
  hdr(doc, ML,          y, RFW1, 6, BL, 'PROVEEDOR',        6.5)
  hdr(doc, ML+RFW1,     y, RFW2, 6, BL, '% FINAL',          6.5)
  hdr(doc, ML+RFW1+RFW2,y, RFW3, 6, BL, 'RESULTADO',        6.5)
  y += 6
  provs.forEach((p, i) => {
    const isW = i === score.ganadorIdx
    cell(doc, ML,           y, RFW1, 7, p.alias||`PROV.${i+1}`, { bold:isW, color:isW?GRN:NK, bg: isW?[230,255,235]:null })
    cell(doc, ML+RFW1,      y, RFW2, 7, fmtP(score.resultados[i]), { align:'center', bold:isW, color:isW?GRN:NK, bg: isW?[230,255,235]:null })
    cell(doc, ML+RFW1+RFW2, y, RFW3, 7, isW ? '🏆 GANADOR' : '', { align:'center', color:GRN, bold:true, bg: isW?[230,255,235]:null })
    y += 7
  })
  y += 4

  /* ── Comentarios ─────────────────────────────────────────── */
  if (cot.comentarios) {
    rect(doc, ML, y, W, 5, [240,244,248], LGR)
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(...BL)
    doc.text('COMENTARIOS / OBSERVACIONES:', ML+1.5, y+3)
    y += 5
    rect(doc, ML, y, W, 8, WHT, LGR)
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...NK)
    const lines = doc.splitTextToSize(cot.comentarios, W-3)
    doc.text(lines.slice(0,2), ML+1.5, y+3)
    y += 8 + 3
  }

  /* ── Aprobaciones ────────────────────────────────────────── */
  if (y > PH - 35) { doc.addPage(); y = 8 }

  rect(doc, ML, y, W, 5, BL, null)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...WHT)
  doc.text('APROBACIONES', ML+2, y+3.2)
  y += 5

  const apCols = [45, 65, 60, 30]
  const apHdrs = ['RESPONSABLE','CARGO','NOMBRE Y APELLIDOS','FECHA']
  cx2 = ML
  apHdrs.forEach((h, i) => {
    hdr(doc, cx2, y, apCols[i], 5.5, [50,90,140], h, 6)
    cx2 += apCols[i]
  })
  y += 5.5

  const apRows = cot.aprobaciones || [
    { responsable:'ELABORADO POR:',           cargo:'Cord. Logística y Compras', nombre:'', fecha:'' },
    { responsable:'REVISADO Y APROBADO POR:', cargo:'Administración',             nombre:'', fecha:'' },
    { responsable:'REVISADO Y APROBADO POR:', cargo:'Gerencia Administrativa',    nombre:'', fecha:'' },
  ]
  apRows.forEach(ap => {
    cx2 = ML
    const vals = [ap.responsable, ap.cargo, ap.nombre, ap.fecha]
    vals.forEach((v, i) => {
      cell(doc, cx2, y, apCols[i], 7, v, { fs:6 })
      cx2 += apCols[i]
    })
    y += 7
  })

  // Page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(...GR)
    doc.text(`Página ${i} de ${totalPages}`, PW - MR - 1, PH - 3, { align:'right' })
    doc.text('SIG-FO-107 | GIVAMIC — Sistema de Gestión', ML, PH - 3)
  }

  doc.save(`${cot.numero || 'COT'}_Cuadro_Comparativo.pdf`)
}

/* ── calcScore (internal) ────────────────────────────────── */
function buildScore(provs, items, pesos) {
  const totales = provs.map((_, pi) =>
    items.reduce((s, it) => s + Number(it.precios[pi]||0) * Number(it.cant||0), 0)
  )
  const valid = totales.filter(t => t > 0)
  const minT  = valid.length ? Math.min(...valid) : 0

  const pPrecio = totales.map(t => (t>0&&minT>0) ? (minT/t)*100 : 0)
  const pSST    = provs.map(p => p.cumpleSST==='Si' ? 100 : 0)
  const pEsp    = provs.map(p => p.cumpleEsp==='Si' ? 100 : 0)
  const pPago   = provs.map(p => p.formaPago==='Crédito' ? 100 : 0)
  const plazos  = provs.map(p => Number(p.plazoEntrega||0))
  const minP    = Math.min(...plazos.filter(p=>p>0).concat(Infinity))
  const pPlazo  = plazos.map(p => (p>0&&isFinite(minP)) ? (minP/p)*100 : 0)
  const pCond   = provs.map(p => p.condicion==='HABITUAL' ? 100 : 0)

  const resultados = provs.map((_,i) =>
    pPrecio[i]*(pesos.precio||0) + pSST[i]*(pesos.sst||0) +
    pEsp[i]*(pesos.espTecnica||0) + pPago[i]*(pesos.formaPago||0) +
    pPlazo[i]*(pesos.plazoEntrega||0) + pCond[i]*(pesos.condicion||0)
  )
  const maxR = Math.max(...resultados)
  const ganadorIdx = resultados.findIndex(r => r === maxR)
  return { totales, minT, pPrecio, pSST, pEsp, pPago, pPlazo, pCond, resultados, ganadorIdx }
}
