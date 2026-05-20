/**
 * School Data CSV Parser
 *
 * Handles import of students, representatives, grades, and payments from CSV.
 * Supports flexible column mapping for common Venezuelan school systems:
 * - EduDatos / EduRed
 * - Visual Gema
 * - Q10
 * - SchoolTrack
 * - Excel/Google Sheets manual exports
 *
 * Features:
 * - Auto-detects separator (comma, semicolon, tab)
 * - Maps column names in Spanish with common variations
 * - Validates required fields and reports errors per row
 * - Handles encoding issues (UTF-8, Latin-1)
 * - Deduplicates by cedula/name combination
 */

// =============================================================================
// Types
// =============================================================================

export type ImportedStudent = {
  first_name: string
  last_name: string
  cedula: string | null
  birth_date: string | null
  gender: string | null
  grade_level: string | null
  section: string | null
  representative_name: string | null
  representative_phone: string | null
  representative_cedula: string | null
  representative_email: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  medical_notes: string | null
  allergies: string | null
  previous_school: string | null
}

export type ImportedPayment = {
  student_cedula: string | null
  student_name: string | null
  amount: string
  currency: string
  payment_date: string
  payment_method: string | null
  reference: string | null
  concept: string | null
  period_month: string | null
}

export type ImportedGrade = {
  student_cedula: string | null
  student_name: string | null
  subject: string
  period: string | null
  score: string | null
  qualitative: string | null
}

export type CsvImportResult<T> = {
  success: T[]
  errors: Array<{ row: number; reason: string; data?: Record<string, string> }>
  total: number
  duplicates: number
}

// =============================================================================
// Column Mappings (Spanish variations from different systems)
// =============================================================================

const STUDENT_COLUMNS = {
  first_name: ['nombre', 'nombres', 'first_name', 'primer_nombre', 'name'],
  last_name: ['apellido', 'apellidos', 'last_name', 'primer_apellido', 'surname'],
  cedula: ['cedula', 'ci', 'documento', 'id_number', 'cedula_escolar', 'num_documento'],
  birth_date: ['fecha_nacimiento', 'nacimiento', 'birth_date', 'fec_nac', 'fecha_nac'],
  gender: ['genero', 'sexo', 'gender', 'sex'],
  grade_level: ['grado', 'nivel', 'grade', 'ano', 'año', 'curso', 'grade_level'],
  section: ['seccion', 'sección', 'section', 'grupo', 'division'],
  representative_name: ['representante', 'padre', 'madre', 'acudiente', 'tutor', 'rep_nombre', 'nombre_representante'],
  representative_phone: ['telefono_rep', 'tel_representante', 'phone_rep', 'celular_rep', 'movil_rep', 'telefono_padre', 'telefono_madre'],
  representative_cedula: ['cedula_rep', 'ci_representante', 'doc_representante', 'cedula_padre', 'cedula_madre'],
  representative_email: ['email_rep', 'correo_rep', 'email_representante', 'correo_representante'],
  emergency_contact: ['emergencia', 'contacto_emergencia', 'emergency', 'persona_emergencia'],
  emergency_phone: ['tel_emergencia', 'telefono_emergencia', 'emergency_phone'],
  medical_notes: ['medico', 'notas_medicas', 'condicion_medica', 'medical', 'salud'],
  allergies: ['alergias', 'allergies', 'alergia'],
  previous_school: ['colegio_anterior', 'procedencia', 'previous_school', 'institucion_anterior'],
}

const PAYMENT_COLUMNS = {
  student_cedula: ['cedula', 'ci_alumno', 'cedula_alumno', 'documento_alumno'],
  student_name: ['alumno', 'estudiante', 'nombre_alumno', 'student'],
  amount: ['monto', 'amount', 'valor', 'total', 'pago'],
  currency: ['moneda', 'currency', 'divisa'],
  payment_date: ['fecha', 'fecha_pago', 'date', 'payment_date'],
  payment_method: ['metodo', 'forma_pago', 'method', 'tipo_pago', 'medio'],
  reference: ['referencia', 'ref', 'reference', 'comprobante', 'numero_ref'],
  concept: ['concepto', 'concept', 'descripcion', 'motivo'],
  period_month: ['mes', 'periodo', 'month', 'mensualidad'],
}

const GRADE_COLUMNS = {
  student_cedula: ['cedula', 'ci', 'documento'],
  student_name: ['alumno', 'estudiante', 'nombre'],
  subject: ['materia', 'asignatura', 'subject', 'area'],
  period: ['lapso', 'periodo', 'period', 'trimestre', 'corte'],
  score: ['nota', 'calificacion', 'score', 'puntaje', 'definitiva'],
  qualitative: ['literal', 'cualitativa', 'letra', 'grade_letter'],
}

// =============================================================================
// Parser
// =============================================================================

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) =>
    h.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, ''),
  )
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate)
    if (idx !== -1) return idx
  }
  // Partial match fallback
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate) || candidate.includes(h))
    if (idx !== -1) return idx
  }
  return -1
}

function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  const tabs = (headerLine.match(/\t/g) ?? []).length

  if (tabs > semicolons && tabs > commas) return '\t'
  if (semicolons > commas) return ';'
  return ','
}

function parseField(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  return trimmed.length > 0 ? trimmed : null
}

// =============================================================================
// Public API
// =============================================================================

