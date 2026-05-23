import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgWorker — Operario de Manufactura
// =============================================================================

/**
 * Registro de cada operario de planta con sus habilidades y turno asignado.
 *
 * qualified_operations define qué operaciones del routing puede ejecutar.
 * Un operario calificado en ["mezcla", "extrusión"] no puede asignarse a
 * ["empaque"] sin capacitación previa.
 * Esto evita errores humanos al asignar personal en el piso de planta.
 *
 * Bimoneda LOTTT:
 *   hourly_rate_bs = salario básico en bolívares (se actualiza con decretos)
 *   El sistema calcula automáticamente:
 *     - Recargo nocturno +30% (LOTTT Art. 118): turno noche = rate × 1.30
 *     - Horas extra diurnas +25% (LOTTT Art. 118): hora extra día = rate × 1.25
 *     - Horas extra nocturnas +75% (LOTTT Art. 118): hora extra noche = rate × 1.75
 */
@Entity({ tableName: 'mfg_workers' })
export class MfgWorkerEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** OP-001, MEC-034 */
  @Property({ type: 'text', length: 30 })
  employee_code!: string

  @Property({ type: 'text', length: 255 })
  full_name!: string

  /** Cédula de identidad venezolana */
  @Property({ type: 'text', length: 15, nullable: true })
  cedula?: string | null

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  /** morning | afternoon | night | rotating */
  @Property({ type: 'text', length: 15 })
  shift_type: string = 'morning'

  /**
   * Operaciones del routing que este operario puede ejecutar.
   * Ejemplo: ["mezcla", "extrusion", "control_calidad"]
   */
  @Property({ type: 'jsonb', nullable: true })
  qualified_operations?: string[] | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'date', nullable: true })
  hire_date?: Date | null

  /** Salario base por hora en bolívares (se actualiza periódicamente por decretos) */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  hourly_rate_bs?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// MfgShift — Turno de Producción
// =============================================================================

/**
 * Registro de un turno específico con su plantilla y resultados.
 * Complementa MfgShiftReport (de mfg_floor) con el componente de RRHH:
 * quién trabajó, cuánto produjeron, si califican para bonus.
 *
 * Se crea automáticamente cuando el worker close-shift de mfg_floor
 * cierra el turno, o manualmente por el supervisor.
 */
@Entity({ tableName: 'mfg_shifts' })
export class MfgShiftEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'date' })
  shift_date!: Date

  /** morning | afternoon | night */
  @Property({ type: 'text', length: 15 })
  shift_type!: string

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'int' })
  workers_count: number = 0

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  planned_production?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  actual_production?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  production_uom?: string | null

  /** planned | active | completed */
  @Property({ type: 'text', length: 20 })
  status: string = 'planned'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgLaborTracking — Registro de Horas-Hombre por Orden
// =============================================================================

/**
 * Horas reales de cada operario asignadas a una orden de producción.
 * Alimenta el cálculo del costo de mano de obra en mfg_costs.
 *
 * Multiplicadores LOTTT para el cálculo de total_wages_bs:
 *   Turno normal diurno:     1.00 × hourly_rate_bs × hours_worked
 *   Turno normal nocturno:   1.30 × hourly_rate_bs × hours_worked  (recargo 30%)
 *   Hora extra diurna:       1.25 × hourly_rate_bs × hours_extra
 *   Hora extra nocturna:     1.75 × hourly_rate_bs × hours_extra
 *
 * is_night_shift y is_overtime se establecen automáticamente basados
 * en el shift_type y las horas trabajadas.
 */
@Entity({ tableName: 'mfg_labor_tracking' })
export class MfgLaborTrackingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  worker_id!: string

  @Property({ type: 'text', length: 255 })
  worker_name!: string

  @Property({ type: 'uuid' })
  production_order_id!: string

  @Property({ type: 'text', length: 50 })
  order_number!: string

  @Property({ type: 'uuid', nullable: true })
  operation_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  operation_name?: string | null

  @Property({ type: 'date' })
  work_date!: Date

  @Property({ type: 'text', length: 15 })
  shift_type!: string

  @Property({ type: 'decimal', precision: 6, scale: 2 })
  hours_worked!: string

  /** true si estas horas son tiempo extra (LOTTT: +25% diurno, +75% nocturno) */
  @Property({ type: 'boolean', default: false })
  is_overtime: boolean = false

  /** true si es turno nocturno (LOTTT: +30% recargo) */
  @Property({ type: 'boolean', default: false })
  is_night_shift: boolean = false

  /** Tarifa base en Bs al momento del registro */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  hourly_rate_bs?: string | null

  /** Total calculado con multiplicadores LOTTT: horas × tarifa × factor */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  total_wages_bs?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// MfgProductionBonus — Bono de Producción
// =============================================================================

/**
 * Bono por cumplimiento de cuota de producción.
 * Muy comunes en plantas venezolanas para motivar la eficiencia del turno.
 *
 * El bono se calcula al cierre del turno o período:
 *   achievement_pct = actual_quantity / planned_quantity × 100
 *   Si achievement_pct >= umbral (ej: 90%), se activa el bono.
 *   El monto total se divide entre todos los operarios del turno.
 *
 * Ejemplo:
 *   Turno noche produjo 950 kg de 1,000 kg planificados (95%).
 *   Bono total: Bs 50,000 ÷ 8 operarios = Bs 6,250 por persona.
 *
 * Para efectos contables, el bonus se suma al costo de mano de obra
 * de las órdenes del período (alimenta mfg_costs labor_variance).
 */
@Entity({ tableName: 'mfg_production_bonuses' })
export class MfgProductionBonusEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** BONUS-2026-001 */
  @Property({ type: 'text', length: 50 })
  bonus_number!: string

  @Property({ type: 'uuid', nullable: true })
  production_order_id?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  order_number?: string | null

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'date' })
  period_start!: Date

  @Property({ type: 'date' })
  period_end!: Date

  @Property({ type: 'text', length: 15, nullable: true })
  shift_type?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_quantity!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  actual_quantity!: string

  @Property({ type: 'text', length: 20, nullable: true })
  uom?: string | null

  /** actual / planned × 100 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  achievement_pct!: string

  /** Monto total del bono en bolívares */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  bonus_amount_bs!: string

  @Property({ type: 'int' })
  workers_count: number = 1

  /** bonus_amount_bs / workers_count */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  bonus_per_worker_bs!: string

  /** calculated | approved | paid */
  @Property({ type: 'text', length: 20 })
  status: string = 'calculated'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
