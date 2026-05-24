/**
 * Unit tests — auto_service_orders validators
 *
 * Venezuelan auto repair context:
 *   - status 'estimate_sent': presupuesto enviado al cliente — en Venezuela
 *     es común enviar por WhatsApp (foto del presupuesto impreso)
 *   - status 'quality_check': control de calidad antes de entrega
 *   - priority 'urgent': vehículo único de la familia, uso laboral crítico
 *   - createOrderItemSchema.is_approved default true: en talleres venezolanos
 *     se asume aprobación implícita hasta rechazo formal del cliente
 *   - updateServiceOrderSchema: schema STANDALONE (no es partial de create)
 *     — solo actualiza estado, diagnóstico, técnico, totales
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  createOrderItemSchema,
  updateOrderItemSchema,
  listOrdersSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validOrder = () => ({
  vehicle_id: UUID,
  customer_id: UUID2,
  order_number: 'OS-2026-001',
})

const validItem = () => ({
  service_order_id: UUID,
  type: 'labor' as const,
  description: 'Cambio de correa de distribución',
  quantity: 1,
  unit_price: '85.00',
  total_price: '85.00',
})

// ---------------------------------------------------------------------------
// createServiceOrderSchema
// ---------------------------------------------------------------------------
describe('createServiceOrderSchema', () => {
  it('accepts minimal service order with defaults', () => {
    const r = createServiceOrderSchema.safeParse(validOrder())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.priority).toBe('normal')
      expect(r.data.currency).toBe('USD')
      expect(r.data.km_at_entry).toBe(0)
    }
  })
  it('rejects non-UUID vehicle_id', () => {
    expect(createServiceOrderSchema.safeParse({ ...validOrder(), vehicle_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing order_number', () => {
    const { order_number: _o, ...rest } = validOrder()
    expect(createServiceOrderSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects km_at_entry below 0', () => {
    expect(createServiceOrderSchema.safeParse({ ...validOrder(), km_at_entry: -1 }).success).toBe(false)
  })
  it('coerces km_at_entry from string', () => {
    const r = createServiceOrderSchema.safeParse({ ...validOrder(), km_at_entry: '85000' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.km_at_entry).toBe(85000)
  })
  it('accepts assigned_technician_id as null', () => {
    expect(createServiceOrderSchema.safeParse({ ...validOrder(), assigned_technician_id: null }).success).toBe(true)
  })

  describe('priority enum', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'] as const
    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createServiceOrderSchema.safeParse({ ...validOrder(), priority }).success).toBe(true)
    })
    it('rejects invalid priority', () => {
      expect(createServiceOrderSchema.safeParse({ ...validOrder(), priority: 'critical' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateServiceOrderSchema — standalone schema
// ---------------------------------------------------------------------------
describe('updateServiceOrderSchema', () => {
  it('accepts empty object', () => { expect(updateServiceOrderSchema.safeParse({}).success).toBe(true) })
  it('accepts notes as null', () => {
    expect(updateServiceOrderSchema.safeParse({ notes: null }).success).toBe(true)
  })

  describe('status enum — full repair workflow', () => {
    const statuses = [
      'received', 'diagnosis', 'estimate_sent', 'approved', 'in_repair',
      'quality_check', 'ready', 'delivered', 'cancelled',
    ] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateServiceOrderSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateServiceOrderSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })

  describe('priority enum in update', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'] as const
    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(updateServiceOrderSchema.safeParse({ priority }).success).toBe(true)
    })
  })

  it('accepts total fields update after repair completion', () => {
    expect(updateServiceOrderSchema.safeParse({
      status: 'ready',
      total_labor: '150.00',
      total_parts: '85.00',
      total_amount: '235.00',
    }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createOrderItemSchema
// ---------------------------------------------------------------------------
describe('createOrderItemSchema', () => {
  it('accepts minimal item with defaults', () => {
    const r = createOrderItemSchema.safeParse(validItem())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.quantity).toBe(1)
      expect(r.data.is_approved).toBe(true)
    }
  })
  it('rejects non-UUID service_order_id', () => {
    expect(createOrderItemSchema.safeParse({ ...validItem(), service_order_id: 'bad' }).success).toBe(false)
  })
  it('rejects description missing (min(1))', () => {
    expect(createOrderItemSchema.safeParse({ ...validItem(), description: '' }).success).toBe(false)
  })
  it('rejects quantity below 1', () => {
    expect(createOrderItemSchema.safeParse({ ...validItem(), quantity: 0 }).success).toBe(false)
  })
  it('coerces quantity from string', () => {
    const r = createOrderItemSchema.safeParse({ ...validItem(), quantity: '4' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.quantity).toBe(4)
  })
  it('accepts part_id as null (labor item — no part)', () => {
    expect(createOrderItemSchema.safeParse({ ...validItem(), part_id: null }).success).toBe(true)
  })

  describe('type enum', () => {
    const types = ['labor', 'part'] as const
    test.each(types)('accepts type "%s"', (type) => {
      expect(createOrderItemSchema.safeParse({ ...validItem(), type }).success).toBe(true)
    })
    it('rejects invalid type', () => {
      expect(createOrderItemSchema.safeParse({ ...validItem(), type: 'service' }).success).toBe(false)
    })
  })
})

describe('updateOrderItemSchema', () => {
  it('accepts empty object', () => { expect(updateOrderItemSchema.safeParse({}).success).toBe(true) })
  it('accepts is_approved update', () => {
    expect(updateOrderItemSchema.safeParse({ is_approved: false }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listOrdersSchema
// ---------------------------------------------------------------------------
describe('listOrdersSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listOrdersSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts vehicle_id UUID filter', () => {
    expect(listOrdersSchema.safeParse({ vehicle_id: UUID }).success).toBe(true)
  })
  it('accepts status and priority as strings', () => {
    expect(listOrdersSchema.safeParse({ status: 'in_repair', priority: 'urgent' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listOrdersSchema.safeParse({ date_from: '2026-01-01' }).success).toBe(true)
  })
})
