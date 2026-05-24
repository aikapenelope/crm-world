/**
 * Unit tests — isp_network validators
 *
 * Cubre los schemas Zod para la infraestructura de red ISP: nodos, segmentos
 * de enlace y equipos CPE (Customer Premises Equipment).
 *
 * Contexto venezolano:
 *   - Topología: POP principal → nodos de distribución → nodos de acceso.
 *   - has_generator: crítico en Venezuela por los cortes CORPOELEC;
 *     battery_hours indica cuántas horas aguanta sin luz.
 *   - NODE_STATUS incluye 'degraded' (voltaje bajo, enlaces saturados).
 *   - CPE: router, ONT (GPON fiber), antena (wireless), switch, otros.
 *   - CPE lifecycle: in_stock → deployed → in_repair → written_off.
 *   - mac_address IEEE format (AA:BB:CC:DD:EE:FF) para inventario.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createNodeSchema,
  updateNodeSchema,
  createSegmentSchema,
  updateSegmentSchema,
  createCpeSchema,
  updateCpeSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validNode = () => ({
  name:      'Nodo Valencia Centro',
  node_type: 'nodo_acceso' as const,
  city:      'Valencia',
})

const validSegment = () => ({
  node_from_id:  UUID,
  node_to_id:    UUID2,
  segment_type:  'fiber' as const,
})

const validCpe = () => ({
  cpe_type:      'router' as const,
  brand:         'MikroTik',
  model:         'hAP ac3',
  serial_number: 'SN-2026-001234',
})

// ---------------------------------------------------------------------------
// createNodeSchema
// ---------------------------------------------------------------------------

describe('createNodeSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid node with defaults', () => {
      const result = createNodeSchema.safeParse(validNode())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
        expect(result.data.has_generator).toBe(false)
      }
    })

    const required = ['name', 'node_type', 'city'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validNode() }
      delete (p as Record<string, unknown>)[field]
      expect(createNodeSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('node_type enum', () => {
    const types = ['pop_principal', 'nodo_distribucion', 'nodo_acceso', 'repetidora'] as const

    test.each(types)('accepts node_type "%s"', (node_type) => {
      expect(createNodeSchema.safeParse({ ...validNode(), node_type }).success).toBe(true)
    })

    it('rejects invalid node_type', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), node_type: 'datacenter' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'degraded', 'offline', 'maintenance'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createNodeSchema.safeParse({ ...validNode(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), status: 'unknown' }).success).toBe(false)
    })
  })

  describe('Venezuelan power resilience', () => {
    it('accepts has_generator = true with battery_hours', () => {
      const result = createNodeSchema.safeParse({
        ...validNode(),
        has_generator: true,
        battery_hours: 8,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.has_generator).toBe(true)
        expect(result.data.battery_hours).toBe(8)
      }
    })

    it('rejects negative battery_hours', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), battery_hours: -1 }).success).toBe(false)
    })

    it('accepts 0 battery_hours (no batería)', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), battery_hours: 0 }).success).toBe(true)
    })
  })

  describe('capacity tracking', () => {
    it('accepts capacity and port counts', () => {
      expect(createNodeSchema.safeParse({
        ...validNode(),
        total_capacity_mbps: 1000,
        used_capacity_mbps: 350,
        total_ports: 48,
        used_ports: 32,
      }).success).toBe(true)
    })

    it('rejects non-positive total_capacity_mbps', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), total_capacity_mbps: 0 }).success).toBe(false)
    })

    it('accepts used_capacity_mbps = 0', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), used_capacity_mbps: 0 }).success).toBe(true)
    })
  })

  describe('hierarchy (parent_node_id)', () => {
    it('accepts parent_node_id UUID for hierarchical topology', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), parent_node_id: UUID }).success).toBe(true)
    })

    it('rejects non-UUID parent_node_id', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), parent_node_id: 'bad' }).success).toBe(false)
    })

    it('accepts null parent_node_id (POP root node)', () => {
      expect(createNodeSchema.safeParse({ ...validNode(), parent_node_id: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateNodeSchema
// ---------------------------------------------------------------------------

describe('updateNodeSchema', () => {
  it('accepts an empty object', () => {
    expect(updateNodeSchema.safeParse({}).success).toBe(true)
  })

  it('still validates node_type enum on partial update', () => {
    expect(updateNodeSchema.safeParse({ node_type: 'invalid' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createSegmentSchema
// ---------------------------------------------------------------------------

describe('createSegmentSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid segment with defaults', () => {
      const result = createSegmentSchema.safeParse(validSegment())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    const required = ['node_from_id', 'node_to_id', 'segment_type'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validSegment() }
      delete (p as Record<string, unknown>)[field]
      expect(createSegmentSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID node_from_id', () => {
      expect(createSegmentSchema.safeParse({ ...validSegment(), node_from_id: 'bad' }).success).toBe(false)
    })
  })

  describe('segment_type enum', () => {
    const types = ['fiber', 'wireless', 'coax'] as const

    test.each(types)('accepts segment_type "%s"', (segment_type) => {
      expect(createSegmentSchema.safeParse({ ...validSegment(), segment_type }).success).toBe(true)
    })

    it('rejects invalid segment_type', () => {
      expect(createSegmentSchema.safeParse({ ...validSegment(), segment_type: 'copper' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateSegmentSchema
// ---------------------------------------------------------------------------

describe('updateSegmentSchema', () => {
  it('accepts an empty object', () => {
    expect(updateSegmentSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createCpeSchema
// ---------------------------------------------------------------------------

describe('createCpeSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid CPE with defaults', () => {
      const result = createCpeSchema.safeParse(validCpe())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('in_stock')
      }
    })

    const required = ['cpe_type', 'brand', 'model', 'serial_number'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validCpe() }
      delete (p as Record<string, unknown>)[field]
      expect(createCpeSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('cpe_type enum', () => {
    const types = ['router', 'ont', 'antenna', 'switch', 'other'] as const

    test.each(types)('accepts cpe_type "%s"', (cpe_type) => {
      expect(createCpeSchema.safeParse({ ...validCpe(), cpe_type }).success).toBe(true)
    })

    it('rejects invalid cpe_type', () => {
      expect(createCpeSchema.safeParse({ ...validCpe(), cpe_type: 'modem' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['in_stock', 'deployed', 'in_repair', 'written_off'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createCpeSchema.safeParse({ ...validCpe(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(createCpeSchema.safeParse({ ...validCpe(), status: 'lost' }).success).toBe(false)
    })
  })

  describe('mac_address IEEE format', () => {
    it('accepts valid MAC address', () => {
      expect(createCpeSchema.safeParse({ ...validCpe(), mac_address: 'DC:2C:6E:A0:B1:C2' }).success).toBe(true)
    })

    it('rejects MAC with wrong separator', () => {
      expect(createCpeSchema.safeParse({ ...validCpe(), mac_address: 'DC-2C-6E-A0-B1-C2' }).success).toBe(false)
    })

    it('accepts null mac_address (no leído al ingresar al inventario)', () => {
      expect(createCpeSchema.safeParse({ ...validCpe(), mac_address: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateCpeSchema
// ---------------------------------------------------------------------------

describe('updateCpeSchema', () => {
  it('accepts an empty object', () => {
    expect(updateCpeSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change to in_repair', () => {
    expect(updateCpeSchema.safeParse({ status: 'in_repair' }).success).toBe(true)
  })

  it('still validates cpe_type enum on partial update', () => {
    expect(updateCpeSchema.safeParse({ cpe_type: 'modem' }).success).toBe(false)
  })
})
