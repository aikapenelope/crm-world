/**
 * Unit tests — isp_technicians validators
 *
 * Cubre los schemas Zod para técnicos de campo e instalación ISP
 * y órdenes de trabajo.
 *
 * Contexto venezolano:
 *   - fuel_allowance_usd: viáticos de gasolina en USD (el combustible se
 *     paga en paralelo; el costo en bolívares es altísimo).
 *   - commission_per_install: comisión por instalación en USD; incentivo
 *     clave para retener técnicos en el mercado venezolano.
 *   - vehicle_plate: placa venezolana del vehículo (ej: AA-123-BC).
 *   - WO_TYPES incluye 'equipment_swap' (cambio de CPE dañado) y 'verification'
 *     (verificación técnica sin intervención física).
 *   - WO_PRIORITY 'urgent': instalaciones pendientes hace +3 días o reactivaciones.
 *   - completeWorkOrderSchema registra km_traveled para liquidación de viáticos.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createTechnicianSchema,
  updateTechnicianSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  completeWorkOrderSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validTechnician = () => ({
  name:  'Carlos Rodríguez',
  phone: '+58 412-555-0100',
})

const validWorkOrder = () => ({
  type:    'installation' as const,
  address: 'Urb. El Trigal, Calle 10, Casa 5, Valencia',
})

// ---------------------------------------------------------------------------
// createTechnicianSchema
// ---------------------------------------------------------------------------

describe('createTechnicianSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid technician with defaults', () => {
      const result = createTechnicianSchema.safeParse(validTechnician())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('available')
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validTechnician()
      expect(createTechnicianSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when phone is missing', () => {
      const { phone: _omit, ...rest } = validTechnician()
      expect(createTechnicianSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects phone shorter than 7 chars', () => {
      expect(createTechnicianSchema.safeParse({ ...validTechnician(), phone: '123456' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['available', 'on_route', 'on_site', 'off_duty'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createTechnicianSchema.safeParse({ ...validTechnician(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(createTechnicianSchema.safeParse({ ...validTechnician(), status: 'busy' }).success).toBe(false)
    })
  })

  describe('Venezuelan compensation fields', () => {
    it('accepts fuel_allowance_usd (viáticos gasolina)', () => {
      const result = createTechnicianSchema.safeParse({
        ...validTechnician(),
        fuel_allowance_usd: '15.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts commission_per_install (comisión por instalación)', () => {
      const result = createTechnicianSchema.safeParse({
        ...validTechnician(),
        commission_per_install: '10.00',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid fuel_allowance_usd format', () => {
      expect(createTechnicianSchema.safeParse({
        ...validTechnician(),
        fuel_allowance_usd: 'diez',
      }).success).toBe(false)
    })

    it('accepts vehicle_plate for logistics tracking', () => {
      expect(createTechnicianSchema.safeParse({
        ...validTechnician(),
        vehicle_plate: 'AA-123-BC',
      }).success).toBe(true)
    })

    it('rejects vehicle_plate longer than 10 chars', () => {
      expect(createTechnicianSchema.safeParse({
        ...validTechnician(),
        vehicle_plate: 'AAA-1234-BCD',
      }).success).toBe(false)
    })

    it('accepts null for optional compensation fields', () => {
      expect(createTechnicianSchema.safeParse({
        ...validTechnician(),
        fuel_allowance_usd: null,
        commission_per_install: null,
        vehicle_plate: null,
      }).success).toBe(true)
    })
  })

  describe('coverage_zone', () => {
    it('accepts coverage_zone for dispatch optimization', () => {
      expect(createTechnicianSchema.safeParse({
        ...validTechnician(),
        coverage_zone: 'Valencia Norte',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateTechnicianSchema
// ---------------------------------------------------------------------------

describe('updateTechnicianSchema', () => {
  it('accepts an empty object', () => {
    expect(updateTechnicianSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status-only update (disponible → en ruta)', () => {
    expect(updateTechnicianSchema.safeParse({ status: 'on_route' }).success).toBe(true)
  })

  it('still validates status enum on partial update', () => {
    expect(updateTechnicianSchema.safeParse({ status: 'working' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createWorkOrderSchema
// ---------------------------------------------------------------------------

describe('createWorkOrderSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid work order with defaults', () => {
      const result = createWorkOrderSchema.safeParse(validWorkOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('normal')
      }
    })

    it('rejects when type is missing', () => {
      const { type: _omit, ...rest } = validWorkOrder()
      expect(createWorkOrderSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when address is missing', () => {
      const { address: _omit, ...rest } = validWorkOrder()
      expect(createWorkOrderSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('type enum', () => {
    const types = ['installation', 'repair', 'equipment_swap', 'uninstall', 'verification'] as const

    test.each(types)('accepts WO type "%s"', (type) => {
      expect(createWorkOrderSchema.safeParse({ ...validWorkOrder(), type }).success).toBe(true)
    })

    it('rejects invalid type', () => {
      expect(createWorkOrderSchema.safeParse({ ...validWorkOrder(), type: 'survey' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'] as const

    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createWorkOrderSchema.safeParse({ ...validWorkOrder(), priority }).success).toBe(true)
    })

    it('rejects invalid priority', () => {
      expect(createWorkOrderSchema.safeParse({ ...validWorkOrder(), priority: 'critical' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts scheduled_date and technician assignment', () => {
      expect(createWorkOrderSchema.safeParse({
        ...validWorkOrder(),
        technician_id: UUID,
        scheduled_date: '2026-01-20',
        scheduled_time: '09:00',
      }).success).toBe(true)
    })

    it('rejects non-UUID technician_id', () => {
      expect(createWorkOrderSchema.safeParse({
        ...validWorkOrder(),
        technician_id: 'bad',
      }).success).toBe(false)
    })

    it('accepts cpe_to_install_id for equipment swaps', () => {
      expect(createWorkOrderSchema.safeParse({
        ...validWorkOrder(),
        type: 'equipment_swap',
        cpe_to_install_id: UUID,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateWorkOrderSchema
// ---------------------------------------------------------------------------

describe('updateWorkOrderSchema', () => {
  it('accepts an empty object', () => {
    expect(updateWorkOrderSchema.safeParse({}).success).toBe(true)
  })

  it('still validates type enum on partial update', () => {
    expect(updateWorkOrderSchema.safeParse({ type: 'survey' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// completeWorkOrderSchema
// ---------------------------------------------------------------------------

describe('completeWorkOrderSchema', () => {
  it('accepts a valid completion with notes', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: UUID,
      completion_notes: 'Instalación completada. ONT configurada, velocidad verificada 10/2 Mbps.',
    }).success).toBe(true)
  })

  it('accepts km_traveled for fuel reimbursement', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: UUID,
      completion_notes: 'Instalación OK.',
      km_traveled: '25.50',
    }).success).toBe(true)
  })

  it('accepts cpe_installed_id for inventory update', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: UUID,
      completion_notes: 'ONT instalada.',
      cpe_installed_id: UUID,
    }).success).toBe(true)
  })

  it('rejects non-UUID work_order_id', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: 'bad',
      completion_notes: 'Done.',
    }).success).toBe(false)
  })

  it('rejects empty completion_notes', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: UUID,
      completion_notes: '',
    }).success).toBe(false)
  })

  it('rejects invalid km_traveled format', () => {
    expect(completeWorkOrderSchema.safeParse({
      work_order_id: UUID,
      completion_notes: 'Done.',
      km_traveled: 'veinte',
    }).success).toBe(false)
  })
})
