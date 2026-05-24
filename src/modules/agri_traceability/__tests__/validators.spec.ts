/**
 * Unit tests — agri_traceability validators
 *
 * Cubre el schema Zod para retiros de mercado (recalls) de lotes de
 * producto terminado agroalimentario.
 *
 * Contexto venezolano — inocuidad alimentaria:
 *   - recall_class: clasificación del retiro según nivel de riesgo.
 *     - Class I:   Peligro grave para la salud (contaminación biológica,
 *                  E. coli, Salmonella). Retiro urgente e inmediato.
 *     - Class II:  Riesgo moderado o peligro poco probable. Default.
 *     - Class III: Sin peligro para la salud (etiquetado, empaque).
 *   - detection_source 'insai_alert': alerta del INSAI (Instituto Nacional
 *     de Salud Agrícola Integral) — requiere respuesta inmediata.
 *   - detection_source 'customer_complaint': reclamo de cadena de supermercados.
 *   - public_announcement: false por defecto; true cuando se notifica públicamente
 *     (obligatorio en Class I por regulación SASA).
 *   - affected_clients: lista de clientes con los lotes afectados, para
 *     notificación y recuperación del producto.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  recallCreateSchema,
  recallUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validRecall = () => ({
  recall_number:     'RECALL-2026-001',
  processing_lot_id: UUID,
  lot_number:        'PROD-2026-001',
  reason:            'Resultados positivos de Salmonella spp. en análisis microbiológico del lote',
  detection_source:  'internal_analysis' as const,
  initiated_date:    new Date('2026-01-25'),
})

// ---------------------------------------------------------------------------
// recallCreateSchema
// ---------------------------------------------------------------------------

describe('recallCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid recall with defaults', () => {
      const result = recallCreateSchema.safeParse(validRecall())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.recall_class).toBe('II')
        expect(result.data.status).toBe('investigating')
        expect(result.data.public_announcement).toBe(false)
        expect(result.data.affected_clients).toEqual([])
      }
    })

    const required = ['recall_number', 'processing_lot_id', 'lot_number',
      'reason', 'detection_source', 'initiated_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validRecall() }
      delete (p as Record<string, unknown>)[field]
      expect(recallCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects empty reason', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), reason: '' }).success).toBe(false)
    })

    it('rejects non-UUID processing_lot_id', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), processing_lot_id: 'bad' }).success).toBe(false)
    })
  })

  describe('recall_class — clasificación de riesgo', () => {
    it('accepts Class I (riesgo grave — Salmonella, E. coli)', () => {
      const result = recallCreateSchema.safeParse({ ...validRecall(), recall_class: 'I' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.recall_class).toBe('I')
    })

    it('accepts Class II (riesgo moderado — default)', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), recall_class: 'II' }).success).toBe(true)
    })

    it('accepts Class III (sin riesgo directo — etiquetado)', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), recall_class: 'III' }).success).toBe(true)
    })

    it('rejects invalid recall_class', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), recall_class: 'IV' }).success).toBe(false)
    })
  })

  describe('detection_source enum', () => {
    const sources = [
      'customer_complaint',
      'insai_alert',
      'internal_analysis',
      'supplier_notification',
      'regulatory_audit',
    ] as const

    test.each(sources)('accepts detection_source "%s"', (detection_source) => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), detection_source }).success).toBe(true)
    })

    it('rejects invalid detection_source', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), detection_source: 'media_report' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['investigating', 'executing', 'completed', 'closed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('public_announcement', () => {
    it('accepts public_announcement = true (obligatorio en Class I por SASA)', () => {
      const result = recallCreateSchema.safeParse({
        ...validRecall(),
        recall_class: 'I',
        public_announcement: true,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.public_announcement).toBe(true)
    })
  })

  describe('affected_clients array', () => {
    it('accepts affected clients list for notification and recovery', () => {
      const result = recallCreateSchema.safeParse({
        ...validRecall(),
        affected_clients: [
          { client_id: UUID,  client_name: 'Supermercado La Canasta', quantity_kg: 500 },
          { client_id: UUID2, client_name: 'Distribuidora El Valle',  quantity_kg: 250 },
          { client_name: 'Cliente sin CRM', quantity_kg: 100 },
        ],
        quantity_recalled_kg: '850.000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.affected_clients).toHaveLength(3)
      }
    })

    it('rejects client with non-UUID client_id', () => {
      expect(recallCreateSchema.safeParse({
        ...validRecall(),
        affected_clients: [{ client_id: 'bad', client_name: 'Cliente' }],
      }).success).toBe(false)
    })

    it('accepts clients without client_id (clientes no registrados en CRM)', () => {
      expect(recallCreateSchema.safeParse({
        ...validRecall(),
        affected_clients: [{ client_name: 'Empresa XYZ (sin CRM)' }],
      }).success).toBe(true)
    })

    it('accepts empty affected_clients array (early stage, not yet identified)', () => {
      expect(recallCreateSchema.safeParse({ ...validRecall(), affected_clients: [] }).success).toBe(true)
    })
  })

  describe('corrective_action', () => {
    it('accepts corrective_action for Class I recall documentation', () => {
      expect(recallCreateSchema.safeParse({
        ...validRecall(),
        recall_class: 'I',
        corrective_action: 'Destrucción del lote. Limpieza profunda planta. Auditoría HACCP completa.',
        public_announcement: true,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// recallUpdateSchema — partial patch
// ---------------------------------------------------------------------------

describe('recallUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(recallUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status progress as recall executes', () => {
    expect(recallUpdateSchema.safeParse({ status: 'executing' }).success).toBe(true)
  })

  it('accepts closing after all product recovered', () => {
    expect(recallUpdateSchema.safeParse({
      status: 'closed',
      corrective_action: 'Lote destruido. Todos los clientes notificados.',
    }).success).toBe(true)
  })

  it('still validates recall_class on partial update', () => {
    expect(recallUpdateSchema.safeParse({ recall_class: 'IV' }).success).toBe(false)
  })

  it('still validates detection_source on partial update', () => {
    expect(recallUpdateSchema.safeParse({ detection_source: 'media_report' }).success).toBe(false)
  })
})
