import { z } from 'zod'

const SUBSCRIBER_TYPES = ['residential', 'pyme', 'corporate', 'wholesale'] as const
const SERVICE_STATUSES = [
  'pending_installation', 'active', 'suspended_overdue',
  'suspended_voluntary', 'pending_change_plan', 'cancelled',
] as const
const CONTRACT_TYPES = ['monthly', 'annual', 'special'] as const

export const createSubscriberSchema = z.object({
  customer_entity_id: z.string().uuid().nullable().optional(),
  account_number: z.string().min(1).max(20),
  subscriber_type: z.enum(SUBSCRIBER_TYPES).default('residential'),
  plan_id: z.string().uuid().nullable().optional(),
  node_id: z.string().uuid().nullable().optional(),
  monthly_price_usd: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  installation_address: z.string().min(1),
  installation_city: z.string().min(1).max(100),
  installation_state: z.string().max(100).nullable().optional(),
  coordinates_lat: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  coordinates_lng: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  reference_description: z.string().nullable().optional(),
  ip_address: z.string().max(45).nullable().optional(),
  mac_address: z.string().regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).nullable().optional(),
  pppoe_username: z.string().max(100).nullable().optional(),
  billing_cycle_day: z.number().int().min(1).max(28).default(1),
  cut_policy_days: z.number().int().min(1).max(60).default(7),
  assigned_agent_id: z.string().uuid().nullable().optional(),
  technical_contact_name: z.string().max(255).nullable().optional(),
  technical_contact_phone: z.string().max(30).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const updateSubscriberSchema = createSubscriberSchema.partial()

export const changeStatusSchema = z.object({
  subscriber_id: z.string().uuid(),
  new_status: z.enum(SERVICE_STATUSES),
  reason: z.string().max(500).optional(),
})

export const createContractSchema = z.object({
  subscriber_id: z.string().uuid(),
  contract_number: z.string().min(1).max(30),
  contract_type: z.enum(CONTRACT_TYPES).default('monthly'),
  start_date: z.string().date(),
  end_date: z.string().date().nullable().optional(),
  monthly_price_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  installation_fee_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
  deposit_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
  penalty_clause: z.string().nullable().optional(),
  document_url: z.string().url().nullable().optional(),
})

export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>
