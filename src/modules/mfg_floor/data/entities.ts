import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgShiftReport — Reporte de Turno
// =============================================================================

/**
 * Resumen generado automáticamente al cierre de cada turno.
 * Se genera por el worker close-shift.ts cuando llega la hora
 * de fin de turno (6:00, 14:00, 22:00 hora Venezuela).
 *
 * Dos valores clave de OEE se calculan:
 *   oee_total_pct    = OEE incluyendo todos los paros (benchmark real)
 *   oee_internal_pct = OEE excluyendo paros por corte eléctrico CORPOELEC
 *                      Este es el OEE que refleja la eficiencia real del equipo
 *                      y del equipo de producción, sin fuerza mayor.
 *
 * whatsapp_sent = true cuando el reporte ya se envió al gerente de planta
 * vía la notificación push del sistema (WhatsApp Business API del tenant).
 */
@Entity({ tableName: 'mfg_shift_reports' })
export class MfgShiftReportEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** TURNO-2026-001-M — número único por turno */
  @Property({ type: 'text', length: 50 })
  report_number!: string

  /** morning | afternoon | night */
  @Property({ type: 'text', length: 15 })
  shift_type!: string

  @Property({ type: 'date' })
  shift_date!: Date

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'timestamptz' })
  shift_start!: Date

  @Property({ type: 'timestamptz', nullable: true })
  shift_end?: Date | null

  @Property({ type: 'uuid', nullable: true })
  supervisor_id?: string | null

  /** Producción planificada para este turno (según MPS/órdenes) */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_production: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  actual_production: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  rejected_units: string = '0.0000'

  @Property({ type: 'text', length: 20, nullable: true })
  production_uom?: string | null

  /** Horas totales de paro en el turno */
  @Property({ type: 'decimal', precision: 6, scale: 4 })
  total_downtime_hrs: string = '0.0000'

  /** Horas de paro por corte eléctrico CORPOELEC (fuerza mayor) */
  @Property({ type: 'decimal', precision: 6, scale: 4 })
  electrical_downtime_hrs: string = '0.0000'

  /** Horas de paro por causas internas (mecánica, material, calidad, etc.) */
  @Property({ type: 'decimal', precision: 6, scale: 4 })
  internal_downtime_hrs: string = '0.0000'

  /** OEE total del turno (incluye paros eléctricos) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  oee_total_pct?: string | null

  /** OEE interno del turno (excluye paros CORPOELEC — eficiencia real) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  oee_internal_pct?: string | null

  @Property({ type: 'text', nullable: true })
  observations?: string | null

  /** true cuando el reporte fue enviado al gerente de planta por WhatsApp */
  @Property({ type: 'boolean', default: false })
  whatsapp_sent: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgOeeHistory — Histórico de OEE por centro de trabajo y día
// =============================================================================

/**
 * Registro histórico del OEE desglosado en sus 3 componentes:
 *   Disponibilidad × Rendimiento × Calidad = OEE
 *
 * Estándar World-Class OEE:
 *   Disponibilidad ≥ 90%
 *   Rendimiento    ≥ 95%
 *   Calidad        ≥ 99.9%
 *   OEE total      ≥ 85%
 *
 * Para Venezuela, el oee_internal_pct es el KPI relevante para
 * evaluar al equipo de producción, ya que los cortes de CORPOELEC
 * son completamente fuera de su control.
 *
 * Este registro se crea automáticamente al cerrar cada turno.
 * Alimenta el dashboard de tendencias y los análisis semanales/mensuales.
 */
@Entity({ tableName: 'mfg_oee_history' })
export class MfgOeeHistoryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  work_center_id!: string

  @Property({ type: 'text', length: 30 })
  work_center_code!: string

  @Property({ type: 'text', length: 255 })
  work_center_name!: string

  @Property({ type: 'date' })
  record_date!: Date

  @Property({ type: 'text', length: 15 })
  shift_type!: string

  /** Horas de producción disponibles (sin incluir paros) */
  @Property({ type: 'decimal', precision: 6, scale: 4 })
  available_hrs: string = '8.0000'

  @Property({ type: 'decimal', precision: 6, scale: 4 })
  downtime_hrs_total: string = '0.0000'

  @Property({ type: 'decimal', precision: 6, scale: 4 })
  downtime_hrs_electrical: string = '0.0000'

  @Property({ type: 'decimal', precision: 6, scale: 4 })
  downtime_hrs_internal: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_quantity: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  actual_quantity: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  rejected_quantity: string = '0.0000'

  /** Disponibilidad = (available - downtime_total) / available × 100 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  oee_availability_pct: string = '0.00'

  /** Disponibilidad interna = (available - downtime_internal) / available × 100 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  oee_internal_pct: string = '0.00'

  /** Rendimiento = actual / planned × 100 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  oee_performance_pct: string = '0.00'

  /** Calidad = (actual - rejected) / actual × 100 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  oee_quality_pct: string = '0.00'

  /** OEE total = availability × performance × quality / 10000 */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  oee_total_pct: string = '0.00'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
