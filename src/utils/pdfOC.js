import jsPDF from 'jspdf'
import { fmtDatePDF } from './helpers'

// ── Paleta ──────────────────────────────────────────────────
const AZ  = [0, 84, 166]      // Azul corporativo (bandas)
const NK  = [0, 0, 0]
const BL  = [255, 255, 255]
const GR  = [248, 249, 252]   // Gris fila alterna
const BD  = [160, 160, 160]   // Borde gris

// ── Monto en letras (español) ────────────────────────────────
function montoLetras(n) {
  const u = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISIETE','DIECIOCHO','DIECINUEVE']
  const d = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA']
  const c = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS']
  const int = Math.floor(n || 0)
  const cts = Math.round(((n || 0) - int) * 100)
  function m3(x) {
    if (!x) return ''
    if (x === 100) return 'CIEN'
    let r = x >= 100 ? c[Math.floor(x/100)] + ' ' : ''; x %= 100
    if (x >= 20) { r += d[Math.floor(x/10)]; if (x%10) r += ' Y ' + u[x%10] }
    else if (x > 0) r += u[x]
    return r.trim()
  }
  if (!int) return `CERO CON ${String(cts).padStart(2,'0')}/100 SOLES`
  let r = ''
  if (int >= 1000000) { const m = Math.floor(int/1000000); r += (m===1?'UN MILLON':m3(m)+' MILLONES')+' ' }
  if (int >= 1000) { const k = Math.floor((int%1000000)/1000); if(k) r+=(k===1?'MIL':m3(k)+' MIL')+' ' }
  if (int%1000) r += m3(int%1000)
  return r.trim() + ` CON ${String(cts).padStart(2,'0')}/100 SOLES`
}

function fmtS(n) { return `S/ ${(+(n)||0).toFixed(2).replace('.',',')}` }

// ── Primitivos de dibujo ─────────────────────────────────────
function borde(doc, x, y, w, h) {
  doc.setDrawColor(...BD); doc.setLineWidth(0.2); doc.rect(x, y, w, h)
}

function banda(doc, x, y, w, h, txt) {
  doc.setFillColor(...AZ); doc.rect(x, y, w, h, 'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...BL)
  doc.text(txt.toUpperCase(), x+w/2, y+h/2+1.5, {align:'center'})
}

// Celda con etiqueta bold pequeña a la izquierda y valor a la derecha
function lv(doc, x, y, w, h, lbl, val, opt={}) {
  const { fs=7.5, bold=false, lblW=0, bg=null, center=false } = opt
  if (bg) { doc.setFillColor(...bg); doc.rect(x, y, w, h, 'F') }
  borde(doc, x, y, w, h)
  const LW = lblW || (lbl ? Math.min(doc.getTextWidth(lbl+'  '), w*0.45) : 0)
  if (lbl) {
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NK)
    doc.text(String(lbl), x+1.5, y+h/2+1.3)
  }
  doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(fs); doc.setTextColor(...NK)
  const vx = lbl ? x+LW+1 : x+1.5
  const vw = lbl ? w-LW-2.5 : w-3
  const vy = y+h/2+1.3
  if (center) doc.text(String(val??''), x+w/2, vy, {align:'center', maxWidth:vw})
  else doc.text(String(val??''), vx, vy, {align:'left', maxWidth:vw})
}

// Texto multilínea en celda
function txtCell(doc, x, y, w, h, text, fs=6.5) {
  borde(doc, x, y, w, h)
  if (!text) return
  doc.setFont('helvetica','normal'); doc.setFontSize(fs); doc.setTextColor(...NK)
  const lh = fs*0.38+0.5
  const lines = doc.splitTextToSize(String(text), w-3)
  let cy = y+3.8
  for (const ln of lines) { if (cy+lh > y+h) break; doc.text(ln, x+1.5, cy); cy+=lh }
}

