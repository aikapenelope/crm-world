import { z } from 'zod'

export const coldStorageUnitCreateSchema = z.object({
  name:              z.string().min(1).max(255),
  unit_type:         z.enum(['chill_room', 'freezer', 'refrigerator', 'reefer_truck']).default('chill_room'),
  target_temp_min:   z.string(),
  target_temp_max:   z.string(),
  capacity_tons:     z.string().optional().nullable(),
  sensor_id:         z.string().max(100).optional().nullable(),
  min_alert_minutes: z.number().int().min(1).max(120).default(15),
  alert_phone:       z.string().max(20).optional().nullable(),
  status:            z.enum(['active', 'maintenance', 'offline']).default('active'),
  location_description: z.string().optional().nullable(),
})
export const coldStorageUnitUpdateSchema = coldStorageUnitCreateSchema.partial()

export const temperatureLogCreateSchema = z.object({
  cold_storage_unit_id: z.string().uuid(),
  temperature_c:        z.string(),
  humidity_pct:         z.string().optional().nullable(),
  recorded_at:          z.coerce.date(),
  source:               z.enum(['sensor_push', 'batch_upload', 'manual']).default('sensor_push'),
})

export const temperatureLogBatchSchema = z.object({
  cold_storage_unit_id: z.string().uuid(),
  readings: z.array(z.object({
    temperature_c: z.string(),
    humidity_pct:  z.string().optional().nullable(),
    recorded_at:   z.coerce.date(),
  })).min(1).max(1000),
  source: z.enum(['sensor_push', 'batch_upload', 'manual']).default('batch_upload'),
})

export const storageLotRecordCreateSchema = z.object({
  processing_lot_id:    z.string().uuid(),
  cold_storage_unit_id: z.string().uuid(),
  entered_at:           z.coerce.date(),
  entry_temp_c:         z.string().optional().nullable(),
  notes:                z.string().optional().nullable(),
})
export const storageLotRecordUpdateSchema = storageLotRecordCreateSchema.partial().extend({
  exited_at:   z.coerce.date().optional().nullable(),
  exit_temp_c: z.string().optional().nullable(),
  status:      z.enum(['active', 'exited', 'recalled']).optional(),
})
