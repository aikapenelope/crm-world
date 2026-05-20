import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  project_type: z.enum(['residential', 'commercial', 'infrastructure', 'industrial', 'renovation']),
  status: z.enum(['prospect', 'bidding', 'awarded', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('prospect'),
  client_id: z.string().uuid().optional().nullable(),
  client_name: z.string().min(1).max(255),
  client_type: z.enum(['private', 'public']).default('private'),
  location: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  contract_number: z.string().max(100).optional().nullable(),
  contract_type: z.enum(['fixed_price', 'unit_price', 'cost_plus', 'design_build']),
  contract_amount: z.string(),
  currency: z.string().max(10).default('USD'),
  start_date: z.string().optional().nullable(),
  planned_end_date: z.string().optional().nullable(),
  advance_percent: z.string().default('0.00'),
  retention_percent: z.string().default('10.00'),
  project_manager: z.string().max(255).optional().nullable(),
  site_supervisor: z.string().max(255).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const listProjectsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  project_type: z.string().optional(),
  client_type: z.string().optional(),
}).passthrough()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