// ── GENERADOR PDF ────────────────────────────────────────────
export function generarPDFOC(oc, empresa, proveedor, logo) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const MG=7, CW=196
  let y = MG
  const x = MG

  // ╔════════════════════════════════════════════════════════╗
  // ║                      ENCABEZADO                       ║
  // ╚════════════════════════════════════════════════════════╝
  const HDR=22, LW=35, MW=100, RW=61
  const fechaStr = fmtDatePDF(oc.fecha) || ''
  const numStr   = oc.numero || ''

  // Bloque izquierdo: logo
  borde(doc, x, y, LW, HDR)
  if (logo) {
    try { doc.addImage(logo, 'PNG', x+10, y+1.5, 15, 19) } catch {}
  } else {
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...AZ)
    doc.text('GIVAMIC', x+LW/2, y+HDR/2+1, {align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(80,80,80)
    doc.text('Empresa Integral', x+LW/2, y+HDR/2+6, {align:'center'})
  }

  // Bloque central: nombre empresa
  borde(doc, x+LW, y, MW, HDR)
  const empNombre = empresa?.razonSocial || 'GIVAMIC INVERSIONES S.A.C.'
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...AZ)
  doc.text(empNombre, x+LW+MW/2, y+HDR/2+2, {align:'center', maxWidth:MW-4})

  // Bloque derecho: ORDEN DE COMPRA / N° / Fecha
  const rx = x+LW+MW
  doc.setFillColor(...AZ); doc.rect(rx, y, RW, 8, 'F')
  borde(doc, rx, y, RW, 8)
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...BL)
  doc.text('ORDEN DE COMPRA', rx+RW/2, y+5.5, {align:'center'})
  // N°
  borde(doc, rx, y+8, RW, 7)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NK)
  doc.text('N°:', rx+2, y+13)
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...AZ)
  doc.text(numStr, rx+RW-2, y+13, {align:'right'})
  // Fecha
  borde(doc, rx, y+15, RW, 7)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NK)
  doc.text('Fecha:', rx+2, y+20)
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...NK)
  doc.text(fechaStr, rx+RW-2, y+20, {align:'right'})
  y += HDR

  // ─── Info empresa: 3 filas izquierda (135mm) + cuadro gris derecha (61mm) ────
  const H6 = 6, LFT = 135, RGT = 61
  const noteX = x + LFT

  // Fila 1: RUC(67.5) | Teléfono(67.5)
  lv(doc, x,       y,       LFT/2, H6, 'RUC:',      empresa?.ruc||'',                {fs:7.5, lblW:14})
  lv(doc, x+LFT/2, y,       LFT/2, H6, 'Teléfono:', empresa?.telefono||'',           {fs:7.5, lblW:22})
  // Fila 2: Dirección (ancho completo 135mm)
  lv(doc, x,       y+H6,    LFT,   H6, 'Dirección:', empresa?.domicilio||'',         {fs:7.5, lblW:24})
  // Fila 3: Correo (ancho completo 135mm) — dibujado manualmente para evitar overflow
  {
    const cy = y + H6 * 2
    const vy = cy + H6 / 2 + 1.3
    const lblW = 20
    borde(doc, x, cy, LFT, H6)
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NK)
    doc.text('Correo:', x + 1.5, vy)
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...NK)
    const correoStr = empresa?.correoElectronico || ''
    const correoAvail = LFT - lblW - 3
    const correoLines = doc.splitTextToSize(correoStr, correoAvail)
    doc.text(correoLines[0] || '', x + lblW + 1, vy)
  }

  // Cuadro gris (nota legal) spanning 3 filas = 18mm
  const noteH = H6 * 3
  doc.setFillColor(220, 220, 220); doc.rect(noteX, y, RGT, noteH, 'F')
  borde(doc, noteX, y, RGT, noteH)
  const noteTxt = 'El N° de la Orden de Compra deberá ser incluido en la factura, guía, conformidad y demás documentación de entrega.'
  doc.setFont('helvetica','normal'); doc.setFontSize(5.8); doc.setTextColor(30,30,30)
  const noteLines = doc.splitTextToSize(noteTxt, RGT-3)
  let ny = y+3.5
  noteLines.forEach(ln => { if(ny < y+noteH-1){ doc.text(ln, noteX+1.5, ny); ny+=2.7 } })
  doc.setTextColor(...NK)

  y += noteH

  // ╔════════════════════════════════════════════════════════╗
  // ║                  DATOS DE LA ORDEN                    ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'DATOS DE LA ORDEN'); y+=5.5

  // Fila 1: Tipo(65) | Req./Pedido N°(65) | Fecha entrega(66)
  lv(doc, x,    y, 65, 6.5, 'Tipo:', oc.tipo||'Compra', {fs:7.5, lblW:14})
  lv(doc, x+65, y, 65, 6.5, 'Req. / Pedido N°:', oc.numeroReqInterno||'', {fs:7.5, lblW:38})
  lv(doc, x+130,y, 66, 6.5, 'Fecha entrega:', oc.fechaEntregaEsperada ? fmtDatePDF(oc.fechaEntregaEsperada) : '', {fs:7.5, lblW:32})
  y+=6.5

  // Fila 2: Moneda(65) | Forma de pago(65) | Condición de entrega(66)
  lv(doc, x,    y, 65, 6.5, 'Moneda:', oc.moneda||'Soles (PEN)', {fs:7.5, lblW:18})
  lv(doc, x+65, y, 65, 6.5, 'Forma de pago:', oc.formaPagoOC||'', {fs:7.5, lblW:32})
  lv(doc, x+130,y, 66, 6.5, 'Condición de entrega:', oc.tiempoEntrega||'', {fs:7.5, lblW:48})
  y+=6.5

  // Fila 3: Lugar de entrega (full)
  lv(doc, x, y, CW, 7, 'Lugar de entrega:', oc.lugarEntrega||'', {fs:7.5, lblW:36})
  y+=7

  // ╔════════════════════════════════════════════════════════╗
  // ║                 DATOS DEL PROVEEDOR                   ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'DATOS DEL PROVEEDOR'); y+=5.5

  lv(doc, x,    y, 98, 6.5, 'Proveedor:', proveedor?.nombre||'', {fs:7.5, lblW:24})
  lv(doc, x+98, y, 98, 6.5, 'RUC:', proveedor?.ruc||'', {fs:7.5, lblW:14})
  y+=6.5
  lv(doc, x,    y, 98, 6.5, 'Dirección:', proveedor?.domicilio||proveedor?.direccion||'', {fs:7.5, lblW:24})
  lv(doc, x+98, y, 98, 6.5, 'Contacto:', proveedor?.contacto||'', {fs:7.5, lblW:22})
  y+=6.5
  lv(doc, x,    y, 98, 6.5, 'Teléfono:', proveedor?.telefono||'', {fs:7.5, lblW:22})
  lv(doc, x+98, y, 98, 6.5, 'Condición:', oc.condicionProveedor||'', {fs:7.5, lblW:24})
  y+=6.5
  lv(doc, x,    y, 98, 6.5, 'N° Cuenta:', proveedor?.noCuenta||'', {fs:7.5, lblW:24})
  lv(doc, x+98, y, 98, 6.5, 'CCI:', proveedor?.ciCci||'', {fs:7.5, lblW:14})
  y+=6.5

  // ╔════════════════════════════════════════════════════════╗
  // ║                   TABLA DE ÍTEMS                      ║
  // ╚════════════════════════════════════════════════════════╝
  // Anchos: N°(8) | Código(22) | Descripción(82) | Und(16) | Cant(18) | V.Unit(25) | V.Total(25)
  const TC = [8, 22, 82, 16, 18, 25, 25]
  const TH = ['N°', 'Código', 'Descripción del producto o servicio', 'Und.', 'Cant.', 'V. Unit.', 'V. Total']

  // Header
  let hx = x
  TC.forEach((w, i) => {
    doc.setFillColor(...AZ); doc.rect(hx, y, w, 8, 'F'); borde(doc, hx, y, w, 8)
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...BL)
    const lines = doc.splitTextToSize(TH[i], w-2)
    if (lines.length===1) doc.text(lines[0], hx+w/2, y+5, {align:'center'})
    else { doc.text(lines[0], hx+w/2, y+3, {align:'center'}); doc.text(lines[1], hx+w/2, y+6.2, {align:'center'}) }
    hx += w
  })
  y += 8

  // 15 filas de ítems
  const items = oc.items || []
  const RH = 5.5
  for (let r=0; r<15; r++) {
    const it = items[r] || null
    if (r%2===1) { doc.setFillColor(...GR); doc.rect(x, y, CW, RH, 'F') }
    hx = x
    // N°
    borde(doc, hx, y, TC[0], RH)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...NK)
    doc.text(String(r+1), hx+TC[0]/2, y+3.6, {align:'center'})
    hx+=TC[0]
    // Código
    borde(doc, hx, y, TC[1], RH)
    if (it) { doc.setFontSize(6.5); doc.text(String(it.codigo||''), hx+1, y+3.6, {maxWidth:TC[1]-2}) }
    hx+=TC[1]
    // Descripción
    borde(doc, hx, y, TC[2], RH)
    if (it) { doc.setFontSize(6.5); doc.text(String(it.descripcion||'').substring(0,65), hx+1, y+3.6, {maxWidth:TC[2]-2}) }
    hx+=TC[2]
    // Und
    borde(doc, hx, y, TC[3], RH)
    if (it) { doc.setFontSize(6.5); doc.text(String(it.unidad||''), hx+TC[3]/2, y+3.6, {align:'center'}) }
    hx+=TC[3]
    // Cant
    borde(doc, hx, y, TC[4], RH)
    if (it) { doc.setFontSize(7); doc.text(String(it.cantidad??''), hx+TC[4]/2, y+3.6, {align:'center'}) }
    hx+=TC[4]
    // V. Unit
    borde(doc, hx, y, TC[5], RH)
    doc.setFontSize(7)
    if (it) doc.text(fmtS(it.precioUnit), hx+TC[5]-1.5, y+3.6, {align:'right'})
    else { doc.setTextColor(140,140,140); doc.text('S/ 0,00', hx+TC[5]-1.5, y+3.6, {align:'right'}); doc.setTextColor(...NK) }
    hx+=TC[5]
    // V. Total
    borde(doc, hx, y, TC[6], RH)
    if (it) doc.text(fmtS(it.total||(it.cantidad*it.precioUnit)), hx+TC[6]-1.5, y+3.6, {align:'right'})
    else { doc.setTextColor(140,140,140); doc.text('S/ 0,00', hx+TC[6]-1.5, y+3.6, {align:'right'}); doc.setTextColor(...NK) }
    y += RH
  }

  // ─── Totales ─────────────────────────────────────────────
  const totalNeto    = oc.totalNeto    || 0
  const totalIGV     = oc.totalIGV     || 0
  const totalGeneral = oc.totalGeneral || 0
  const SON_W = TC[0]+TC[1]+TC[2]+TC[3]+TC[4]  // 146mm (izquierda)
  const TOT_W = TC[5]+TC[6]                     // 50mm  (derecha)
  const TX = x + SON_W

  // SON + #NOMBRE? celdas apiladas (3 filas × 3mm = 9mm)
  borde(doc, x, y, SON_W, 9)
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NK)
  doc.text('SON:', x+1.5, y+3.2)
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5)
  doc.text(montoLetras(totalGeneral), x+14, y+3.2, {maxWidth:SON_W-16})

  borde(doc, x, y+5.5, SON_W, 3.5)
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(80,80,80)
  doc.text(`(${fmtS(totalGeneral)})`, x+1.5, y+8.3)

  // Subtotal / IGV / TOTAL (3 filas en columna derecha)
  const totRows = [
    ['Subtotal:', fmtS(totalNeto)],
    ['IGV 18%:', fmtS(totalIGV)],
    ['TOTAL:', fmtS(totalGeneral)],
  ]
  totRows.forEach(([lb, vl], i) => {
    borde(doc, TX, y+i*3, TOT_W, 3)
    doc.setFont('helvetica', i===2?'bold':'normal'); doc.setFontSize(7); doc.setTextColor(...NK)
    doc.text(lb, TX+1.5, y+i*3+2.2)
    doc.setFont('helvetica','bold'); doc.setFontSize(i===2?7.5:7)
    doc.setTextColor(...(i===2 ? AZ : NK))
    doc.text(vl, TX+TOT_W-1.5, y+i*3+2.2, {align:'right'})
  })
  doc.setTextColor(...NK)
  y += 9

  // ╔════════════════════════════════════════════════════════╗
  // ║          OBSERVACIONES / CONDICIONES COMERCIALES      ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'OBSERVACIONES / CONDICIONES COMERCIALES'); y+=5.5

  const obsW = CW*0.55, docW = CW*0.45
  // Left: observaciones
  borde(doc, x, y, obsW, 16)
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
  doc.text('Observaciones:', x+1.5, y+4)
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5)
  const obsLines = doc.splitTextToSize(oc.comentarios||oc.observaciones||'', obsW-3)
  let oy = y+8
  obsLines.forEach(ln => { if(oy<y+15){ doc.text(ln, x+1.5, oy); oy+=3.5 } })

  // Right: documentación obligatoria
  borde(doc, x+obsW, y, docW, 16)
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
  doc.text('Documentación obligatoria:', x+obsW+1.5, y+4)
  const docTxt = 'Factura, guía, certificados, garantía, MSDS o sustento técnico cuando aplique.'
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5)
  const docLines = doc.splitTextToSize(docTxt, docW-3)
  let dy = y+8
  docLines.forEach(ln => { if(dy<y+15){ doc.text(ln, x+obsW+1.5, dy); dy+=3.5 } })
  y+=16

  // ╔════════════════════════════════════════════════════════╗
  // ║              CLÁUSULAS SIG APLICABLES                 ║
  // ╚════════════════════════════════════════════════════════╝
  banda(doc, x, y, CW, 5.5, 'CLÁUSULAS SIG APLICABLES'); y+=5.5
  const sigTxt = 'La aceptación de la presente Orden implica que el proveedor se compromete a cumplir los requisitos técnicos, de Calidad, Seguridad y Salud en el Trabajo, Medio Ambiente, Integridad y Antisoborno aplicables. La Empresa podrá verificar la entrega, conformidad del servicio, documentación y cumplimiento de los requisitos establecidos. El proveedor declara actuar conforme a principios de integridad y ética, quedando prohibida cualquier práctica indebida o acto de soborno vinculado a la presente orden.'
  borde(doc, x, y, CW, 12)
  doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...NK)
  const sigLines = doc.splitTextToSize(sigTxt, CW-3)
  let sy = y+3.5
  sigLines.forEach(ln => { if(sy<y+11.5){ doc.text(ln, x+1.5, sy); sy+=3.2 } })
  y+=12

  // ╔════════════════════════════════════════════════════════╗
  // ║              ELABORADO POR  |  APROBADO POR           ║
  // ╚════════════════════════════════════════════════════════╝
  const HCW = (CW-1)/2
  banda(doc, x, y, HCW, 5.5, 'ELABORADO POR')
  banda(doc, x+HCW+1, y, HCW, 5.5, 'APROBADO POR')
  y+=5.5

  lv(doc, x,        y, HCW, 6.5, 'Nombre:', oc.elaboradoPor||'', {fs:7.5, lblW:20})
  lv(doc, x+HCW+1,  y, HCW, 6.5, 'Nombre:', oc.revisadoPor||'', {fs:7.5, lblW:20})
  y+=6.5
  lv(doc, x,        y, HCW, 6.5, 'Cargo:', oc.cargoElaborado||'', {fs:7.5, lblW:16})
  lv(doc, x+HCW+1,  y, HCW, 6.5, 'Cargo:', oc.cargoRevisado||'', {fs:7.5, lblW:16})
  y+=6.5
  // Firma (espacio)
  borde(doc, x, y, HCW, 20)
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...NK)
  doc.text('Firma:', x+2, y+4)
  borde(doc, x+HCW+1, y, HCW, 20)
  doc.text('Firma:', x+HCW+3, y+4)

  // ── Guardar ──────────────────────────────────────────────
  doc.save(`${oc.numero || 'OC'}.pdf`)
}
