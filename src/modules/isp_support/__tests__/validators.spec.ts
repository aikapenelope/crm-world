/**
 * Unit tests — isp_support validators
 *
 * Cubre los schemas Zod para el sistema de tickets de soporte y registro
 * de averías de red ISP.
 *
 * Contexto venezolano:
 *   - origin 'whatsapp': canal principal de soporte en Venezuela;
 *     'automatic_monitoring': tickets generados por Zabbix/PRTG.
 *   - type 'fault': avería de servicio (más urgente).
 *   - OUTAGE_CAUSES incluye 'power_outage' (cortes CORPOELEC) y 'theft'
 *     (robo de cable o equipos, frecuente en zonas rurales).
 *   - priority 'critical': para averías masivas que afectan a muchos abonados.
 *   - sla_hours: tiempo máximo de resolución según el contrato del abonado.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  resolveTicketSchema,
  addCommentSchema,
  createOutageSchema,
  resolveOutageSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validTicket = () => ({
  type:    'fault' as const,
  subject: 'Sin servicio de internet — no conecta',
})

// ---------------------------------------------------------------------------
// createTicketSchema
// ---------------------------------------------------------------------------

describe('createTicketSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid ticket with defaults', () => {
      const result = createTicketSchema.safeParse(validTicket())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.origin).toBe('manual')
        expect(result.data.priority).toBe('normal')
      }
    })

    it('rejects when type is missing', () => {
      const { type: _omit, ...rest } = validTicket()
      expect(createTicketSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when subject is missing', () => {
      const { subject: _omit, ...rest } = validTicket()
      expect(createTicketSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('type enum', () => {
    const types = ['fault', 'inquiry', 'plan_change', 'move', 'new_service', 'complaint'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createTicketSchema.safeParse({ ...validTicket(), type }).success).toBe(true)
    })

    it('rejects invalid type', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), type: 'billing' }).success).toBe(false)
    })
  })

  describe('origin enum — canales venezolanos', () => {
    const origins = ['manual', 'whatsapp', 'phone', 'portal', 'automatic_monitoring'] as const

    test.each(origins)('accepts origin "%s"', (origin) => {
      expect(createTicketSchema.safeParse({ ...validTicket(), origin }).success).toBe(true)
    })

    it('rejects invalid origin', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), origin: 'email' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['low', 'normal', 'high', 'critical'] as const

    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createTicketSchema.safeParse({ ...validTicket(), priority }).success).toBe(true)
    })

    it('rejects invalid priority', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), priority: 'urgent' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts subscriber_id UUID for subscriber-linked ticket', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), subscriber_id: UUID }).success).toBe(true)
    })

    it('rejects non-UUID subscriber_id', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), subscriber_id: 'bad' }).success).toBe(false)
    })

    it('accepts sla_hours for SLA tracking', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), sla_hours: 4 }).success).toBe(true)
    })

    it('rejects sla_hours = 0', () => {
      expect(createTicketSchema.safeParse({ ...validTicket(), sla_hours: 0 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateTicketSchema
// ---------------------------------------------------------------------------

describe('updateTicketSchema', () => {
  it('accepts an empty object', () => {
    expect(updateTicketSchema.safeParse({}).success).toBe(true)
  })

  it('still validates type enum on partial update', () => {
    expect(updateTicketSchema.safeParse({ type: 'billing' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// assignTicketSchema
// ---------------------------------------------------------------------------

describe('assignTicketSchema', () => {
  it('accepts valid ticket and technician UUIDs', () => {
    expect(assignTicketSchema.safeParse({ ticket_id: UUID, technician_id: UUID2 }).success).toBe(true)
  })

  it('rejects non-UUID ticket_id', () => {
    expect(assignTicketSchema.safeParse({ ticket_id: 'bad', technician_id: UUID2 }).success).toBe(false)
  })

  it('rejects missing technician_id', () => {
    expect(assignTicketSchema.safeParse({ ticket_id: UUID }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolveTicketSchema
// ---------------------------------------------------------------------------

describe('resolveTicketSchema', () => {
  it('accepts valid resolution', () => {
    expect(resolveTicketSchema.safeParse({
      ticket_id: UUID,
      solution: 'Se reinició el equipo CPE del abonado. Servicio restaurado.',
    }).success).toBe(true)
  })

  it('rejects empty solution', () => {
    expect(resolveTicketSchema.safeParse({ ticket_id: UUID, solution: '' }).success).toBe(false)
  })

  it('rejects missing ticket_id', () => {
    expect(resolveTicketSchema.safeParse({ solution: 'Resuelto' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addCommentSchema
// ---------------------------------------------------------------------------

describe('addCommentSchema', () => {
  it('accepts a valid internal comment (default)', () => {
    const result = addCommentSchema.safeParse({
      ticket_id: UUID,
      comment: 'El técnico confirmó acceso al nodo.',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_internal).toBe(true)
  })

  it('accepts is_internal = false (visible al abonado en portal)', () => {
    expect(addCommentSchema.safeParse({
      ticket_id: UUID,
      comment: 'Estamos trabajando en su caso.',
      is_internal: false,
    }).success).toBe(true)
  })

  it('rejects empty comment', () => {
    expect(addCommentSchema.safeParse({ ticket_id: UUID, comment: '' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createOutageSchema — averías masivas
// ---------------------------------------------------------------------------

describe('createOutageSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid outage with defaults', () => {
      const result = createOutageSchema.safeParse({
        node_id: UUID,
        cause: 'power_outage',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.affected_subscribers).toBe(0)
      }
    })

    it('rejects missing node_id', () => {
      expect(createOutageSchema.safeParse({ cause: 'fiber_cut' }).success).toBe(false)
    })

    it('rejects non-UUID node_id', () => {
      expect(createOutageSchema.safeParse({ node_id: 'bad', cause: 'power_outage' }).success).toBe(false)
    })
  })

  describe('cause enum — causas venezolanas', () => {
    const causes = ['power_outage', 'fiber_cut', 'equipment_failure',
      'maintenance', 'weather', 'theft', 'unknown'] as const

    test.each(causes)('accepts cause "%s"', (cause) => {
      expect(createOutageSchema.safeParse({ node_id: UUID, cause }).success).toBe(true)
    })

    it('rejects invalid cause', () => {
      expect(createOutageSchema.safeParse({ node_id: UUID, cause: 'vandalism' }).success).toBe(false)
    })
  })

  describe('affected_subscribers', () => {
    it('accepts count > 0 for known affected abonados', () => {
      expect(createOutageSchema.safeParse({
        node_id: UUID, cause: 'fiber_cut', affected_subscribers: 150,
      }).success).toBe(true)
    })

    it('rejects negative affected_subscribers', () => {
      expect(createOutageSchema.safeParse({
        node_id: UUID, cause: 'power_outage', affected_subscribers: -1,
      }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// resolveOutageSchema
// ---------------------------------------------------------------------------

describe('resolveOutageSchema', () => {
  it('accepts valid resolution', () => {
    expect(resolveOutageSchema.safeParse({
      outage_id: UUID,
      resolution_notes: 'Cable de fibra reparado. Todos los abonados reconectados.',
    }).success).toBe(true)
  })

  it('rejects empty resolution_notes', () => {
    expect(resolveOutageSchema.safeParse({ outage_id: UUID, resolution_notes: '' }).success).toBe(false)
  })
})
