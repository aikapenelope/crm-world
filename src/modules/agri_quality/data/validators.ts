import { z } from 'zod'

const ccpDefinitionSchema = z.object({
  id:                z.string(),
  name:              z.string(),
  parameter:         z.string().optional(),
  limit_min:         z.number().nullable().optional(),
  limit_max:         z.number().nullable().optional(),
  unit:              z.string().optional(),
  monitoring_freq:   z.string().optional(),
  monitoring_method: z.string().optional(),
  corrective_action: z.string().optional(),
})

export const haccpPlanCreateSchema = z.object({
  name:                    z.string().min(1).max(255),
  process:                 z.enum(['beneficio', 'procesamiento', 'almacenamiento', 'despacho', 'general']),
  version:                 z.string().max(20).default('v1.0'),
  approved_by:             z.string().max(255).optional().nullable(),
  approved_date:           z.coerce.date().optional().nullable(),
  status:                  z.enum(['draft', 'active', 'superseded']).default('draft'),
  critical_control_points: z.array(ccpDefinitionSchema).default([]),
  notes:                   z.string().optional().nullable(),
})
export const haccpPlanUpdateSchema = haccpPlanCreateSchema.partial()

export const ccpMonitoringRecordCreateSchema = z.object({
  haccp_plan_id:          z.string().uuid(),
  ccp_id:                 z.string().max(20),
  ccp_name:               z.string().max(255),
  monitoring_date:        z.coerce.date(),
  monitoring_time:        z.string().max(10).optional().nullable(),
  measured_value:         z.string(),
  unit:                   z.string().max(20).default('°C'),
  limit_min:              z.string().optional().nullable(),
  limit_max:              z.string().optional().nullable(),
  is_deviation:           z.boolean().default(false),
  corrective_action_taken: z.string().optional().nullable(),
  processing_lot_id:      z.string().uuid().optional().nullable(),
  notes:                  z.string().optional().nullable(),
})
export const ccpMonitoringRecordUpdateSchema = ccpMonitoringRecordCreateSchema.partial()

export const nonConformityCreateSchema = z.object({
  nc_number:        z.string().min(1).max(50),
  source:           z.enum(['ccp_deviation', 'temperature_excursion', 'microbiological', 'physical', 'chemical', 'bpm_checklist', 'external_audit', 'complaint']),
  severity:         z.enum(['critical', 'major', 'minor']).default('major'),
  description:      z.string().min(1),
  affected_lot_id:  z.string().uuid().optional().nullable(),
  detection_date:   z.coerce.date(),
  status:           z.enum(['open', 'investigating', 'pending_decision', 'resolved', 'closed']).default('open'),
  root_cause:       z.string().optional().nullable(),
  decision:         z.enum(['rework', 'destroy', 'release', 'hold']).optional().nullable(),
  decision_date:    z.coerce.date().optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  preventive_action: z.string().optional().nullable(),
  notes:            z.string().optional().nullable(),
})
export const nonConformityUpdateSchema = nonConformityCreateSchema.partial()

const bpmItemSchema = z.object({
  item:        z.string(),
  status:      z.enum(['ok', 'fail', 'na']),
  observation: z.string().optional().default(''),
})

export const bpmChecklistCreateSchema = z.object({
  checklist_type:     z.enum(['cleaning_disinfection', 'personal_hygiene', 'pest_control', 'equipment_calibration', 'general_bpm']),
  area:               z.string().min(1).max(100),
  check_date:         z.coerce.date(),
  shift:              z.enum(['morning', 'afternoon', 'night']).optional().nullable(),
  items:              z.array(bpmItemSchema).default([]),
  overall_result:     z.enum(['pass', 'fail', 'conditional']).default('pass'),
  findings:           z.string().optional().nullable(),
  corrective_actions: z.string().optional().nullable(),
})
export const bpmChecklistUpdateSchema = bpmChecklistCreateSchema.partial()
