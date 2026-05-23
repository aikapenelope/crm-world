import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriHaccpPlan — Plan HACCP por Proceso Productivo
// =============================================================================

/**
 * El plan HACCP define los Puntos Críticos de Control (PCCs) para un
 * proceso productivo específico (beneficio, procesamiento, almacenamiento).
 *
 * El campo `critical_control_points` almacena las definiciones de los PCCs:
 * [
 *   {
 *     "id": "CCP-1",
 *     "name": "Temperatura de escaldado",
 *     "parameter": "temperature",
 *     "limit_min": null,
 *     "limit_max": 62,
 *     "unit": "°C",
 *     "monitoring_freq": "cada 15 min",
 *     "monitoring_method": "termómetro calibrado",
 *     "corrective_action": "Ajustar temperatura y retener lote"
 *   }
 * ]
 */
@Entity({ tableName: 'agri_haccp_plans' })
export class AgriHaccpPlanEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** beneficio | procesamiento | almacenamiento | despacho | general */
  @Property({ type: 'text', length: 30 })
  process!: string

  @Property({ type: 'text', length: 20 })
  version: string = 'v1.0'

  @Property({ type: 'text', length: 255, nullable: true })
  approved_by?: string | null

  @Property({ type: 'date', nullable: true })
  approved_date?: Date | null

  /** draft | active | superseded */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  /** Array JSON de definiciones de PCCs */
  @Property({ type: 'json' })
  critical_control_points: object[] = []

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
// AgriCcpMonitoringRecord — Registro de Monitoreo de PCC
// =============================================================================

/**
 * Cada medición de un Punto Crítico de Control en tiempo real.
 * Si `is_deviation` = true (medición fuera de límite), el sistema crea
 * automáticamente una AgriNonConformity y bloquea el lote en proceso.
 *
 * Este registro es la evidencia requerida por las auditorías HACCP y es
 * referenciado en la documentación de inocuidad para exportación.
 */
@Entity({ tableName: 'agri_ccp_monitoring_records' })
export class AgriCcpMonitoringRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  haccp_plan_id!: string

  /** "CCP-1" — ID del PCC dentro del plan HACCP */
  @Property({ type: 'text', length: 20 })
  ccp_id!: string

  @Property({ type: 'text', length: 255 })
  ccp_name!: string

  @Property({ type: 'date' })
  monitoring_date!: Date

  /** HH:MM — hora exacta de la medición */
  @Property({ type: 'text', length: 10, nullable: true })
  monitoring_time?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 3 })
  measured_value!: string

  /** °C | pH | ppm | % | aw */
  @Property({ type: 'text', length: 20 })
  unit: string = '°C'

  @Property({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  limit_min?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  limit_max?: string | null

  /** true si measured_value < limit_min OR measured_value > limit_max */
  @Property({ type: 'boolean', default: false })
  is_deviation: boolean = false

  @Property({ type: 'text', nullable: true })
  corrective_action_taken?: string | null

  @Property({ type: 'uuid', nullable: true })
  verified_by?: string | null

  /** ID de la no-conformidad creada cuando is_deviation = true */
  @Property({ type: 'uuid', nullable: true })
  non_conformity_id?: string | null

  /** Lote de procesamiento en curso cuando se registró esta medición */
  @Property({ type: 'uuid', nullable: true })
  processing_lot_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// AgriNonConformity — No-Conformidad de Calidad
// =============================================================================

/**
 * Registro de cualquier desviación de los estándares de calidad o inocuidad.
 * Puede originarse en:
 *   - Desviación de PCC (CCP monitoring)
 *   - Excursión de temperatura (agri_cold_chain)
 *   - Resultado microbiológico fuera de norma
 *   - Inspección visual en línea
 *   - Auditoría BPM
 *   - Reclamo de cliente
 *
 * El campo `decision` define la disposición del lote afectado:
 *   - rework: retrabajo o reproceso
 *   - destroy: destrucción del lote
 *   - release: liberar con documentación de desviación aceptada
 *   - hold: mantener en cuarentena hasta nueva decisión
 *
 * Las no-conformidades críticas activan el workflow de aprobación
 * que requiere la firma del gerente de calidad (Workflow JSON).
 */
@Entity({ tableName: 'agri_non_conformities' })
export class AgriNonConformityEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** NC-2026-001 */
  @Property({ type: 'text', length: 50 })
  nc_number!: string

  /**
   * ccp_deviation | temperature_excursion | microbiological |
   * physical | chemical | bpm_checklist | external_audit | complaint
   */
  @Property({ type: 'text', length: 30 })
  source!: string

  /** critical | major | minor */
  @Property({ type: 'text', length: 10 })
  severity: string = 'major'

  @Property({ type: 'text' })
  description!: string

  /** Lote de producto terminado afectado */
  @Property({ type: 'uuid', nullable: true })
  affected_lot_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  detected_by?: string | null

  @Property({ type: 'date' })
  detection_date!: Date

  /**
   * open | investigating | pending_decision | resolved | closed
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'open'

  @Property({ type: 'text', nullable: true })
  root_cause?: string | null

  /** rework | destroy | release | hold */
  @Property({ type: 'text', length: 20, nullable: true })
  decision?: string | null

  @Property({ type: 'uuid', nullable: true })
  decision_by?: string | null

  @Property({ type: 'date', nullable: true })
  decision_date?: Date | null

  @Property({ type: 'text', nullable: true })
  corrective_action?: string | null

  @Property({ type: 'text', nullable: true })
  preventive_action?: string | null

  @Property({ type: 'date', nullable: true })
  closed_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// AgriBpmChecklist — Checklist de Buenas Prácticas de Manufactura
// =============================================================================

/**
 * Registro diario de los checklists BPM requeridos por el plan HACCP.
 * Los `items` almacenan el estado de cada verificación:
 * [
 *   { "item": "Pisos limpios y secos", "status": "ok", "observation": "" },
 *   { "item": "Personal con uniforme completo", "status": "fail", "observation": "Falta cofia" },
 *   { "item": "Trampa de roedores revisada", "status": "na", "observation": "Área no aplica" }
 * ]
 */
@Entity({ tableName: 'agri_bpm_checklists' })
export class AgriBpmChecklistEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /**
   * cleaning_disinfection | personal_hygiene | pest_control |
   * equipment_calibration | general_bpm
   */
  @Property({ type: 'text', length: 30 })
  checklist_type!: string

  @Property({ type: 'text', length: 100 })
  area!: string

  @Property({ type: 'date' })
  check_date!: Date

  /** morning | afternoon | night */
  @Property({ type: 'text', length: 10, nullable: true })
  shift?: string | null

  @Property({ type: 'json' })
  items: object[] = []

  @Property({ type: 'uuid', nullable: true })
  completed_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  verified_by?: string | null

  /** pass | fail | conditional */
  @Property({ type: 'text', length: 15 })
  overall_result: string = 'pass'

  @Property({ type: 'text', nullable: true })
  findings?: string | null

  @Property({ type: 'text', nullable: true })
  corrective_actions?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
