import { z } from 'zod'

export const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  task_number: z.string().min(1).max(30),
  name: z.string().min(1).max(500),
  level: z.coerce.number().min(0).max(5).default(0),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
  planned_start: z.string(),
  planned_end: z.string(),
  actual_start: z.string().optional().nullable(),
  actual_end: z.string().optional().nullable(),
  duration_days: z.coerce.number().min(1).default(1),
  progress_percent: z.string().default('0.00'),
  assigned_to: z.string().max(255).optional().nullable(),
  is_milestone: z.boolean().default(false),
  is_critical: z.boolean().default(false),
  predecessor_ids: z.array(z.string().uuid()).optional().nullable(),
  budget_item_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  sort_order: z.coerce.number().default(0),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createMilestoneSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  milestone_type: z.enum(['start', 'delivery', 'payment', 'inspection', 'permit', 'other']),
  planned_date: z.string(),
  actual_date: z.string().optional().nullable(),
  status: z.enum(['upcoming', 'at_risk', 'achieved', 'delayed']).default('upcoming'),
  linked_valuation: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateMilestoneSchema = createMilestoneSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>
