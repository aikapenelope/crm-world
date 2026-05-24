/**
 * Unit tests — agri_quality validators
 *
 * Cubre los schemas Zod para el sistema de calidad agroalimentario:
 * Planes HACCP, monitoreo de PCCs, no-conformidades y checklists BPM.
 *
 * Contexto venezolano — inocuidad alimentaria:
 *   - HACCP (Hazard Analysis Critical Control Points): obligatorio para plantas
 *     de beneficio que exportan o venden a cadenas de supermercados.
 *   - process 'beneficio': matanza y despiece avícola.
 *   - ccpMonitoringRecord: temperatura de la línea de chilling (meta < 4°C).
 *     is_deviation = true activa workflow no_conformidad_ccp_v1 automáticamente.
 *   - nonConformity source 'temperature_excursion': excursión en cuarto frío
 *     (frecuente por cortes CORPOELEC).
 *   - decision 'destroy': destrucción del lote afectado (trazabilidad obligatoria).
 *   - BPM (Buenas Prácticas de Manufactura): por turno, con items de verificación.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  haccpPlanCreateSchema,
  haccpPlanUpdateSchema,
  ccpMonitoringRecordCreateSchema,
  ccpMonitoringRecordUpdateSchema,
  nonConformityCreateSchema,
  nonConformityUpdateSchema,
  bpmChecklistCreateSchema,
  bpmChecklistUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validPlan = () => ({
  name:    'HACCP Plan — Planta de Beneficio Avícola 2026',
  process: 'beneficio' as const,
})

const validCcpRecord = () => ({
  haccp_plan_id:   UUID,
  ccp_id:          'CCP-01',
  ccp_name:        'Temperatura de chilling',
  monitoring_date: new Date('2026-01-20'),
  measured_value:  '3.8',
})

const validNc = () => ({
  nc_number:      'NC-2026-001',
  source:         'ccp_deviation' as const,
  description:    'Temperatura de chilling superó 4°C durante 35 minutos',
  detection_date: new Date('2026-01-20'),
})

const validChecklist = () => ({
  checklist_type: 'cleaning_disinfection' as const,
  area:           'Sala de beneficio',
  check_date:     new Date('2026-01-20'),
})

// ---------------------------------------------------------------------------
// haccpPlanCreateSchema
// ---------------------------------------------------------------------------

describe('haccpPlanCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid plan with defaults', () => {
      const result = haccpPlanCreateSchema.safeParse(validPlan())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('v1.0')
        expect(result.data.status).toBe('draft')
        expect(result.data.critical_control_points).toEqual([])
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validPlan()
      expect(haccpPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when process is missing', () => {
      const { process: _omit, ...rest } = validPlan()
      expect(haccpPlanCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('process enum — líneas de producción venezolanas', () => {
    const processes = ['beneficio', 'procesamiento', 'almacenamiento', 'despacho', 'general'] as const

    test.each(processes)('accepts process "%s"', (process) => {
      expect(haccpPlanCreateSchema.safeParse({ ...validPlan(), process }).success).toBe(true)
    })

    it('rejects invalid process', () => {
      expect(haccpPlanCreateSchema.safeParse({ ...validPlan(), process: 'packaging' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['draft', 'active', 'superseded'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(haccpPlanCreateSchema.safeParse({ ...validPlan(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(haccpPlanCreateSchema.safeParse({ ...validPlan(), status: 'archived' }).success).toBe(false)
    })
  })

  describe('critical_control_points array', () => {
    it('accepts CCP definitions for chilling and internal temperature', () => {
      const result = haccpPlanCreateSchema.safeParse({
        ...validPlan(),
        critical_control_points: [
          { id: 'CCP-01', name: 'Temperatura de chilling', parameter: 'Temperatura',
            limit_min: 0, limit_max: 4, unit: '°C', monitoring_freq: 'Continuo' },
          { id: 'CCP-02', name: 'Temperatura interna carcasa', parameter: 'Temperatura',
            limit_max: 7, unit: '°C', monitoring_freq: 'Por lote' },
        ],
      })
      expect(result.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// haccpPlanUpdateSchema
// ---------------------------------------------------------------------------

describe('haccpPlanUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(haccpPlanUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates process enum on partial update', () => {
    expect(haccpPlanUpdateSchema.safeParse({ process: 'packaging' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ccpMonitoringRecordCreateSchema
// ---------------------------------------------------------------------------

describe('ccpMonitoringRecordCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid monitoring record with defaults', () => {
      const result = ccpMonitoringRecordCreateSchema.safeParse(validCcpRecord())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.unit).toBe('°C')
        expect(result.data.is_deviation).toBe(false)
      }
    })

    const required = ['haccp_plan_id', 'ccp_id', 'ccp_name', 'monitoring_date', 'measured_value'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validCcpRecord() }
      delete (p as Record<string, unknown>)[field]
      expect(ccpMonitoringRecordCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('deviation detection', () => {
    it('accepts is_deviation = true with corrective action (triggers NC workflow)', () => {
      const result = ccpMonitoringRecordCreateSchema.safeParse({
        ...validCcpRecord(),
        measured_value: '5.2',
        limit_max: '4',
        is_deviation: true,
        corrective_action_taken: 'Reducción inmediata de temperatura. Lote en cuarentena.',
        processing_lot_id: UUID,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_deviation).toBe(true)
    })

    it('accepts limit range fields for context', () => {
      expect(ccpMonitoringRecordCreateSchema.safeParse({
        ...validCcpRecord(),
        limit_min: '0',
        limit_max: '4',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// ccpMonitoringRecordUpdateSchema
// ---------------------------------------------------------------------------

describe('ccpMonitoringRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(ccpMonitoringRecordUpdateSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// nonConformityCreateSchema
// ---------------------------------------------------------------------------

describe('nonConformityCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid NC with defaults', () => {
      const result = nonConformityCreateSchema.safeParse(validNc())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.severity).toBe('major')
        expect(result.data.status).toBe('open')
      }
    })

    const required = ['nc_number', 'source', 'description', 'detection_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validNc() }
      delete (p as Record<string, unknown>)[field]
      expect(nonConformityCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects empty description', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), description: '' }).success).toBe(false)
    })
  })

  describe('source enum — orígenes venezolanos', () => {
    const sources = ['ccp_deviation', 'temperature_excursion', 'microbiological',
      'physical', 'chemical', 'bpm_checklist', 'external_audit', 'complaint'] as const

    test.each(sources)('accepts source "%s"', (source) => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), source }).success).toBe(true)
    })

    it('rejects invalid source', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), source: 'customer_report' }).success).toBe(false)
    })
  })

  describe('severity enum', () => {
    const severities = ['critical', 'major', 'minor'] as const

    test.each(severities)('accepts severity "%s"', (severity) => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), severity }).success).toBe(true)
    })

    it('rejects invalid severity', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), severity: 'moderate' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['open', 'investigating', 'pending_decision', 'resolved', 'closed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('decision enum', () => {
    const decisions = ['rework', 'destroy', 'release', 'hold'] as const

    test.each(decisions)('accepts decision "%s"', (decision) => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), decision }).success).toBe(true)
    })

    it('rejects invalid decision', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), decision: 'donate' }).success).toBe(false)
    })

    it('accepts null decision before investigation is complete', () => {
      expect(nonConformityCreateSchema.safeParse({ ...validNc(), decision: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// nonConformityUpdateSchema
// ---------------------------------------------------------------------------

describe('nonConformityUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(nonConformityUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts closing a resolved NC', () => {
    expect(nonConformityUpdateSchema.safeParse({
      status: 'closed',
      decision: 'destroy',
      corrective_action: 'Lote destruido. Procedimiento de limpieza reforzado.',
    }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// bpmChecklistCreateSchema
// ---------------------------------------------------------------------------

describe('bpmChecklistCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid checklist with defaults', () => {
      const result = bpmChecklistCreateSchema.safeParse(validChecklist())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overall_result).toBe('pass')
        expect(result.data.items).toEqual([])
      }
    })

    const required = ['checklist_type', 'area', 'check_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validChecklist() }
      delete (p as Record<string, unknown>)[field]
      expect(bpmChecklistCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('checklist_type enum', () => {
    const types = ['cleaning_disinfection', 'personal_hygiene', 'pest_control',
      'equipment_calibration', 'general_bpm'] as const

    test.each(types)('accepts checklist_type "%s"', (checklist_type) => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), checklist_type }).success).toBe(true)
    })

    it('rejects invalid checklist_type', () => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), checklist_type: 'temperature' }).success).toBe(false)
    })
  })

  describe('shift enum', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift "%s"', (shift) => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), shift }).success).toBe(true)
    })

    it('accepts null shift (checklist sin turno específico)', () => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), shift: null }).success).toBe(true)
    })
  })

  describe('overall_result enum', () => {
    const results = ['pass', 'fail', 'conditional'] as const

    test.each(results)('accepts overall_result "%s"', (overall_result) => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), overall_result }).success).toBe(true)
    })

    it('rejects invalid overall_result', () => {
      expect(bpmChecklistCreateSchema.safeParse({ ...validChecklist(), overall_result: 'partial' }).success).toBe(false)
    })
  })

  describe('items array', () => {
    it('accepts checklist items with ok/fail/na status', () => {
      const result = bpmChecklistCreateSchema.safeParse({
        ...validChecklist(),
        items: [
          { item: 'Pisos limpios y secos', status: 'ok', observation: '' },
          { item: 'Utensilios desinfectados', status: 'fail', observation: 'Encontrado residuo en cuchillo #3' },
          { item: 'Área de empaque', status: 'na', observation: 'No aplica hoy' },
        ],
        overall_result: 'fail',
        findings: 'Cuchillo #3 con residuo orgánico.',
        corrective_actions: 'Re-lavado y sanitización inmediata.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects item with invalid status', () => {
      expect(bpmChecklistCreateSchema.safeParse({
        ...validChecklist(),
        items: [{ item: 'Piso', status: 'pending' }],
      }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// bpmChecklistUpdateSchema
// ---------------------------------------------------------------------------

describe('bpmChecklistUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(bpmChecklistUpdateSchema.safeParse({}).success).toBe(true)
  })
})
