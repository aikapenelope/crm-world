/**
 * Unit tests — properties/services/csv-import (parseCsvContacts)
 *
 * The CSV importer is a pure function that parses contact data from a text CSV
 * and returns structured results without touching the database. That design
 * makes it fully unit-testable without any framework setup.
 *
 * Test strategy:
 *   - Happy path with each supported separator (comma, semicolon, tab)
 *   - Spanish + English column name variations (the importer maps both)
 *   - Edge cases: empty input, malformed rows, missing required columns
 *   - Result structure validation (success[], errors[], total)
 *
 * Reference: https://docs.open-mercato.dev/framework/modules/overview
 */

import { parseCsvContacts, type CsvImportResult, type ImportedContact } from '../services/csv-import'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal CSV with a header row and one data row. */
function csv(header: string, ...rows: string[]): string {
  return [header, ...rows].join('\n')
}

// ---------------------------------------------------------------------------
// Happy path — comma separator (most common)
// ---------------------------------------------------------------------------

describe('parseCsvContacts — comma-separated', () => {
  it('parses a single contact with all Spanish column names', () => {
    const input = csv(
      'nombre,email,telefono,empresa,fuente,notas',
      'Juan Pérez,juan@example.com,+58 412-555-0100,ACME C.A.,Instagram,VIP',
    )

    const result = parseCsvContacts(input)

    expect(result.total).toBe(1)
    expect(result.success).toHaveLength(1)
    expect(result.errors).toHaveLength(0)

    const contact = result.success[0]
    expect(contact.display_name).toBe('Juan Pérez')
    expect(contact.primary_email).toBe('juan@example.com')
    expect(contact.primary_phone).toBe('+58 412-555-0100')
    expect(contact.company_name).toBe('ACME C.A.')
    expect(contact.source).toBe('Instagram')
    expect(contact.notes).toBe('VIP')
  })

  it('parses multiple contacts', () => {
    const input = csv(
      'nombre,email',
      'Ana García,ana@test.com',
      'Pedro Rodríguez,pedro@test.com',
      'María López,maria@test.com',
    )

    const result = parseCsvContacts(input)

    expect(result.total).toBe(3)
    expect(result.success).toHaveLength(3)
    expect(result.errors).toHaveLength(0)
    expect(result.success.map((c) => c.display_name)).toEqual([
      'Ana García',
      'Pedro Rodríguez',
      'María López',
    ])
  })

  it('uses email as display_name when nombre is missing', () => {
    const input = csv('email', 'fallback@example.com')
    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    expect(result.success[0].display_name).toBe('fallback@example.com')
  })
})

// ---------------------------------------------------------------------------
// Separator detection
// ---------------------------------------------------------------------------

describe('parseCsvContacts — semicolon separator', () => {
  it('detects and parses semicolon-separated CSV (common in Spanish Excel exports)', () => {
    const input = csv(
      'nombre;email;telefono',
      'Carlos;carlos@test.com;+58 414-111-2222',
    )

    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    expect(result.success[0].display_name).toBe('Carlos')
    expect(result.success[0].primary_email).toBe('carlos@test.com')
    expect(result.success[0].primary_phone).toBe('+58 414-111-2222')
  })
})

describe('parseCsvContacts — tab separator', () => {
  it('detects and parses tab-separated values', () => {
    const input = csv(
      'nombre\temail\ttelefono',
      'Diana\tdiana@test.com\t+58 416-333-4444',
    )

    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    expect(result.success[0].display_name).toBe('Diana')
    expect(result.success[0].primary_email).toBe('diana@test.com')
    expect(result.success[0].primary_phone).toBe('+58 416-333-4444')
  })
})

// ---------------------------------------------------------------------------
// Column name normalisation (Spanish + English variants)
// ---------------------------------------------------------------------------

