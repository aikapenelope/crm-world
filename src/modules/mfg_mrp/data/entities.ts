import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgProductionPlan — Plan de Producción del período
// =============================================================================

/**
 * Define el horizonte de planificación para la corrida MRP.
 * El plan toma los pedidos confirmados + demanda proyectada del período
 * y lanza la explosión de necesidades de materiales.
 *
 * Una corrida MRP puede ejecutarse múltiples veces en el mismo plan
 * (cada vez que llega un pedido nuevo o cambia el inventario).
 * Los resultados se sobrescriben en cada corrida.
 */
@Entity({ tableName: 'mfg_production_plans' })
export class MfgProductionPlanEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** PLAN-2026-01 */
  @Property({ type: 'text', length: 50 })
  plan_number!: string

  @Property({ type: 'date' })
  period_start!: Date

  @Property({ type: 'date' })
  period_end!: Date

  /** draft | running | completed | active */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  /** Timestamp de la última corrida MRP exitosa */
  @Property({ type: 'timestamptz', nullable: true })
  last_run_at?: Date | null

  /** Resumen de la última corrida: cuántos materiales, cuántas requisiciones generadas */
  @Property({ type: 'jsonb', nullable: true })
  last_run_summary?: Record<string, any> | null

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
// MfgMrpRequirement — Necesidad neta por material del MRP
// =============================================================================

/**
 * Resultado de la explosión MRP para un material específico en el plan.
 *
 * Cálculo:
 *   gross_requirement  = suma de necesidades brutas (BOM × qty de órdenes)
 *   stock_on_hand      = stock disponible + reservado en almacén
 *   stock_in_transit   = OC en curso que llegarán antes de required_by_date
 *   net_requirement    = max(0, gross - on_hand - in_transit)
 *
 * Particularidad venezolana:
 *   is_imported = true → lead_time_days puede ser 45-90 días
 *   Si suggested_po_date < hoy: la orden de compra está VENCIDA — alerta crítica
 *   Si suggested_po_date < hoy + 7: la orden debe salir ESTA SEMANA — alerta urgente
 *
 * El MRP venezolano siempre muestra dos fechas:
 *   required_by_date = cuándo se necesita en planta
 *   suggested_po_date = required_by_date - lead_time_days → cuándo hay que ordenar
 */
@Entity({ tableName: 'mfg_mrp_requirements' })
export class MfgMrpRequirementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  plan_id!: string

  @Property({ type: 'uuid' })
  material_id!: string

  @Property({ type: 'text', length: 100 })
  material_code!: string

  @Property({ type: 'text', length: 255 })
  material_name!: string

  @Property({ type: 'text', length: 20 })
  material_type: string = 'raw_material'

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Suma de necesidades brutas del período (BOM × cantidades de órdenes) */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  gross_requirement!: string

  /** Stock disponible + reservado en almacén al momento de la corrida */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  stock_on_hand: string = '0.0000'

  /** Cantidad en tránsito en OC confirmadas que llegan antes de required_by_date */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  stock_in_transit: string = '0.0000'

  /** Necesidad neta = max(0, gross - on_hand - in_transit) */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  net_requirement: string = '0.0000'

  /** Cuándo se necesita el material en planta para no detener producción */
  @Property({ type: 'date' })
  required_by_date!: Date

  /**
   * Cuándo hay que emitir la OC = required_by_date - lead_time_days.
   * Si esta fecha es anterior a hoy: la OC está VENCIDA.
   */
  @Property({ type: 'date' })
  suggested_po_date!: Date

  /**
   * Lead time real del proveedor en días (no el prometido — el histórico).
   * Nacional: 3-15 días. Importado: 45-90 días (divisa + flete + aduana VE).
   */
  @Property({ type: 'int' })
  lead_time_days: number = 30

  /**
   * true = material importado con lead time extendido venezolano.
   * Estos son los materiales de mayor riesgo de ruptura de stock.
   */
  @Property({ type: 'boolean', default: false })
  is_imported: boolean = false

  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  supplier_name?: string | null

  /**
   * pending            = necesidad calculada, no gestionada aún
   * requisition_created = ya se generó la requisición de compra
   * covered            = cubierta por stock o compra confirmada
   */
  @Property({ type: 'text', length: 25 })
  status: string = 'pending'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgPurchaseRequisition — Solicitud de Compra generada por MRP
// =============================================================================

/**
 * Solicitud formal de compra generada automáticamente por el MRP
 * o manualmente por el planificador. Pasa al módulo de compras
 * (mfg_procurement en Sprint C) para convertirse en OC.
 *
 * Para importaciones venezolanas los campos adicionales son críticos:
 *   is_imported         = requiere proceso de importación (DAU, divisas, etc.)
 *   estimated_ship_date = fecha estimada de embarque
 *   estimated_arrival   = fecha estimada de llegada al almacén
 *   customs_days        = días estimados en aduana (5-45 en Venezuela)
 *
 * El planificador ve el gap entre suggested_po_date y hoy
 * para priorizar qué requisiciones convertir en OC primero.
 */
@Entity({ tableName: 'mfg_purchase_requisitions' })
export class MfgPurchaseRequisitionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** REQ-2026-001 */
  @Property({ type: 'text', length: 50 })
  requisition_number!: string

  /** Si vino del MRP automático, FK al requirement que la generó */
  @Property({ type: 'uuid', nullable: true })
  mrp_requirement_id?: string | null

  @Property({ type: 'uuid' })
  material_id!: string

  @Property({ type: 'text', length: 100 })
  material_code!: string

  @Property({ type: 'text', length: 255 })
  material_name!: string

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Cuándo se necesita el material en planta */
  @Property({ type: 'date' })
  required_by_date!: Date

  /** Cuándo hay que emitir la OC (ya incluye lead time) */
  @Property({ type: 'date' })
  suggested_po_date!: Date

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unit_cost_usd?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  total_cost_usd?: string | null

  /** true = requiere proceso de importación (divisas, DAU, agente de aduana) */
  @Property({ type: 'boolean', default: false })
  is_imported: boolean = false

  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  supplier_name?: string | null

  /**
   * pending       = esperando aprobación o conversión a OC
   * approved      = aprobada, lista para generar OC
   * po_created    = ya se generó la OC en el módulo de compras
   * cancelled     = cancelada
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  /** Días estimados en aduana venezolana (para importaciones) */
  @Property({ type: 'int', nullable: true })
  customs_days_estimate?: number | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
