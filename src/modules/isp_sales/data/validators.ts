import { z } from 'zod'

const LEAD_SOURCES  = ['whatsapp', 'instagram', 'referral', 'website', 'cold_call', 'other'] as const
const LEAD_STATUS   = ['new', 'coverage_check', 'quoted', 'scheduled', 'installed', 'lost'] as const
const LOST_REASONS  = ['price', 'no_coverage', 'chose_competitor', 'not_responsive', 'other'] as const
const TECH_OPTIONS  = ['fiber', 'wireless', 'both'] as const

export const createCoverageZoneSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  node_id: z.string().uuid(),
  has_coverage: z.boolean().default(true),
  technology_available: z.enum(TECH_OPTIONS).default('wireless'),
  max_speed_mbps: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
})
export const updateCoverageZoneSchema = createCoverageZoneSchema.partial()

export const createLeadSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(7).max(30),
  email: z.string().email().nullable().optional(),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  source: z.enum(LEAD_SOURCES).default('whatsapp'),
  referral_subscriber_id: z.string().uuid().nullable().optional(),
  interested_plan_id: z.string().uuid().nullable().optional(),
  assigned_agent_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
})
export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(LEAD_STATUS).optional(),
  coverage_status: z.enum(['covered', 'not_covered', 'waitlist']).nullable().optional(),
  coverage_zone_id: z.string().uuid().nullable().optional(),
  lost_reason: z.enum(LOST_REASONS).nullable().optional(),
  installation_date: z.string().date().nullable().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