describe('parseCsvContacts — column name mapping', () => {
  const columnVariants: Array<[string, keyof ImportedContact, string]> = [
    ['name',           'display_name',   'English "name"'],
    ['display_name',   'display_name',   '"display_name" (API style)'],
    ['nombre_completo','display_name',   '"nombre_completo"'],
    ['contacto',       'display_name',   '"contacto"'],
    ['correo',         'primary_email',  'Spanish "correo"'],
    ['correo_electronico', 'primary_email', '"correo_electronico"'],
    ['celular',        'primary_phone',  '"celular"'],
    ['movil',          'primary_phone',  '"movil"'],
    ['whatsapp',       'primary_phone',  '"whatsapp"'],
    ['company',        'company_name',   'English "company"'],
    ['organizacion',   'company_name',   '"organizacion"'],
    ['source',         'source',         'English "source"'],
    ['origen',         'source',         '"origen"'],
    ['lead_source',    'source',         '"lead_source"'],
    ['notes',          'notes',          'English "notes"'],
    ['observaciones',  'notes',          '"observaciones"'],
    ['comentarios',    'notes',          '"comentarios"'],
  ]

  test.each(columnVariants)('maps header "%s" to %s (%s)', (header, field) => {
    const value = field === 'primary_email' ? 'test@test.com' : 'Test Value'
    let line = ''
    if (field === 'display_name') {
      line = `${value}`
    } else {
      // We need a name column too so the row is not rejected
      line = field === 'primary_email' ? `${value}` : `Test User,${value}`
    }

    // Build a CSV where the mapped column exists alongside the name/email anchor
    const hasNameCol = field !== 'display_name'
    const headerRow = hasNameCol ? `nombre,${header}` : header
    const dataRow = hasNameCol
      ? (field === 'primary_email' ? `Test User,${value}` : `Test User,${value}`)
      : value

    const result = parseCsvContacts(`${headerRow}\n${dataRow}`)
    expect(result.success.length).toBeGreaterThan(0)

    const contact = result.success[0]
    if (field === 'display_name') {
      expect(contact.display_name).toBe(value)
    } else {
      expect(contact[field]).toBe(value)
    }
  })
})

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('parseCsvContacts — error handling', () => {
  it('returns an error for an empty string', () => {
    const result = parseCsvContacts('')
    expect(result.success).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].row).toBe(0)
  })

  it('returns an error for a CSV with only a header row (no data)', () => {
    const result = parseCsvContacts('nombre,email')
    expect(result.success).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns an error when neither a name nor email column is present', () => {
    const result = parseCsvContacts(csv('empresa,fuente', 'ACME,Web'))
    expect(result.success).toHaveLength(0)
    expect(result.errors[0].reason).toMatch(/nombre|email/i)
  })

  it('records a row error when a row has no name and no email', () => {
    const input = csv(
      'nombre,email,empresa',
      ',, ACME C.A.',   // row with no name and no email
      'Valid User,valid@test.com,', // row that should succeed
    )

    const result = parseCsvContacts(input)

    expect(result.total).toBe(2)
    expect(result.success).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(2) // 1-indexed: header=0, row1=2
  })

  it('provides the human-readable row number (1-indexed from header)', () => {
    const input = csv(
      'nombre,email',
      'Good,good@test.com',
      ',',             // bad row 2
      ',',             // bad row 3
    )

    const result = parseCsvContacts(input)
    const errorRows = result.errors.map((e) => e.row)
    expect(errorRows).toContain(3)
    expect(errorRows).toContain(4)
  })
})

// ---------------------------------------------------------------------------
// Quoted fields
// ---------------------------------------------------------------------------

describe('parseCsvContacts — quoted values', () => {
  it('strips surrounding double-quotes from field values', () => {
    const input = csv(
      '"nombre","email"',
      '"Juan García","juan@test.com"',
    )

    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    expect(result.success[0].display_name).toBe('Juan García')
    expect(result.success[0].primary_email).toBe('juan@test.com')
  })

  it('strips surrounding single-quotes from field values', () => {
    const input = csv(
      "nombre,email",
      "'María','maria@test.com'",
    )

    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    expect(result.success[0].display_name).toBe('María')
  })
})

// ---------------------------------------------------------------------------
// Result structure contract
// ---------------------------------------------------------------------------

describe('parseCsvContacts — result structure', () => {
  it('always returns success[], errors[], and total', () => {
    const result: CsvImportResult = parseCsvContacts('nombre\nAlicia')
    expect(Array.isArray(result.success)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  it('total equals the number of data rows (not counting header)', () => {
    const input = csv('nombre,email', 'A,a@a.com', 'B,b@b.com', 'C,c@c.com')
    const result = parseCsvContacts(input)
    expect(result.total).toBe(3)
  })

  it('null is used for absent optional fields, not undefined or empty string', () => {
    const input = csv('nombre', 'Solo Nombre')
    const result = parseCsvContacts(input)

    expect(result.success).toHaveLength(1)
    const contact = result.success[0]
    expect(contact.primary_email).toBeNull()
    expect(contact.primary_phone).toBeNull()
    expect(contact.company_name).toBeNull()
    expect(contact.source).toBeNull()
    expect(contact.notes).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Windows-style line endings
// ---------------------------------------------------------------------------

describe('parseCsvContacts — CRLF line endings', () => {
  it('handles \\r\\n line endings from Windows/Excel exports', () => {
    const input = 'nombre,email\r\nRoberto,roberto@test.com\r\nLuisa,luisa@test.com'
    const result = parseCsvContacts(input)

    expect(result.total).toBe(2)
    expect(result.success).toHaveLength(2)
    expect(result.success[0].display_name).toBe('Roberto')
    expect(result.success[1].display_name).toBe('Luisa')
  })
})
