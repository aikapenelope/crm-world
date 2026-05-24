/**
 * Unit tests — condo_comms validators
 *
 * Venezuelan condo communications context:
 *   - createCircularSchema: circular de condominio — official communication
 *     to all owners/residents; send_whatsapp uses WhatsApp Business API
 *   - category 'assembly': convocatoria a asamblea — legal notice required
 *     15 days in advance (Ley de Propiedad Horizontal Art. 24)
 *   - category 'payment': aviso de cobro — monthly fee reminder
 *   - createVoteSchema: votación online — increasingly used for asamblea
 *     participation by non-resident owners (diaspora venezolana)
 *   - requires_quorum: quórum requerido — typically 51% of aliquots
 *   - createAssemblySchema: registro de asamblea — minutes required by
 *     Ley de Propiedad Horizontal (notaría pública for extraordinary)
 *   - assembly_type 'extraordinary': asamblea extraordinaria — convocada
 *     para temas específicos urgentes (daños mayores, cambio de administrador)
 *   - attendees_count: coerce (form input)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createCircularSchema,
  updateCircularSchema,
  createVoteSchema,
  updateVoteSchema,
  castVoteSchema,
  createAssemblySchema,
  updateAssemblySchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validCircular = () => ({
  building_id: UUID,
  title: 'Aviso: Mantenimiento preventivo ascensor — Viernes 24 Ene',
  content: 'Se informa a todos los condóminos que el viernes 24 de enero se realizará mantenimiento preventivo del ascensor.',
  category: 'maintenance' as const,
  priority: 'normal' as const,
})
const validVote = () => ({
  building_id: UUID,
  title: 'Aprobación presupuesto 2026',
  description: '¿Aprueba usted el presupuesto ordinario 2026 por US$ 28.800?',
  vote_type: 'yes_no' as const,
  options: ['Sí', 'No'],
  opens_at: '2026-01-20',
  closes_at: '2026-01-25',
})
const validCastVote = () => ({
  vote_id: UUID, unit_id: UUID2, choice: 'Sí',
})
const validAssembly = () => ({
  building_id: UUID,
  assembly_type: 'ordinary' as const,
  title: 'Asamblea Ordinaria Anual 2026',
  date: '2026-01-30',
})

// ---------------------------------------------------------------------------
// createCircularSchema
// ---------------------------------------------------------------------------
describe('createCircularSchema', () => {
  it('accepts minimal circular with defaults', () => {
    const r = createCircularSchema.safeParse(validCircular())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.send_whatsapp).toBe(false)
      expect(r.data.status).toBe('draft')
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createCircularSchema.safeParse({ ...validCircular(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty title', () => {
    expect(createCircularSchema.safeParse({ ...validCircular(), title: '' }).success).toBe(false)
  })
  it('rejects empty content', () => {
    expect(createCircularSchema.safeParse({ ...validCircular(), content: '' }).success).toBe(false)
  })
  it('accepts send_whatsapp = true', () => {
    const r = createCircularSchema.safeParse({ ...validCircular(), send_whatsapp: true })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.send_whatsapp).toBe(true)
  })
  it('accepts expires_at as plain string', () => {
    const r = createCircularSchema.safeParse({ ...validCircular(), expires_at: '2026-02-01' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.expires_at).toBe('2026-02-01')
  })
  it('accepts expires_at as null (permanent circular)', () => {
    expect(createCircularSchema.safeParse({ ...validCircular(), expires_at: null }).success).toBe(true)
  })

  describe('category enum', () => {
    const cats = ['general', 'maintenance', 'security', 'assembly', 'payment', 'rules', 'emergency'] as const
    test.each(cats)('accepts category "%s"', (category) => {
      expect(createCircularSchema.safeParse({ ...validCircular(), category }).success).toBe(true)
    })
    it('rejects invalid category', () => {
      expect(createCircularSchema.safeParse({ ...validCircular(), category: 'event' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['normal', 'important', 'urgent'] as const
    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createCircularSchema.safeParse({ ...validCircular(), priority }).success).toBe(true)
    })
    it('rejects invalid priority', () => {
      expect(createCircularSchema.safeParse({ ...validCircular(), priority: 'critical' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'published', 'expired'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createCircularSchema.safeParse({ ...validCircular(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createCircularSchema.safeParse({ ...validCircular(), status: 'archived' }).success).toBe(false)
    })
  })
})

describe('updateCircularSchema', () => {
  it('accepts empty object', () => { expect(updateCircularSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (draft → published)', () => {
    expect(updateCircularSchema.safeParse({ status: 'published' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createVoteSchema
// ---------------------------------------------------------------------------
describe('createVoteSchema', () => {
  it('accepts minimal vote with defaults', () => {
    const r = createVoteSchema.safeParse(validVote())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.requires_quorum).toBe(true)
      expect(r.data.quorum_percent).toBe('50.00')
      expect(r.data.status).toBe('draft')
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createVoteSchema.safeParse({ ...validVote(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects options with less than 2 items', () => {
    expect(createVoteSchema.safeParse({ ...validVote(), options: ['Solo una opción'] }).success).toBe(false)
  })
  it('accepts options with 3+ items for multiple_choice', () => {
    const r = createVoteSchema.safeParse({
      ...validVote(), vote_type: 'multiple_choice',
      options: ['Opción A', 'Opción B', 'Opción C'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts opens_at and closes_at as plain strings', () => {
    const r = createVoteSchema.safeParse(validVote())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(typeof r.data.opens_at).toBe('string')
      expect(typeof r.data.closes_at).toBe('string')
    }
  })

  describe('vote_type enum', () => {
    const types = ['yes_no', 'multiple_choice', 'ranking'] as const
    test.each(types)('accepts vote_type "%s"', (vote_type) => {
      expect(createVoteSchema.safeParse({ ...validVote(), vote_type }).success).toBe(true)
    })
    it('rejects invalid vote_type', () => {
      expect(createVoteSchema.safeParse({ ...validVote(), vote_type: 'poll' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'open', 'closed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createVoteSchema.safeParse({ ...validVote(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createVoteSchema.safeParse({ ...validVote(), status: 'pending' }).success).toBe(false)
    })
  })
})

describe('updateVoteSchema', () => {
  it('accepts empty object', () => { expect(updateVoteSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (draft → open)', () => {
    expect(updateVoteSchema.safeParse({ status: 'open' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// castVoteSchema
// ---------------------------------------------------------------------------
describe('castVoteSchema', () => {
  it('accepts minimal cast vote', () => {
    expect(castVoteSchema.safeParse(validCastVote()).success).toBe(true)
  })
  it('rejects non-UUID vote_id', () => {
    expect(castVoteSchema.safeParse({ ...validCastVote(), vote_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID unit_id', () => {
    expect(castVoteSchema.safeParse({ ...validCastVote(), unit_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty choice', () => {
    expect(castVoteSchema.safeParse({ ...validCastVote(), choice: '' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createAssemblySchema
// ---------------------------------------------------------------------------
describe('createAssemblySchema', () => {
  it('accepts minimal assembly with defaults', () => {
    const r = createAssemblySchema.safeParse(validAssembly())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.attendees_count).toBe(0)
      expect(r.data.status).toBe('scheduled')
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createAssemblySchema.safeParse({ ...validAssembly(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty title', () => {
    expect(createAssemblySchema.safeParse({ ...validAssembly(), title: '' }).success).toBe(false)
  })
  it('accepts date as plain string', () => {
    const r = createAssemblySchema.safeParse(validAssembly())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.date).toBe('string')
  })
  it('coerces attendees_count from string', () => {
    const r = createAssemblySchema.safeParse({ ...validAssembly(), attendees_count: '18' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.attendees_count).toBe(18)
  })
  it('accepts agenda as array of strings', () => {
    const r = createAssemblySchema.safeParse({
      ...validAssembly(), agenda: ['Punto 1: Aprobación presupuesto', 'Punto 2: Elección junta'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts agenda as null', () => {
    expect(createAssemblySchema.safeParse({ ...validAssembly(), agenda: null }).success).toBe(true)
  })

  describe('assembly_type enum', () => {
    const types = ['ordinary', 'extraordinary'] as const
    test.each(types)('accepts assembly_type "%s"', (assembly_type) => {
      expect(createAssemblySchema.safeParse({ ...validAssembly(), assembly_type }).success).toBe(true)
    })
    it('rejects invalid assembly_type', () => {
      expect(createAssemblySchema.safeParse({ ...validAssembly(), assembly_type: 'special' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createAssemblySchema.safeParse({ ...validAssembly(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createAssemblySchema.safeParse({ ...validAssembly(), status: 'draft' }).success).toBe(false)
    })
  })
})

describe('updateAssemblySchema', () => {
  it('accepts empty object', () => { expect(updateAssemblySchema.safeParse({}).success).toBe(true) })
  it('accepts status update (scheduled → in_progress)', () => {
    expect(updateAssemblySchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })
  it('accepts attendees_count and minutes update after assembly', () => {
    expect(updateAssemblySchema.safeParse({
      status: 'completed', attendees_count: 18,
      minutes: 'Se aprobó el presupuesto 2026 con 15 votos a favor.',
    }).success).toBe(true)
  })
})
