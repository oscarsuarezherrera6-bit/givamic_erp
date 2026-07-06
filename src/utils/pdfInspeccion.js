import jsPDF from 'jspdf'
import { fmtDatePDF } from './helpers'

const AZ  = [0, 84, 166]
const NK  = [0, 0, 0]
const BL  = [255, 255, 255]
const GR  = [248, 249, 252]
const BD  = [160, 160, 160]

function borde(doc, x, y, w, h) {
  doc.setDrawColor(...BD); doc.setLineWidth(0.2); doc.rect(x, y, w, h)
}

function banda(doc, x, y, w, h, txt) {
  doc.setFillColor(...AZ); doc.rect(x, y, w, h, 'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...BL)
  doc.text(txt.toUpperCase(), x+w/2, y+h/2+1.5, {align:'center'})
}

// ── GENERADOR PDF SIG-FO-024 ─────────────────────────────────
export function generarPDFInspeccion(conf, oc, proveedor, logo) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const MG = 7, CW = 196
  let y = MG
  const x = MG

  // ╔════════════════════════════════════════════════════════╗
  // ║                      ENCABEZADO                       ║
  // ╚════════════════════════════════════════════════════════╝
  const HDR_H = 24
  const LOGO_W = 40
  const RGT_W  = 46
  const MID_W  = CW - LOGO_W - RGT_W  // 110mm

  // Bloque logo (span 24mm)
  borde(doc, x, y, LOGO_W, HDR_H)
  if (logo) {
    try { doc.addImage(logo, 'PNG', x+12.1, y+2, 15.8, 20) } catch {}
  } else {
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...AZ)
    doc.text('GIVAMIC', x+LOGO_W/2, y+HDR_H/2+1, {align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(80,80,80)
    doc.text('Limpieza Integral', x+LOGO_W/2, y+HDR_H/2+5.5, {align:'center'})
  }

  // Bloque central fila 1: SISTEMA INTEGRADO DE GESTIÓN
  borde(doc, x+LOGO_W, y, MID_W, HDR_H/2)
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...NK)
  doc.text('SISTEMA INTEGRADO DE GESTIÓN', x+LOGO_W+MID_W/2, y+6.5, {align:'center'})

  // Bloque central fila 2: INSPECCIÓN DE PRODUCTO COMPRADO-RECIBIDO
  borde(doc, x+LOGO_W, y+HDR_H/2, MID_W, HDR_H/2)
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...NK)
  doc.text('INSPECCIÓN DE PRODUCTO COMPRADO-RECIBIDO', x+LOGO_W+MID_W/2, y+HDR_H/2+6.5, {align:'center'})

  // Bloque derecho: 3 filas (CODIGO / VERSION / FECHA)
  const RX    = x + LOGO_W + MID_W
  const ROW_H = HDR_H / 3   // 8mm
  const LW    = RGT_W * 0.48
  const VW    = RGT_W - LW

  ;[['CODIGO:', 'SIG-FO-024'],['VERSION:', '001'],['FECHA:', '10-jun-26']].forEach(([lbl,val],i) => {
    const ry = y + i * ROW_H
    doc.setFillColor(230,230,230); doc.rect(RX, ry, LW, ROW_H, 'F')
    borde(doc, RX, ry, LW, ROW_H)
    borde(doc, RX+LW, ry, VW, ROW_H)
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
    doc.text(lbl, RX+2, ry+ROW_H/2+1.3)
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...NK)
    doc.text(val, RX+LW+VW/2, ry+ROW_H/2+1.3, {align:'center'})
  })
  y += HDR_H

  // ╔════════════════════════════════════════════════════════╗
  // ║       PROVEEDOR | RUC | N° DE OC | FECHA RECEPCIÓN    ║
  // ╚════════════════════════════════════════════════════════╝
  const INFO_LBL_H = 5, INFO_VAL_H = 6
  const C_PROV = 62, C_RUC = 46, C_OC = 44, C_FECHA = CW - C_PROV - C_RUC - C_OC

  const infoCols = [
    { lbl: 'PROVEEDOR',         val: proveedor?.nombre||'',     w: C_PROV  },
    { lbl: 'RUC',               val: proveedor?.ruc||'',        w: C_RUC   },
    { lbl: 'N° DE OC',          val: oc?.numero||'',            w: C_OC    },
    { lbl: 'FECHA DE RECEPCIÓN',val: fmtDatePDF(conf.fecha)||'',w: C_FECHA }
  ]
  let ix = x
  infoCols.forEach(col => {
    // Label header (azul)
    doc.setFillColor(...AZ); doc.rect(ix, y, col.w, INFO_LBL_H, 'F')
    borde(doc, ix, y, col.w, INFO_LBL_H)
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BL)
    doc.text(col.lbl, ix+col.w/2, y+INFO_LBL_H/2+1.3, {align:'center'})
    // Value
    borde(doc, ix, y+INFO_LBL_H, col.w, INFO_VAL_H)
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...NK)
    const vlines = doc.splitTextToSize(String(col.val), col.w-3)
    doc.text(vlines[0]||'', ix+col.w/2, y+INFO_LBL_H+INFO_VAL_H/2+1.3, {align:'center'})
    ix += col.w
  })
  y += INFO_LBL_H + INFO_VAL_H

  // ╔════════════════════════════════════════════════════════╗
  // ║               CHECKLIST 4 CRITERIOS                   ║
  // ╚════════════════════════════════════════════════════════╝
  const checks = conf.checks || ['SI','SI','SI','SI']
  const checkTexts = [
    'Producto conforme a OC/RQ/guía, en cantidad, descripción, marca/modelo, medida y unidad solicitada.',
    'Producto en buen estado físico, sin daños, faltantes, derrames, deterioro o contaminación visible.',
    'Embalaje, rotulado y presentación adecuados.',
    'Documentación mínima aplicable: Guía, comprobante, ficha técnica, garantía, MSDS, lote o vencimiento cuando corresponda.'
  ]

  const NUM_W   = 10
  const TXT_W   = 143
  const CHK_TOT = CW - NUM_W - TXT_W  // 43mm → 3 cols de ~14.3mm
  const CHK_W   = CHK_TOT / 3
  const CHK_H   = 9

  checkTexts.forEach((txt, i) => {
    const state  = checks[i] || 'SI'
    const cy     = y + i * CHK_H

    // N°
    borde(doc, x, cy, NUM_W, CHK_H)
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...NK)
    doc.text(String(i+1), x+NUM_W/2, cy+CHK_H/2+1.3, {align:'center'})

    // Texto descripción
    borde(doc, x+NUM_W, cy, TXT_W, CHK_H)
    doc.setFont('helvetica','normal'); doc.setFontSize(6.8); doc.setTextColor(...NK)
    const lines = doc.splitTextToSize(txt, TXT_W-3)
    const lh = 3.0
    const startY = cy + (CHK_H - lines.length*lh)/2 + lh
    lines.forEach((ln, li) => doc.text(ln, x+NUM_W+2, startY+li*lh))

    // SI / NO / NA
    ;['SI','NO','NA'].forEach((opt, j) => {
      const cx = x + NUM_W + TXT_W + j * CHK_W
      borde(doc, cx, cy, CHK_W, CHK_H)
      // Label
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
      doc.text(opt, cx+CHK_W/2, cy+3.5, {align:'center'})
      // Caja
      const bs = 3.5
      const bx = cx + CHK_W/2 - bs/2
      const by = cy + CHK_H - bs - 1
      doc.setDrawColor(...BD); doc.setLineWidth(0.3)
      doc.rect(bx, by, bs, bs)
      // Marca si está seleccionado
      if (state === opt) {
        doc.setLineWidth(0.4); doc.setDrawColor(0,0,0)
        doc.line(bx+0.5, by+0.5, bx+bs-0.5, by+bs-0.5)
        doc.line(bx+bs-0.5, by+0.5, bx+0.5, by+bs-0.5)
        doc.setLineWidth(0.2)
      }
    })
  })
  y += 4 * CHK_H

  // ╔════════════════════════════════════════════════════════╗
  // ║       TABLA PRODUCTOS OBSERVADOS (10 filas)           ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'SOLO LLENAR SI HAY OBSERVACIÓN / NO CONFORMIDAD')
  y += 5.5

  const OC = [10, 40, 58, 42, 26, 20]  // N° | PROD OBS | PROBLEMA | ACCIÓN INM | FECHA COMP | ESTADO
  const OL = ['N°','PRODUCTO\nOBSERVADO','PROBLEMA','ACCIÓN\nINMEDIATA','FECHA\nCOMPROMISO','ESTADO']

  let ohx = x
  OC.forEach((w, i) => {
    doc.setFillColor(...AZ); doc.rect(ohx, y, w, 7, 'F')
    borde(doc, ohx, y, w, 7)
    doc.setFont('helvetica','bold'); doc.setFontSize(5.8); doc.setTextColor(...BL)
    const ls = OL[i].split('\n')
    if (ls.length===1) doc.text(ls[0], ohx+w/2, y+4.5, {align:'center'})
    else { doc.text(ls[0], ohx+w/2, y+3, {align:'center'}); doc.text(ls[1], ohx+w/2, y+5.8, {align:'center'}) }
    ohx += w
  })
  y += 7

  const obsItems = (conf.items||[]).filter(it => it.estado !== 'Conforme')
  const OR_H = 12

  for (let r=0; r<10; r++) {
    const it = obsItems[r] || null
    if (r%2===1) { doc.setFillColor(...GR); doc.rect(x, y, CW, OR_H, 'F') }
    ohx = x
    OC.forEach((w, ci) => {
      borde(doc, ohx, y, w, OR_H)
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...NK)
      if (ci === 0) {
        doc.text(String(r+1), ohx+w/2, y+OR_H/2+1.3, {align:'center'})
      } else if (it) {
        let val = ''
        if (ci === 1) val = it.descripcion||''
        if (ci === 2) val = it.observacion||''
        if (ci === 3) val = it.accionInmediata||''
        if (ci === 4) val = it.fechaCompromiso ? fmtDatePDF(it.fechaCompromiso) : ''
        if (ci === 5) val = it.estadoAccion||''
        if (val) {
          const ls = doc.splitTextToSize(val, w-3)
          const lh = 3.0
          const sy = y + (OR_H - Math.min(ls.length,3)*lh)/2 + lh
          ls.slice(0,3).forEach((ln,li) => doc.text(ln, ohx+1.5, sy+li*lh))
        }
      }
      ohx += w
    })
    y += OR_H
  }

  // ╔════════════════════════════════════════════════════════╗
  // ║              COMENTARIOS / OBSERVACIONES              ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'COMENTARIOS / OBSERVACIONES')
  y += 5.5
  borde(doc, x, y, CW, 22)
  if (conf.observacionesGenerales) {
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...NK)
    const ls = doc.splitTextToSize(conf.observacionesGenerales, CW-4)
    let oy = y+5
    ls.forEach(ln => { if(oy<y+21){ doc.text(ln, x+2, oy); oy+=3.5 } })
  }
  y += 22

  // ╔════════════════════════════════════════════════════════╗
  // ║                FIRMAS / CONFORMIDAD                   ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'FIRMAS / CONFORMIDAD')
  y += 5.5

  const FC = [40, 68, 52, CW-40-68-52]  // RESPONSABLE | APELLIDOS Y NOMBRES | CARGO | FIRMA
  const FL = ['RESPONSABLE','APELLIDOS Y NOMBRES','CARGO','FIRMA']

  let fx = x
  FC.forEach((w,i) => {
    doc.setFillColor(230,230,230); doc.rect(fx, y, w, 6, 'F')
    borde(doc, fx, y, w, 6)
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
    doc.text(FL[i], fx+w/2, y+4, {align:'center'})
    fx += w
  })
  y += 6

  // Fila datos: RESPONSABLE DE LA INSPECCIÓN
  fx = x
  const firmVals = ['RESPONSABLE DE\nLA INSPECCIÓN', conf.inspeccionadoPor||'', '', '']
  FC.forEach((w,i) => {
    borde(doc, fx, y, w, 22)
    doc.setFont('helvetica', i===0?'bold':'normal'); doc.setFontSize(7); doc.setTextColor(...NK)
    if (firmVals[i]) {
      const ls = firmVals[i].split('\n')
      ls.forEach((ln,li) => doc.text(ln, fx+w/2, y+6+li*4, {align:'center'}))
    }
    fx += w
  })

  doc.save(`INSPECCION-${conf.numero||'DOC'}.pdf`)
}
