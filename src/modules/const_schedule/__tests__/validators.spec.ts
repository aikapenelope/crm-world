/**
 * Unit tests — const_schedule validators
 *
 * Covers the Zod schemas for Gantt tasks and project milestones used in the
 * Construction Schedule vertical.
 *
 * Venezuelan construction schedule context:
 *   - is_critical = true: Ruta Crítica (Critical Path Method) — delays block
 *     the entire project; used for EOT (Extension of Time) claims
 *   - is_milestone: hito contractual — triggers payment valuation in many
 *     Venezuelan public contracts (Ley de Contrataciones Públicas)
 *   - milestone_type 'payment': hito de pago — linked_valuation triggers
 *     automatic valuation draft when milestone is achieved
 *   - milestone_type 'permit': permisos INAVI, Ingeniería Municipal,
 *     MPPEUV — bureaucratic delays common in Venezuela
 *   - status 'at_risk': alerta temprana — common due to material scarcity,
 *     FX delays, and CORPOELEC interruptions on site
 *   - Dates stored as plain strings (YYYY-MM-DD) — no timezone coercion
 *   - predecessor_ids: lista de predecesoras para lógica de red del cronograma
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createTaskSchema,
  updateTaskSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid task payload. */
const validTask = () => ({
  project_id: UUID,
  task_number: '1.1',
  name: 'Excavación y movimiento de tierra',
  planned_start: '2026-03-01',
  planned_end: '2026-03-15',
})

/** Minimal valid milestone payload. */
const validMilestone = () => ({
  project_id: UUID,
  name: 'Fundación completada',
  milestone_type: 'delivery' as const,
  planned_date: '2026-04-30',
})

// ---------------------------------------------------------------------------
// createTaskSchema
// ---------------------------------------------------------------------------

describe('createTaskSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid task with defaults', () => {
      const result = createTaskSchema.safeParse(validTask())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('not_started')
        expect(result.data.level).toBe(0)
        expect(result.data.duration_days).toBe(1)
        expect(result.data.progress_percent).toBe('0.00')
        expect(result.data.is_milestone).toBe(false)
        expect(result.data.is_critical).toBe(false)
        expect(result.data.sort_order).toBe(0)
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when task_number is missing', () => {
      const { task_number: _omit, ...rest } = validTask()
      expect(createTaskSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when planned_start is missing', () => {
      const { planned_start: _omit, ...rest } = validTask()
      expect(createTaskSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when planned_end is missing', () => {
      const { planned_end: _omit, ...rest } = validTask()
      expect(createTaskSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts planned_start and planned_end as plain strings (not Date)', () => {
      const result = createTaskSchema.safeParse(validTask())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.planned_start).toBe('string')
        expect(result.data.planned_start).toBe('2026-03-01')
      }
    })

    it('rejects duration_days below 1', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), duration_days: 0 }).success).toBe(false)
    })

    it('coerces duration_days from string', () => {
      const result = createTaskSchema.safeParse({ ...validTask(), duration_days: '14' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.duration_days).toBe(14)
      }
    })

    it('rejects level above 5', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), level: 6 }).success).toBe(false)
    })

    it('accepts is_critical = true (ruta crítica)', () => {
      const result = createTaskSchema.safeParse({ ...validTask(), is_critical: true })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_critical).toBe(true)
      }
    })

    it('accepts is_milestone = true (hito contractual)', () => {
      const result = createTaskSchema.safeParse({ ...validTask(), is_milestone: true })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_milestone).toBe(true)
      }
    })

    it('accepts predecessor_ids as array of UUIDs', () => {
      const result = createTaskSchema.safeParse({
        ...validTask(),
        predecessor_ids: [UUID, UUID2],
      })
      expect(result.success).toBe(true)
    })

    it('accepts predecessor_ids as null (first task — no predecessors)', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), predecessor_ids: null }).success).toBe(true)
    })

    it('accepts actual_start and actual_end as null (task not started)', () => {
      expect(
        createTaskSchema.safeParse({
          ...validTask(),
          actual_start: null,
          actual_end: null,
        }).success
      ).toBe(true)
    })

    it('accepts parent_id as null (top-level task)', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), parent_id: null }).success).toBe(true)
    })

    it('accepts budget_item_id as null (non-budgeted task)', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), budget_item_id: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createTaskSchema.safeParse({ ...validTask(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createTaskSchema.safeParse({ ...validTask(), status: 'blocked' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateTaskSchema
// ---------------------------------------------------------------------------

describe('updateTaskSchema', () => {
  it('accepts an empty object', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a progress_percent-only update', () => {
    expect(updateTaskSchema.safeParse({ progress_percent: '45.00' }).success).toBe(true)
  })

  it('accepts a status-only update (not_started → in_progress)', () => {
    expect(updateTaskSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateTaskSchema.safeParse({ status: 'blocked' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createMilestoneSchema
// ---------------------------------------------------------------------------

describe('createMilestoneSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid milestone with defaults', () => {
      const result = createMilestoneSchema.safeParse(validMilestone())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('upcoming')
        expect(result.data.linked_valuation).toBe(false)
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validMilestone()
      expect(createMilestoneSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when planned_date is missing', () => {
      const { planned_date: _omit, ...rest } = validMilestone()
      expect(createMilestoneSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts planned_date as plain string (not Date)', () => {
      const result = createMilestoneSchema.safeParse(validMilestone())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.planned_date).toBe('string')
        expect(result.data.planned_date).toBe('2026-04-30')
      }
    })

    it('accepts linked_valuation = true (hito de pago — triggers valuation)', () => {
      const result = createMilestoneSchema.safeParse({
        ...validMilestone(),
        milestone_type: 'payment',
        linked_valuation: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.linked_valuation).toBe(true)
      }
    })

    it('accepts actual_date as null (milestone not yet achieved)', () => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), actual_date: null }).success).toBe(true)
    })
  })

  describe('milestone_type enum', () => {
    const types = ['start', 'delivery', 'payment', 'inspection', 'permit', 'other'] as const

    test.each(types)('accepts milestone_type "%s"', (milestone_type) => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), milestone_type }).success).toBe(true)
    })

    it('rejects an invalid milestone_type', () => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), milestone_type: 'warranty' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['upcoming', 'at_risk', 'achieved', 'delayed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createMilestoneSchema.safeParse({ ...validMilestone(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateMilestoneSchema
// ---------------------------------------------------------------------------

describe('updateMilestoneSchema', () => {
  it('accepts an empty object', () => {
    expect(updateMilestoneSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (upcoming → at_risk)', () => {
    expect(updateMilestoneSchema.safeParse({ status: 'at_risk' }).success).toBe(true)
  })

  it('accepts actual_date update on achievement', () => {
    expect(updateMilestoneSchema.safeParse({ status: 'achieved', actual_date: '2026-04-28' }).success).toBe(true)
  })
})