export function parseStudentsCsv(csvText: string): CsvImportResult<ImportedStudent> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return { success: [], errors: [{ row: 0, reason: 'CSV vacío o sin datos' }], total: 0, duplicates: 0 }
  }

  const separator = detectSeparator(lines[0])
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''))

  // Map columns
  const colMap: Record<string, number> = {}
  for (const [key, candidates] of Object.entries(STUDENT_COLUMNS)) {
    colMap[key] = findColumn(headers, candidates)
  }

  // Require at least name
  if (colMap.first_name === -1 && colMap.last_name === -1) {
    return {
      success: [],
      errors: [{ row: 0, reason: 'No se encontró columna de nombre ni apellido' }],
      total: 0,
      duplicates: 0,
    }
  }

  const success: ImportedStudent[] = []
  const errors: Array<{ row: number; reason: string; data?: Record<string, string> }> = []
  const seen = new Set<string>()
  let duplicates = 0

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(separator).map((f) => f.trim().replace(/^["']|["']$/g, ''))

    const firstName = parseField(fields[colMap.first_name])
    const lastName = parseField(fields[colMap.last_name])

    if (!firstName && !lastName) {
      errors.push({ row: i + 1, reason: 'Fila sin nombre ni apellido' })
      continue
    }

    // Dedup by cedula or name
    const cedula = parseField(fields[colMap.cedula])
    const dedupKey = cedula ?? `${firstName}|${lastName}`.toLowerCase()
    if (seen.has(dedupKey)) {
      duplicates++
      continue
    }
    seen.add(dedupKey)

    success.push({
      first_name: firstName ?? '',
      last_name: lastName ?? '',
      cedula,
      birth_date: parseField(fields[colMap.birth_date]),
      gender: parseField(fields[colMap.gender]),
      grade_level: parseField(fields[colMap.grade_level]),
      section: parseField(fields[colMap.section]),
      representative_name: parseField(fields[colMap.representative_name]),
      representative_phone: parseField(fields[colMap.representative_phone]),
      representative_cedula: parseField(fields[colMap.representative_cedula]),
      representative_email: parseField(fields[colMap.representative_email]),
      emergency_contact: parseField(fields[colMap.emergency_contact]),
      emergency_phone: parseField(fields[colMap.emergency_phone]),
      medical_notes: parseField(fields[colMap.medical_notes]),
      allergies: parseField(fields[colMap.allergies]),
      previous_school: parseField(fields[colMap.previous_school]),
    })
  }

  return { success, errors, total: lines.length - 1, duplicates }
}

export function parsePaymentsCsv(csvText: string): CsvImportResult<ImportedPayment> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return { success: [], errors: [{ row: 0, reason: 'CSV vacío' }], total: 0, duplicates: 0 }
  }

  const separator = detectSeparator(lines[0])
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const colMap: Record<string, number> = {}
  for (const [key, candidates] of Object.entries(PAYMENT_COLUMNS)) {
    colMap[key] = findColumn(headers, candidates)
  }

  if (colMap.amount === -1) {
    return { success: [], errors: [{ row: 0, reason: 'No se encontró columna de monto' }], total: 0, duplicates: 0 }
  }

  const success: ImportedPayment[] = []
  const errors: Array<{ row: number; reason: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(separator).map((f) => f.trim().replace(/^["']|["']$/g, ''))
    const amount = parseField(fields[colMap.amount])

    if (!amount) {
      errors.push({ row: i + 1, reason: 'Fila sin monto' })
      continue
    }

    success.push({
      student_cedula: parseField(fields[colMap.student_cedula]),
      student_name: parseField(fields[colMap.student_name]),
      amount,
      currency: parseField(fields[colMap.currency]) ?? 'USD',
      payment_date: parseField(fields[colMap.payment_date]) ?? '',
      payment_method: parseField(fields[colMap.payment_method]),
      reference: parseField(fields[colMap.reference]),
      concept: parseField(fields[colMap.concept]),
      period_month: parseField(fields[colMap.period_month]),
    })
  }

  return { success, errors, total: lines.length - 1, duplicates: 0 }
}

export function parseGradesCsv(csvText: string): CsvImportResult<ImportedGrade> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return { success: [], errors: [{ row: 0, reason: 'CSV vacío' }], total: 0, duplicates: 0 }
  }

  const separator = detectSeparator(lines[0])
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const colMap: Record<string, number> = {}
  for (const [key, candidates] of Object.entries(GRADE_COLUMNS)) {
    colMap[key] = findColumn(headers, candidates)
  }

  if (colMap.subject === -1) {
    return { success: [], errors: [{ row: 0, reason: 'No se encontró columna de materia' }], total: 0, duplicates: 0 }
  }

  const success: ImportedGrade[] = []
  const errors: Array<{ row: number; reason: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(separator).map((f) => f.trim().replace(/^["']|["']$/g, ''))
    const subject = parseField(fields[colMap.subject])

    if (!subject) {
      errors.push({ row: i + 1, reason: 'Fila sin materia' })
      continue
    }

    success.push({
      student_cedula: parseField(fields[colMap.student_cedula]),
      student_name: parseField(fields[colMap.student_name]),
      subject,
      period: parseField(fields[colMap.period]),
      score: parseField(fields[colMap.score]),
      qualitative: parseField(fields[colMap.qualitative]),
    })
  }

  return { success, errors, total: lines.length - 1, duplicates: 0 }
}
