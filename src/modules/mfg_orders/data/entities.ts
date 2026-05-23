import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgWorkCenter — Centro de Trabajo
// =============================================================================

/**
 * Representa una máquina, línea de producción o célula de trabajo.
 * Es la unidad básica de capacidad en la planta.
 *
 * cost_per_hr_usd se usa para calcular el costo de mano de obra directa
 * y costo de máquina en las órdenes de producción (mfg_costs).
 *
 * efficiency_pct permite calibrar la capacidad real vs. teórica.
 * Una línea con efficiency_pct = 85 produce efectivamente 85% de su
 * capacidad nominal, considerando micro-paros y cambios de formato.
 */
@Entity({ tableName: 'mfg_work_centers' })
export class MfgWorkCenterEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 30 })
  code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** machine = máquina individual | line = línea completa | cell = célula flexible | manual = operación manual */
  @Property({ type: 'text', length: 20 })
  type: string = 'line'

  /** Horas disponibles por turno (default 8 horas) */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  capacity_hrs_per_shift: string = '8.00'

  /** Eficiencia teórica %. Una línea al 85% produce 6.8h efectivas de 8h disponibles */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  efficiency_pct: string = '100.00'

  /** Costo combinado (máquina + MO directa) en USD/hora para costeo de órdenes */
  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  cost_per_hr_usd?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

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
// MfgProductionOrder — Orden de Producción
// =============================================================================

/**
 * Instrucción formal de producción: qué fabricar, cuánto, con qué BOM,
 * en qué fecha, en qué línea.
 *
 * Al "liberar" la orden (status → released), el sistema reserva automáticamente
 * los materiales en almacén (cambia status de los lotes a 'reserved').
 * Esto impide que otra orden use la misma materia prima.
 *
 * Al cerrar la orden (status → completed), mfg_costs calcula las variaciones:
 *   - Variación de precio: ¿pagué la MP más caro que el estándar?
 *   - Variación de cantidad: ¿consumí más MP que el estándar?
 *   - Variación de mano de obra: ¿tardé más del tiempo estándar?
 *
 * production_lot_number es el número de lote del producto terminado
 * que se genera al completar la orden. Se conecta con mfg_inventory
 * para crear el lote de PT y con la trazabilidad hacia la MP consumida.
 */
