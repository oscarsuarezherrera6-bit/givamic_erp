import * as pdfjsLib from 'pdfjs-dist'

// Worker deshabilitado — funciona en desktop y móvil sin depender del worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

/**
 * Extrae texto de un PDF y lo convierte en un objeto con datos de factura.
 * Soporta facturas electrónicas peruanas (SUNAT).
 */
export async function extraerDatosFactura(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return parsearTextoFactura(fullText)
}

function parsearTextoFactura(text) {
  const result = {
    numero: '',
    rucProveedor: '',
    nombreProveedor: '',
    fecha: '',
    items: [],
    textoCompleto: text,
  }

  // ── Número de factura ──────────────────────────────────────────
  // Patrones: F001-00001, E001-1, 0001-00001234
  const numMatch = text.match(/\b([FE]\d{3}-\d{1,8}|\d{4}-\d{4,8})\b/i)
  if (numMatch) result.numero = numMatch[1].toUpperCase()

  // También buscar "FACTURA ELECTRÓNICA N°" o "SERIE"
  const serieMatch = text.match(/(?:SERIE|N[°º]?)[:\s]+([A-Z]\d{3})[- ]+(\d+)/i)
  if (serieMatch && !result.numero) result.numero = `${serieMatch[1]}-${serieMatch[2]}`

  // ── RUC del emisor ─────────────────────────────────────────────
  const rucMatch = text.match(/R\.?U\.?C\.?[:\s]+(\d{11})/i)
  if (rucMatch) result.rucProveedor = rucMatch[1]

  // ── Nombre del proveedor ───────────────────────────────────────
  // Suele estar antes del RUC o en línea "Razón Social"
  const razonMatch = text.match(/(?:RAZ[OÓ]N SOCIAL|EMPRESA|EMISOR)[:\s]+([^\n\r]{5,60})/i)
  if (razonMatch) {
    result.nombreProveedor = razonMatch[1].trim().replace(/\s+/g, ' ')
  } else {
    // Primera línea no vacía que no sea "FACTURA" suele ser el nombre
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
    const nameCandidate = lines.find(l =>
      l.length > 5 && l.length < 80 &&
      !/FACTURA|BOLETA|TICKET|RUC|FECHA|SUNAT/i.test(l) &&
      /[A-ZÁÉÍÓÚ]{3,}/i.test(l)
    )
    if (nameCandidate) result.nombreProveedor = nameCandidate
  }

  // ── Fecha ──────────────────────────────────────────────────────
  // dd/mm/yyyy o dd-mm-yyyy o yyyy-mm-dd
  const fechaMatch = text.match(
    /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b|\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b/
  )
  if (fechaMatch) {
    if (fechaMatch[4]) {
      result.fecha = `${fechaMatch[4]}-${fechaMatch[5]}-${fechaMatch[6]}`
    } else {
      result.fecha = `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`
    }
  }

  // ── Ítems ──────────────────────────────────────────────────────
  // Buscar líneas con: descripción + cantidad + precio unitario + total
  // Patrón típico en facturas peruanas:
  // "Detergente 5kg  10  UND  28.50  285.00"
  const lineas = text.split(/[\n\r]+/)
  lineas.forEach(linea => {
    // Buscar línea con al menos dos números (cantidad y precio)
    const itemMatch = linea.match(
      /^(.{5,50?}?)\s+(\d+(?:[.,]\d+)?)\s+([A-Z]{2,4})?\s+(\d+(?:[.,]\d{1,2})?)\s+(\d+(?:[.,]\d{1,2})?)?\s*$/
    )
    if (itemMatch) {
      const desc = itemMatch[1].trim()
      const cant = parseFloat(itemMatch[2].replace(',', '.'))
      const um = itemMatch[3] || 'UND'
      const precio = parseFloat(itemMatch[4].replace(',', '.'))

      if (cant > 0 && precio > 0 && desc.length > 3 && !/TOTAL|SUBTOTAL|IGV|DESCUENTO/i.test(desc)) {
        result.items.push({ descripcion: desc, cantidad: cant, unidad: um, precioUnit: precio })
      }
    }
  })

  return result
}

/** Convierte un File a base64 data URL */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
