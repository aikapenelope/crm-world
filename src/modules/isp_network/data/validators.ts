import { z } from 'zod'

const NODE_TYPES = ['pop_principal', 'nodo_distribucion', 'nodo_acceso', 'repetidora'] as const
const NODE_STATUS = ['active', 'degraded', 'offline', 'maintenance'] as const
const SEGMENT_TYPES = ['fiber', 'wireless', 'coax'] as const
const CPE_TYPES = ['router', 'ont', 'antenna', 'switch', 'other'] as const
const CPE_STATUS = ['in_stock', 'deployed', 'in_repair', 'written_off'] as const

// ---------------------------------------------------------------------------
// Network nodes
// ---------------------------------------------------------------------------

export const createNodeSchema = z.object({
  name: z.string().min(1).max(100),
  node_type: z.enum(NODE_TYPES),
  status: z.enum(NODE_STATUS).default('active'),
  city: z.string().min(1).max(100),
  address: z.string().max(500).nullable().optional(),
  coordinates_lat: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  coordinates_lng: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  total_capacity_mbps: z.number().int().positive().nullable().optional(),
  used_capacity_mbps: z.number().int().min(0).nullable().optional(),
  total_ports: z.number().int().positive().nullable().optional(),
  used_ports: z.number().int().min(0).nullable().optional(),
  equipment_model: z.string().max(100).nullable().optional(),
  equipment_serial: z.string().max(100).nullable().optional(),
  power_provider: z.string().max(100).nullable().optional(),
  has_generator: z.boolean().default(false),
  battery_hours: z.number().int().min(0).nullable().optional(),
  parent_node_id: z.string().uuid().nullable().optional(),
  monitoring_host: z.string().max(200).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const updateNodeSchema = createNodeSchema.partial()

// ---------------------------------------------------------------------------
// Network segments
// ---------------------------------------------------------------------------

export const createSegmentSchema = z.object({
  node_from_id: z.string().uuid(),
  node_to_id: z.string().uuid(),
  segment_type: z.enum(SEGMENT_TYPES),
  distance_km: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  capacity_mbps: z.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'degraded', 'offline']).default('active'),
  installation_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const updateSegmentSchema = createSegmentSchema.partial()

// ---------------------------------------------------------------------------
// CPE inventory
// ---------------------------------------------------------------------------

export const createCpeSchema = z.object({
  cpe_type: z.enum(CPE_TYPES),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  serial_number: z.string().min(1).max(100),
  mac_address: z.string().regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).nullable().optional(),
  status: z.enum(CPE_STATUS).default('in_stock'),
  purchase_price_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  purchase_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const updateCpeSchema = createCpeSchema.partial()

export type CreateNodeInput = z.infer<typeof createNodeSchema>
export type CreateCpeInput = z.infer<typeof createCpeSchema>
