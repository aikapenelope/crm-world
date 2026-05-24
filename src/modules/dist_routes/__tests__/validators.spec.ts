/**
 * Unit tests — dist_routes validators
 *
 * Covers the Zod schemas for distribution routes, stops, visits, and list
 * queries used in the Distribution Routes vertical.
 *
 * Venezuelan distribution routes context:
 *   - Routes (rutas de distribución): structured daily circuits covering a
 *     geographic zone; fundamental in Venezuelan FMCG distribution
 *   - day_of_week: 0=Sunday...6=Saturday — weekly route schedule
 *   - zone: zona comercial (e.g., 'Zulia Norte', 'Caracas Este') — groups
 *     routes for supervisory reporting
 *   - vehicle_plate: placa del vehículo — required by INTT (Instituto
 *     Nacional de Transporte Terrestre) for cargo vehicles in Venezuela
 *   - createStopSchema: parada de ruta — each stop is a customer delivery
 *     point; sequence_order determines visit order on the route
 *   - createVisitSchema: registro de visita — daily execution record;
 *     status 'no_order' means client was visited but didn't buy
 *     (important for KPI measurement of coverage vs efectividad)
 *   - status 'order_taken': pedido levantado en campo — van-selling model
 *     common in Venezuelan FMCG distribution
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createRouteSchema,
  updateRouteSchema,
  createStopSchema,
  updateStopSchema,
  createVisitSchema,
  updateVisitSchema,
  listRoutesSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid route payload. */
const validRoute = () => ({
  name: 'Ruta Maracaibo Norte',
  code: 'RT-MBO-N01',
})

/** Minimal valid stop payload. */
const validStop = () => ({
  route_id: UUID,
  customer_id: UUID2,
})

/** Minimal valid visit payload. */
const validVisit = () => ({
  route_id: UUID,
  stop_id: UUID2,
  visit_date: '2026-01-15',
})

// ---------------------------------------------------------------------------
// createRouteSchema
// ---------------------------------------------------------------------------

describe('createRouteSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid route with defaults', () => {
      const result = createRouteSchema.safeParse(validRoute())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validRoute()
      expect(createRouteSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validRoute()
      expect(createRouteSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts day_of_week 0 (domingo) to 6 (sábado)', () => {
      for (const d of [0, 1, 2, 3, 4, 5, 6]) {
        expect(createRouteSchema.safeParse({ ...validRoute(), day_of_week: d }).success).toBe(true)
      }
    })

    it('rejects day_of_week below 0', () => {
      expect(createRouteSchema.safeParse({ ...validRoute(), day_of_week: -1 }).success).toBe(false)
    })

    it('rejects day_of_week above 6', () => {
      expect(createRouteSchema.safeParse({ ...validRoute(), day_of_week: 7 }).success).toBe(false)
    })

    it('coerces day_of_week from string', () => {
      const result = createRouteSchema.safeParse({ ...validRoute(), day_of_week: '1' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.day_of_week).toBe(1)
    })

    it('accepts day_of_week as null (variable-day route)', () => {
      expect(createRouteSchema.safeParse({ ...validRoute(), day_of_week: null }).success).toBe(true)
    })

    it('accepts optional fields as null', () => {
      expect(
        createRouteSchema.safeParse({
          ...validRoute(),
          zone: null,
          assigned_seller_id: null,
          assigned_driver_id: null,
          vehicle_plate: null,
          notes: null,
        }).success
      ).toBe(true)
    })

    it('accepts assigned_seller_id and assigned_driver_id as UUIDs', () => {
      expect(
        createRouteSchema.safeParse({
          ...validRoute(),
          assigned_seller_id: UUID,
          assigned_driver_id: UUID2,
        }).success
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRouteSchema
// ---------------------------------------------------------------------------

describe('updateRouteSchema', () => {
  it('accepts an empty object', () => {
    expect(updateRouteSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating route)', () => {
    expect(updateRouteSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('accepts vehicle_plate reassignment', () => {
    expect(updateRouteSchema.safeParse({ vehicle_plate: 'AB123CD' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createStopSchema
// ---------------------------------------------------------------------------

describe('createStopSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid stop with defaults', () => {
      const result = createStopSchema.safeParse(validStop())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sequence_order).toBe(0)
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when route_id is not a UUID', () => {
      expect(createStopSchema.safeParse({ ...validStop(), route_id: 'bad' }).success).toBe(false)
    })

    it('rejects when customer_id is not a UUID', () => {
      expect(createStopSchema.safeParse({ ...validStop(), customer_id: 'bad' }).success).toBe(false)
    })

    it('coerces sequence_order from string', () => {
      const result = createStopSchema.safeParse({ ...validStop(), sequence_order: '5' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.sequence_order).toBe(5)
    })

    it('accepts optional fields as null', () => {
      expect(
        createStopSchema.safeParse({
          ...validStop(),
          address: null,
          contact_phone: null,
          delivery_notes: null,
        }).success
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateStopSchema
// ---------------------------------------------------------------------------

describe('updateStopSchema', () => {
  it('accepts an empty object', () => {
    expect(updateStopSchema.safeParse({}).success).toBe(true)
  })

  it('accepts sequence_order-only update (reordering stops)', () => {
    expect(updateStopSchema.safeParse({ sequence_order: 3 }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createVisitSchema
// ---------------------------------------------------------------------------

describe('createVisitSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid visit with defaults', () => {
      const result = createVisitSchema.safeParse(validVisit())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('planned')
      }
    })

    it('rejects when route_id is not a UUID', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), route_id: 'bad' }).success).toBe(false)
    })

    it('rejects when stop_id is not a UUID', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), stop_id: 'bad' }).success).toBe(false)
    })

    it('rejects when visit_date is empty', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), visit_date: '' }).success).toBe(false)
    })

    it('accepts visit_date as plain string (not Date)', () => {
      const result = createVisitSchema.safeParse(validVisit())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.visit_date).toBe('string')
        expect(result.data.visit_date).toBe('2026-01-15')
      }
    })

    it('accepts order_id as null (visit without sale)', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), order_id: null }).success).toBe(true)
    })

    it('accepts order_id as UUID (order_taken visit)', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), order_id: UUID, status: 'order_taken' }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['planned', 'visited', 'skipped', 'order_taken', 'no_order'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createVisitSchema.safeParse({ ...validVisit(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createVisitSchema.safeParse({ ...validVisit(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateVisitSchema
// ---------------------------------------------------------------------------

describe('updateVisitSchema', () => {
  it('accepts an empty object', () => {
    expect(updateVisitSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (planned → visited)', () => {
    expect(updateVisitSchema.safeParse({ status: 'visited' }).success).toBe(true)
  })

  it('accepts order_id update when order is taken', () => {
    expect(updateVisitSchema.safeParse({ status: 'order_taken', order_id: UUID }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listRoutesSchema
// ---------------------------------------------------------------------------

describe('listRoutesSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listRoutesSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listRoutesSchema.safeParse({ page: '2', pageSize: '20' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(2)
  })

  it('coerces day_of_week filter from string', () => {
    const result = listRoutesSchema.safeParse({ day_of_week: '1' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.day_of_week).toBe(1)
  })

  it('accepts search filter', () => {
    expect(listRoutesSchema.safeParse({ search: 'maracaibo' }).success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listRoutesSchema.safeParse({ zone: 'Norte' }).success).toBe(true)
  })
})
