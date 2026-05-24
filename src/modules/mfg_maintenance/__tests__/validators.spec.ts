/**
 * Unit tests — mfg_maintenance validators
 *
 * Covers the Zod schemas for equipment, maintenance plans, work orders, and
 * spare parts used in the Manufacturing Maintenance vertical.
 *
 * Venezuelan manufacturing maintenance context:
 *   - Equipment criticality drives priority of maintenance (critical = production stops)
 *   - is_imported flag on spare parts is critical: imported parts require USD payments,
 *     long lead times, and DAU customs paperwork — Venezuelan import reality
 *   - CORPOELEC cuts cause 'breakdown' status on sensitive equipment (PLCs, drives)
 *   - Work orders split by work_type: preventive (planned) / corrective (breakdown) /
 *     predictive (condition-based — vibration, thermography)
 *   - accumulated_hours drives time-based PM trigger intervals
 *   - Bolívar (BS) costs are not tracked here — all costs in USD
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  maintenancePlanCreateSchema,
  maintenancePlanUpdateSchema,
  workOrderCreateSchema,
  workOrderUpdateSchema,
  sparePartCreateSchema,
  sparePartUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid equipment payload. */
const validEquipment = () => ({
  equipment_code: 'EQ-LIN-01',
  name: 'Llenadora automática L1',
})

/** Minimal valid maintenance plan payload. */
const validPlan = () => ({
  equipment_id: UUID,
  equipment_code: 'EQ-LIN-01',
  plan_name: 'PM mensual — lubricación rodamientos',
  trigger_interval: '30',
})

/** Minimal valid work order payload. */
const validWO = () => ({
  wo_number: 'WO-2026-001',
  equipment_id: UUID,
  equipment_code: 'EQ-LIN-01',
  equipment_name: 'Llenadora automática L1',
  description: 'Corte CORPOELEC dañó variador de frecuencia',
})

/** Minimal valid spare part payload. */
const validSparePart = () => ({
  part_code: 'SP-VFD-001',
  part_name: 'Variador de frecuencia 5HP',
})

// ---------------------------------------------------------------------------
// equipmentCreateSchema
// ---------------------------------------------------------------------------

