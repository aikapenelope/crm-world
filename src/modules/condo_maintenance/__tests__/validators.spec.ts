/**
 * Unit tests — condo_maintenance validators
 *
 * Venezuelan condo maintenance context:
 *   - category 'elevator': ascensor — critical in Venezuela; CORPOELEC
 *     power cuts cause elevator failures (trapped residents); high priority
 *   - priority 'emergency': emergencia — broken elevator, flooded apt,
 *     security breach; requires immediate same-day response
 *   - rating 1-5: calificación del proveedor — coerce from form string
 *   - rif: RIF del proveedor de mantenimiento — SENIAT invoicing required
 *   - specialty 'general': comodín para proveedores multiservicio
 *   - quoted_amount / approved_amount: cotización vs monto aprobado por
 *     la junta — assembly approval required above threshold
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createRequestSchema,
  updateRequestSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createSupplierSchema,
  updateSupplierSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validRequest = () => ({
  building_id: UUID,
  requested_by_name: 'Ing. Torres — Apto 3B',
  category: 'electrical' as const,
  priority: 'medium' as const,
  title: 'Falla en tablero de distribución piso 3',
  description: 'Disyuntor principal del piso 3 disparando repetidamente',
})
const validWO = () => ({
  building_id: UUID,
  supplier_name: 'Electricidad Industrial C.A.',
  description: 'Revisión y cambio de disyuntor 3x60A',
})
const validSupplier = () => ({
  name: 'Electricidad Industrial C.A.',
  specialty: 'electrical' as const,
})

// ---------------------------------------------------------------------------
// createRequestSchema
// ---------------------------------------------------------------------------
describe('createRequestSchema', () => {
  it('accepts minimal request with defaults', () => {
    const r = createRequestSchema.safeParse(validRequest())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('open')
  })
  it('rejects non-UUID building_id', () => {
    expect(createRequestSchema.safeParse({ ...validRequest(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty title', () => {
    expect(createRequestSchema.safeParse({ ...validRequest(), title: '' }).success).toBe(false)
  })
  it('rejects empty description', () => {
    expect(createRequestSchema.safeParse({ ...validRequest(), description: '' }).success).toBe(false)
  })
  it('accepts requested_by_unit_id as null (common area issue)', () => {
    expect(createRequestSchema.safeParse({ ...validRequest(), requested_by_unit_id: null }).success).toBe(true)
  })

  describe('category enum', () => {
    const cats = ['plumbing', 'electrical', 'elevator', 'structural', 'cleaning', 'security', 'garden', 'pool', 'other'] as const
    test.each(cats)('accepts category "%s"', (category) => {
      expect(createRequestSchema.safeParse({ ...validRequest(), category }).success).toBe(true)
    })
    it('rejects invalid category', () => {
      expect(createRequestSchema.safeParse({ ...validRequest(), category: 'hvac' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['low', 'medium', 'high', 'emergency'] as const
    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createRequestSchema.safeParse({ ...validRequest(), priority }).success).toBe(true)
    })
    it('rejects invalid priority', () => {
      expect(createRequestSchema.safeParse({ ...validRequest(), priority: 'urgent' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createRequestSchema.safeParse({ ...validRequest(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createRequestSchema.safeParse({ ...validRequest(), status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRequestSchema
// ---------------------------------------------------------------------------
describe('updateRequestSchema', () => {
  it('accepts empty object', () => { expect(updateRequestSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateRequestSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('accepts cost fields as strings', () => {
    expect(updateRequestSchema.safeParse({ estimated_cost: '350.00', actual_cost: '380.00' }).success).toBe(true)
  })
  it('accepts assigned_to as null (unassigning)', () => {
    expect(updateRequestSchema.safeParse({ assigned_to: null }).success).toBe(true)
  })
  it('passes through unknown fields (passthrough schema)', () => {
    expect(updateRequestSchema.safeParse({ custom: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createWorkOrderSchema
// ---------------------------------------------------------------------------
describe('createWorkOrderSchema', () => {
  it('accepts minimal work order with defaults', () => {
    const r = createWorkOrderSchema.safeParse(validWO())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('pending')
  })
  it('rejects non-UUID building_id', () => {
    expect(createWorkOrderSchema.safeParse({ ...validWO(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty description', () => {
    expect(createWorkOrderSchema.safeParse({ ...validWO(), description: '' }).success).toBe(false)
  })
  it('accepts request_id as null (proactive WO)', () => {
    expect(createWorkOrderSchema.safeParse({ ...validWO(), request_id: null }).success).toBe(true)
  })
  it('accepts scheduled_date as plain string', () => {
    const r = createWorkOrderSchema.safeParse({ ...validWO(), scheduled_date: '2026-01-22' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.scheduled_date).toBe('2026-01-22')
  })
  it('accepts quoted_amount and approved_amount as strings', () => {
    const r = createWorkOrderSchema.safeParse({
      ...validWO(), quoted_amount: '350.00', approved_amount: '350.00',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.approved_amount).toBe('350.00')
  })

  describe('status enum', () => {
    const statuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createWorkOrderSchema.safeParse({ ...validWO(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createWorkOrderSchema.safeParse({ ...validWO(), status: 'draft' }).success).toBe(false)
    })
  })
})

describe('updateWorkOrderSchema', () => {
  it('accepts empty object', () => { expect(updateWorkOrderSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (scheduled → in_progress)', () => {
    expect(updateWorkOrderSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createSupplierSchema (condo maintenance supplier)
// ---------------------------------------------------------------------------
describe('createSupplierSchema', () => {
  it('accepts minimal supplier with defaults', () => {
    const r = createSupplierSchema.safeParse(validSupplier())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(true)
  })
  it('rejects missing name', () => {
    const { name: _o, ...rest } = validSupplier()
    expect(createSupplierSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts rating 1-5', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(createSupplierSchema.safeParse({ ...validSupplier(), rating }).success).toBe(true)
    }
  })
  it('rejects rating below 1', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), rating: 0 }).success).toBe(false)
  })
  it('rejects rating above 5', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), rating: 6 }).success).toBe(false)
  })
  it('coerces rating from string', () => {
    const r = createSupplierSchema.safeParse({ ...validSupplier(), rating: '4' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.rating).toBe(4)
  })
  it('accepts rif as null', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), rif: null }).success).toBe(true)
  })

  describe('specialty enum', () => {
    const specialties = ['plumbing', 'electrical', 'elevator', 'cleaning', 'security', 'garden', 'pool', 'general', 'other'] as const
    test.each(specialties)('accepts specialty "%s"', (specialty) => {
      expect(createSupplierSchema.safeParse({ ...validSupplier(), specialty }).success).toBe(true)
    })
    it('rejects invalid specialty', () => {
      expect(createSupplierSchema.safeParse({ ...validSupplier(), specialty: 'hvac' }).success).toBe(false)
    })
  })
})

describe('updateSupplierSchema', () => {
  it('accepts empty object', () => { expect(updateSupplierSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateSupplierSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})
