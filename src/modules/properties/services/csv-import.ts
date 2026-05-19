/**
 * CSV Contact Import Adapter
 *
 * Parses a CSV file and returns structured contact data ready for import.
 * Does NOT write to the database directly — returns parsed rows for
 * the caller to validate and persist via the customers API.
 *
 * Expected CSV columns (flexible, maps common variations):
 * nombre, email, telefono, empresa, fuente, notas
 */

export type ImportedContact = {
  display_name: string
  primary_email: string | null
  primary_phone: string | null
  company_name: string | null
  source: string | null
  notes: string | null
}

export type CsvImportResult = {
  success: ImportedContact[]
  errors: Array<{ row: number; reason: string }>
  total: number
}

// Column name mappings (Spanish + English variations)
const NAME_COLUMNS = ['nombre', 'name', 'display_name', 'nombre_completo', 'contacto']
const EMAIL_COLUMNS = ['email', 'correo', 'e-mail', 'primary_email', 'correo_electronico']
const PHONE_COLUMNS = ['telefono', 'phone', 'tel', 'celular', 'movil', 'primary_phone', 'whatsapp']
const COMPANY_COLUMNS = ['empresa', 'company', 'organizacion', 'company_name']
const SOURCE_COLUMNS = ['fuente', 'source', 'origen', 'lead_source']
const NOTES_COLUMNS = ['notas', 'notes', 'observaciones', 'comentarios']

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim().replace(/[^a-z_]/g, ''))
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate)
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Parse CSV text into structured contact data.
 * Handles common separators (comma, semicolon, tab).
 */
export function parseCsvContacts(csvText: string): CsvImportResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    return { success: [], errors: [{ row: 0, reason: 'CSV vacío o sin datos' }], total: 0 }
  }

  // Detect separator
  const headerLine = lines[0]
  const separator = headerLine.includes(';') ? ';' : headerLine.includes('\t') ? '\t' : ','

  const headers = headerLine.split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''))

  // Map columns
  const nameIdx = findColumn(headers, NAME_COLUMNS)
  const emailIdx = findColumn(headers, EMAIL_COLUMNS)
  const phoneIdx = findColumn(headers, PHONE_COLUMNS)
  const companyIdx = findColumn(headers, COMPANY_COLUMNS)
  const sourceIdx = findColumn(headers, SOURCE_COLUMNS)
  const notesIdx = findColumn(headers, NOTES_COLUMNS)

  if (nameIdx === -1 && emailIdx === -1) {
    return {
      success: [],
      errors: [{ row: 0, reason: 'No se encontró columna de nombre ni email en el CSV' }],
      total: 0,
    }
  }

  const success: ImportedContact[] = []
  const errors: Array<{ row: number; reason: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(separator).map((f) => f.trim().replace(/^["']|["']$/g, ''))

    const name = nameIdx >= 0 ? fields[nameIdx]?.trim() || null : null
    const email = emailIdx >= 0 ? fields[emailIdx]?.trim() || null : null
    const phone = phoneIdx >= 0 ? fields[phoneIdx]?.trim() || null : null
    const company = companyIdx >= 0 ? fields[companyIdx]?.trim() || null : null
    const source = sourceIdx >= 0 ? fields[sourceIdx]?.trim() || null : null
    const notes = notesIdx >= 0 ? fields[notesIdx]?.trim() || null : null

    if (!name && !email) {
      errors.push({ row: i + 1, reason: 'Fila sin nombre ni email' })
      continue
    }

    success.push({
      display_name: name || email || 'Sin nombre',
      primary_email: email,
      primary_phone: phone,
      company_name: company,
      source,
      notes,
    })
  }

  return { success, errors, total: lines.length - 1 }
}
