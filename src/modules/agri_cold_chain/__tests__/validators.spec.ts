/**
 * Unit tests — agri_cold_chain validators
 *
 * Cubre los schemas Zod para la cadena de frío: cuartos de refrigeración,
 * registros de temperatura e historial de lotes.
 *
 * Contexto venezolano:
 *   - min_alert_minutes default 15: alerta de excursión de temperatura.
 *     En Venezuela los micro-cortes de luz son frecuentes y breves (5-10 min).
 *     15 minutos filtra el ruido de micro-cortes sin perder excursiones reales.
 *   - unit_type 'reefer_truck': camión refrigerado para distribución.
 *   - temperatureLogBatchSchema: soporte para carga masiva de datos IoT
 *     (hasta 1000 lecturas por lote desde sensores OTA o descarga manual).
 *   - source 'sensor_push': dato empujado automáticamente por el sensor.
 *   - source 'manual': lectura tomada por el operador cuando no hay sensor.
 *   - storageLotRecord: entrada/salida de lotes de PT en el cuarto de frío.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  coldStorageUnitCreateSchema,
  coldStorageUnitUpdateSchema,
  temperatureLogCreateSchema,
  temperatureLogBatchSchema,
  storageLotRecordCreateSchema,
  storageLotRecordUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validUnit = () => ({
  name:            'Cuarto frío 1 — Cadena de Frío Norte',
  target_temp_min: '0',
  target_temp_max: '4',
})

const validLog = () => ({
  cold_storage_unit_id: UUID,
  temperature_c:        '2.5',
  recorded_at:          new Date('2026-01-20T08:00:00Z'),
})

const validStorageRecord = () => ({
  processing_lot_id:    UUID,
  cold_storage_unit_id: UUID2,
  entered_at:           new Date('2026-01-20T10:30:00Z'),
})

// ---------------------------------------------------------------------------
// coldStorageUnitCreateSchema
// ---------------------------------------------------------------------------

describe('coldStorageUnitCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid unit with defaults', () => {
      const result = coldStorageUnitCreateSchema.safeParse(validUnit())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.unit_type).toBe('chill_room')
        expect(result.data.min_alert_minutes).toBe(15)
        expect(result.data.status).toBe('active')
      }
    })

    const required = ['name', 'target_temp_min', 'target_temp_max'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validUnit() }
      delete (p as Record<string, unknown>)[field]
      expect(coldStorageUnitCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('unit_type enum', () => {
    const types = ['chill_room', 'freezer', 'refrigerator', 'reefer_truck'] as const

    test.each(types)('accepts unit_type "%s"', (unit_type) => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), unit_type }).success).toBe(true)
    })

    it('rejects invalid unit_type', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), unit_type: 'cooler' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'maintenance', 'offline'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), status: 'broken' }).success).toBe(false)
    })
  })

  describe('min_alert_minutes — Venezuelan power context', () => {
    it('accepts 1 minute (sensor de alta precisión)', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), min_alert_minutes: 1 }).success).toBe(true)
    })

    it('accepts 15 minutes (default — filtra micro-cortes CORPOELEC)', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), min_alert_minutes: 15 }).success).toBe(true)
    })

    it('accepts 120 minutes (máximo)', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), min_alert_minutes: 120 }).success).toBe(true)
    })

    it('rejects 0 minutes', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), min_alert_minutes: 0 }).success).toBe(false)
    })

    it('rejects 121 minutes', () => {
      expect(coldStorageUnitCreateSchema.safeParse({ ...validUnit(), min_alert_minutes: 121 }).success).toBe(false)
    })
  })

  describe('temperature ranges', () => {
    it('accepts freezer with negative temp range', () => {
      expect(coldStorageUnitCreateSchema.safeParse({
        ...validUnit(),
        unit_type: 'freezer',
        target_temp_min: '-20',
        target_temp_max: '-15',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// coldStorageUnitUpdateSchema
// ---------------------------------------------------------------------------

describe('coldStorageUnitUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(coldStorageUnitUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates unit_type enum on partial update', () => {
    expect(coldStorageUnitUpdateSchema.safeParse({ unit_type: 'cooler' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// temperatureLogCreateSchema
// ---------------------------------------------------------------------------

describe('temperatureLogCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid log with defaults', () => {
      const result = temperatureLogCreateSchema.safeParse(validLog())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toBe('sensor_push')
      }
    })

    const required = ['cold_storage_unit_id', 'temperature_c', 'recorded_at'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validLog() }
      delete (p as Record<string, unknown>)[field]
      expect(temperatureLogCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID cold_storage_unit_id', () => {
      expect(temperatureLogCreateSchema.safeParse({ ...validLog(), cold_storage_unit_id: 'bad' }).success).toBe(false)
    })
  })

  describe('source enum', () => {
    const sources = ['sensor_push', 'batch_upload', 'manual'] as const

    test.each(sources)('accepts source "%s"', (source) => {
      expect(temperatureLogCreateSchema.safeParse({ ...validLog(), source }).success).toBe(true)
    })

    it('rejects invalid source', () => {
      expect(temperatureLogCreateSchema.safeParse({ ...validLog(), source: 'api' }).success).toBe(false)
    })
  })

  describe('optional humidity', () => {
    it('accepts humidity reading', () => {
      expect(temperatureLogCreateSchema.safeParse({ ...validLog(), humidity_pct: '85.5' }).success).toBe(true)
    })

    it('accepts null humidity (sensor without hygrometer)', () => {
      expect(temperatureLogCreateSchema.safeParse({ ...validLog(), humidity_pct: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// temperatureLogBatchSchema — IoT batch upload
// ---------------------------------------------------------------------------

describe('temperatureLogBatchSchema', () => {
  it('accepts a valid batch with multiple readings', () => {
    const result = temperatureLogBatchSchema.safeParse({
      cold_storage_unit_id: UUID,
      readings: [
        { temperature_c: '2.5', recorded_at: new Date('2026-01-20T08:00:00Z') },
        { temperature_c: '2.8', recorded_at: new Date('2026-01-20T08:15:00Z') },
        { temperature_c: '3.1', recorded_at: new Date('2026-01-20T08:30:00Z') },
      ],
      source: 'batch_upload',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty readings array', () => {
    expect(temperatureLogBatchSchema.safeParse({
      cold_storage_unit_id: UUID,
      readings: [],
    }).success).toBe(false)
  })

  it('rejects more than 1000 readings', () => {
    const readings = Array.from({ length: 1001 }, (_, i) => ({
      temperature_c: '2.5',
      recorded_at: new Date(Date.now() + i * 60000),
    }))
    expect(temperatureLogBatchSchema.safeParse({ cold_storage_unit_id: UUID, readings }).success).toBe(false)
  })

  it('accepts exactly 1000 readings (máximo permitido)', () => {
    const readings = Array.from({ length: 1000 }, (_, i) => ({
      temperature_c: '2.5',
      recorded_at: new Date(Date.now() + i * 60000),
    }))
    expect(temperatureLogBatchSchema.safeParse({ cold_storage_unit_id: UUID, readings }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// storageLotRecordCreateSchema
// ---------------------------------------------------------------------------

describe('storageLotRecordCreateSchema', () => {
  it('accepts a minimal valid storage record', () => {
    expect(storageLotRecordCreateSchema.safeParse(validStorageRecord()).success).toBe(true)
  })

  it('rejects non-UUID processing_lot_id', () => {
    expect(storageLotRecordCreateSchema.safeParse({ ...validStorageRecord(), processing_lot_id: 'bad' }).success).toBe(false)
  })

  it('accepts entry_temp_c for cold-chain verification', () => {
    expect(storageLotRecordCreateSchema.safeParse({ ...validStorageRecord(), entry_temp_c: '2.1' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// storageLotRecordUpdateSchema — extend with exit fields
// ---------------------------------------------------------------------------

describe('storageLotRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(storageLotRecordUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts exit fields when lot leaves cold storage', () => {
    expect(storageLotRecordUpdateSchema.safeParse({
      exited_at:   new Date('2026-01-22T06:00:00Z'),
      exit_temp_c: '2.8',
      status:      'exited',
    }).success).toBe(true)
  })

  it('accepts status recalled for inocuidad incidents', () => {
    expect(storageLotRecordUpdateSchema.safeParse({ status: 'recalled' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(storageLotRecordUpdateSchema.safeParse({ status: 'disposed' }).success).toBe(false)
  })
})