describe('equipmentCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid equipment with defaults', () => {
      const result = equipmentCreateSchema.safeParse(validEquipment())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('operational')
        expect(result.data.criticality).toBe('medium')
        expect(result.data.accumulated_hours).toBe('0.00')
      }
    })

    it('rejects when equipment_code is missing', () => {
      const { equipment_code: _omit, ...rest } = validEquipment()
      expect(equipmentCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validEquipment()
      expect(equipmentCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects equipment_code longer than 30 chars', () => {
      expect(
        equipmentCreateSchema.safeParse({ ...validEquipment(), equipment_code: 'X'.repeat(31) }).success
      ).toBe(false)
    })

    it('rejects manufacture_year below 1900', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), manufacture_year: 1899 }).success).toBe(false)
    })

    it('rejects manufacture_year above 2099', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), manufacture_year: 2100 }).success).toBe(false)
    })

    it('accepts manufacture_year as null (year unknown)', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), manufacture_year: null }).success).toBe(true)
    })

    it('accepts last_overhaul_date as ISO string (coerced to Date)', () => {
      const result = equipmentCreateSchema.safeParse({
        ...validEquipment(),
        last_overhaul_date: '2025-06-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.last_overhaul_date).toBeInstanceOf(Date)
      }
    })

    it('accepts replacement_cost_usd as null (cost not catalogued)', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), replacement_cost_usd: null }).success).toBe(true)
    })

    it('accepts work_center_id as null (portable equipment)', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), work_center_id: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['operational', 'under_maintenance', 'breakdown', 'retired'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), status: 'idle' }).success).toBe(false)
    })
  })

  describe('criticality enum', () => {
    const criticalities = ['critical', 'high', 'medium', 'low'] as const

    test.each(criticalities)('accepts criticality "%s"', (criticality) => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), criticality }).success).toBe(true)
    })

    it('rejects an invalid criticality', () => {
      expect(equipmentCreateSchema.safeParse({ ...validEquipment(), criticality: 'vital' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// equipmentUpdateSchema
// ---------------------------------------------------------------------------

describe('equipmentUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(equipmentUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (breakdown recovery)', () => {
    expect(equipmentUpdateSchema.safeParse({ status: 'operational' }).success).toBe(true)
  })

  it('accepts accumulated_hours-only update', () => {
    expect(equipmentUpdateSchema.safeParse({ accumulated_hours: '4520.50' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(equipmentUpdateSchema.safeParse({ status: 'idle' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// maintenancePlanCreateSchema
// ---------------------------------------------------------------------------

describe('maintenancePlanCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid maintenance plan with defaults', () => {
      const result = maintenancePlanCreateSchema.safeParse(validPlan())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trigger_type).toBe('days')
        expect(result.data.estimated_duration_hrs).toBe('2.00')
        expect(result.data.requires_shutdown).toBe(false)
        expect(result.data.status).toBe('active')
      }
    })

    it('rejects when equipment_id is not a UUID', () => {
      expect(maintenancePlanCreateSchema.safeParse({ ...validPlan(), equipment_id: 'bad' }).success).toBe(false)
    })

    it('rejects when plan_name is missing', () => {
      const { plan_name: _omit, ...rest } = validPlan()
      expect(maintenancePlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts requires_shutdown = true (line stop required)', () => {
      const result = maintenancePlanCreateSchema.safeParse({
        ...validPlan(),
        requires_shutdown: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requires_shutdown).toBe(true)
      }
    })

    it('accepts required_spare_parts as an array of parts', () => {
      const result = maintenancePlanCreateSchema.safeParse({
        ...validPlan(),
        required_spare_parts: [
          { spare_part_id: UUID, part_code: 'SP-001', part_name: 'Rodamiento SKF', quantity: 2 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('accepts required_spare_parts as null (no parts needed)', () => {
      expect(
        maintenancePlanCreateSchema.safeParse({ ...validPlan(), required_spare_parts: null }).success
      ).toBe(true)
    })
  })

  describe('trigger_type enum', () => {
    const types = ['hours', 'days', 'cycles', 'calendar'] as const

    test.each(types)('accepts trigger_type "%s"', (trigger_type) => {
      expect(maintenancePlanCreateSchema.safeParse({ ...validPlan(), trigger_type }).success).toBe(true)
    })

    it('rejects an invalid trigger_type', () => {
      expect(maintenancePlanCreateSchema.safeParse({ ...validPlan(), trigger_type: 'manual' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'overdue', 'paused'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(maintenancePlanCreateSchema.safeParse({ ...validPlan(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(maintenancePlanCreateSchema.safeParse({ ...validPlan(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// maintenancePlanUpdateSchema
// ---------------------------------------------------------------------------

describe('maintenancePlanUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(maintenancePlanUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (active → overdue)', () => {
    expect(maintenancePlanUpdateSchema.safeParse({ status: 'overdue' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// workOrderCreateSchema
// ---------------------------------------------------------------------------

describe('workOrderCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid work order with defaults', () => {
      const result = workOrderCreateSchema.safeParse(validWO())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.work_type).toBe('preventive')
        expect(result.data.priority).toBe('medium')
        expect(result.data.status).toBe('open')
      }
    })

    it('rejects when wo_number is missing', () => {
      const { wo_number: _omit, ...rest } = validWO()
      expect(workOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when description is empty', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), description: '' }).success).toBe(false)
    })

    it('rejects when equipment_id is not a UUID', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), equipment_id: 'bad' }).success).toBe(false)
    })

    it('accepts maintenance_plan_id as null (corrective WO — no plan)', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), maintenance_plan_id: null }).success).toBe(true)
    })

    it('accepts scheduled_date as ISO string (coerced to Date)', () => {
      const result = workOrderCreateSchema.safeParse({
        ...validWO(),
        scheduled_date: '2026-02-01T08:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduled_date).toBeInstanceOf(Date)
      }
    })

    it('accepts assigned_to as null (unassigned)', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), assigned_to: null }).success).toBe(true)
    })
  })

  describe('work_type enum', () => {
    const types = ['preventive', 'corrective', 'predictive'] as const

    test.each(types)('accepts work_type "%s"', (work_type) => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), work_type }).success).toBe(true)
    })

    it('rejects an invalid work_type', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), work_type: 'emergency' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['critical', 'high', 'medium', 'low'] as const

    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), priority }).success).toBe(true)
    })

    it('rejects an invalid priority', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), priority: 'urgent' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['open', 'in_progress', 'completed', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(workOrderCreateSchema.safeParse({ ...validWO(), status: 'draft' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// workOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('workOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(workOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (open → in_progress)', () => {
    expect(workOrderUpdateSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// sparePartCreateSchema
// ---------------------------------------------------------------------------

describe('sparePartCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid spare part with defaults', () => {
      const result = sparePartCreateSchema.safeParse(validSparePart())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.current_stock).toBe('0.0000')
        expect(result.data.uom).toBe('units')
        expect(result.data.reorder_point).toBe('1.0000')
        expect(result.data.safety_stock).toBe('1.0000')
        expect(result.data.is_imported).toBe(false)
        expect(result.data.lead_time_days).toBe(15)
      }
    })

    it('rejects when part_code is missing', () => {
      const { part_code: _omit, ...rest } = validSparePart()
      expect(sparePartCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when part_name is missing', () => {
      const { part_name: _omit, ...rest } = validSparePart()
      expect(sparePartCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts is_imported = true (requires USD payment and customs paperwork)', () => {
      const result = sparePartCreateSchema.safeParse({
        ...validSparePart(),
        is_imported: true,
        lead_time_days: 90,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_imported).toBe(true)
        expect(result.data.lead_time_days).toBe(90)
      }
    })

    it('rejects lead_time_days below 0', () => {
      expect(sparePartCreateSchema.safeParse({ ...validSparePart(), lead_time_days: -1 }).success).toBe(false)
    })

    it('accepts unit_cost_usd as null (cost not catalogued)', () => {
      expect(sparePartCreateSchema.safeParse({ ...validSparePart(), unit_cost_usd: null }).success).toBe(true)
    })

    it('accepts equipment_ids as null (not yet linked to equipment)', () => {
      expect(sparePartCreateSchema.safeParse({ ...validSparePart(), equipment_ids: null }).success).toBe(true)
    })

    it('accepts equipment_ids as an array of UUIDs', () => {
      expect(
        sparePartCreateSchema.safeParse({
          ...validSparePart(),
          equipment_ids: [UUID],
        }).success
      ).toBe(true)
    })

    it('accepts mtbf_days as null (MTBF not yet calculated)', () => {
      expect(sparePartCreateSchema.safeParse({ ...validSparePart(), mtbf_days: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// sparePartUpdateSchema
// ---------------------------------------------------------------------------

describe('sparePartUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(sparePartUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a current_stock-only update (stock receipt)', () => {
    expect(sparePartUpdateSchema.safeParse({ current_stock: '5.0000' }).success).toBe(true)
  })
})