@Entity({ tableName: 'mfg_production_orders' })
export class MfgProductionOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** PO-2026-0001 — número secuencial único */
  @Property({ type: 'text', length: 50 })
  order_number!: string

  @Property({ type: 'uuid' })
  bom_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_quantity!: string

  /** Cantidad real producida al cierre (puede diferir de planned por mermas) */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  actual_quantity?: string | null

  /** Unidades rechazadas durante el proceso */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  rejected_quantity: string = '0.0000'

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Número de lote del producto terminado generado */
  @Property({ type: 'text', length: 50, nullable: true })
  production_lot_number?: string | null

  /** Centro de trabajo / línea de producción principal */
  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  scheduled_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  scheduled_end?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  actual_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  actual_end?: Date | null

  /**
   * planned    = creada, materiales no reservados aún
   * released   = liberada, materiales reservados en almacén
   * in_progress = en ejecución en el piso de planta
   * completed  = cerrada, costos calculados, PT ingresado a almacén
   * cancelled  = cancelada
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'planned'

  /** Costo estándar planificado al crear la orden (en USD) */
  @Property({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  planned_cost_usd?: string | null

  /** Costo real al cierre de la orden (calculado por mfg_costs) */
  @Property({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  actual_cost_usd?: string | null

  /** ID del MPS que generó esta orden (null si fue creada manualmente) */
  @Property({ type: 'uuid', nullable: true })
  mps_id?: string | null

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
// MfgOrderOperation — Operación de la Ruta de Producción
// =============================================================================

/**
 * Cada paso del proceso productivo dentro de una orden.
 * El conjunto de operaciones define el routing (secuencia de pasos).
 * Ejemplos: 10-Mezcla, 20-Extrusión, 30-Corte, 40-Empaque.
 *
 * El operador registra inicio/fin real de cada operación desde el
 * piso de planta (tablet o terminal simple). Esto alimenta:
 *   - El cálculo de eficiencia (tiempo real vs. estándar)
 *   - El costeo de mano de obra directa por orden
 *   - El OEE de cada centro de trabajo
 */
@Entity({ tableName: 'mfg_order_operations' })
export class MfgOrderOperationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  order_id!: string

  @Property({ type: 'smallint' })
  operation_number!: number

  @Property({ type: 'text', length: 255 })
  operation_name!: string

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  /** Tiempo estándar según el routing del producto (horas) */
  @Property({ type: 'decimal', precision: 8, scale: 4 })
  planned_duration_hrs!: string

  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  actual_duration_hrs?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  planned_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  actual_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  actual_end?: Date | null

  /** pending | in_progress | completed | skipped */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  /** Operador asignado a esta operación */
  @Property({ type: 'uuid', nullable: true })
  operator_id?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  quantity_produced?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  quantity_rejected: string = '0.0000'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgOrderMaterialIssue — Consumo real de material por la orden
// =============================================================================

/**
 * Registro del material realmente consumido vs. lo planificado por el BOM.
 * La diferencia entre planned_quantity e issued_quantity determina
 * la variación de cantidad en mfg_costs.
 *
 * lot_id permite rastrear exactamente qué lote de MP se usó en este PT
 * (cadena de trazabilidad completa).
 */
@Entity({ tableName: 'mfg_order_material_issues' })
export class MfgOrderMaterialIssueEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  order_id!: string

  @Property({ type: 'uuid', nullable: true })
  bom_line_id?: string | null

  @Property({ type: 'text', length: 100 })
  component_code!: string

  @Property({ type: 'text', length: 255 })
  component_name!: string

  /** Cantidad requerida según el BOM (planned_qty × rendimiento) */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  planned_quantity!: string

  /** Cantidad realmente enviada al piso de planta */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  issued_quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Lote de inventario específico que se consumió */
  @Property({ type: 'uuid', nullable: true })
  lot_id?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  lot_number?: string | null

  @Property({ type: 'date' })
  issue_date!: Date

  @Property({ type: 'uuid', nullable: true })
  issued_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// MfgProductionDowntime — Registro de Paros de Producción
// =============================================================================

/**
 * Registra cada interrupción de la producción con timestamp preciso.
 * Es la fuente de datos para el cálculo del OEE.
 *
 * El campo is_force_majeure es crítico para Venezuela:
 * permite separar los paros por corte eléctrico de CORPOELEC
 * (fuerza mayor, no controlable) de los paros por ineficiencia interna.
 * Esto permite reportar OEE "neto de fuerza mayor" a la gerencia.
 *
 * Cuando se registra un paro, el dashboard de planta se actualiza
 * en tiempo real via clientBroadcast.
 */
@Entity({ tableName: 'mfg_production_downtimes' })
export class MfgProductionDowntimeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid', nullable: true })
  order_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  operation_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'timestamptz' })
  started_at!: Date

  @Property({ type: 'timestamptz', nullable: true })
  ended_at?: Date | null

  /** Calculado al registrar fin: (ended_at - started_at) en horas */
  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  duration_hrs?: string | null

  /**
   * electrical_cut    = corte eléctrico externo (CORPOELEC) — fuerza mayor
   * mechanical_failure = falla mecánica de equipo
   * material_shortage  = falta de material en almacén
   * quality_hold       = retención por calidad (espera resultado de QC)
   * format_change      = cambio de formato / línea (entre productos)
   * maintenance        = mantenimiento preventivo programado
   * operator_absence   = ausencia de operador / falta de personal
   * other              = otra causa
   */
  @Property({ type: 'text', length: 30 })
  cause_category!: string

  @Property({ type: 'text' })
  cause_description!: string

  @Property({ type: 'text', nullable: true })
  impact_description?: string | null

  @Property({ type: 'uuid', nullable: true })
  reported_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  resolved_by?: string | null

  @Property({ type: 'text', nullable: true })
  resolution_notes?: string | null

  /**
   * true = paro por fuerza mayor (corte eléctrico, desastre natural).
   * Se excluye del OEE interno para dar una métrica real de eficiencia
   * controlable por la gerencia de planta.
   */
  @Property({ type: 'boolean', default: false })
  is_force_majeure: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
