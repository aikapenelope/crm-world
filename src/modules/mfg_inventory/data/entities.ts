import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgWarehouseLocation — Ubicación física de almacén
// =============================================================================

/**
 * Representa una ubicación física dentro del almacén de manufactura.
 * El almacén de manufactura tiene 4 tipos de inventario con reglas distintas:
 *   raw_material  = materia prima (con zona de cuarentena para recién llegados)
 *   packaging     = material de empaque (cajas, bolsas, etiquetas, tapas)
 *   wip           = producto en proceso (semielaborados entre operaciones)
 *   finished_goods = producto terminado listo para despacho
 *   spare_parts   = repuestos de mantenimiento
 *   quarantine    = materiales retenidos esperando resultado de QC
 *   rejected      = materiales rechazados pendientes de disposición
 *
 * Venezuela: el almacén de MP frecuentemente tiene una zona de cuarentena
 * separada para mercancía recibida que espera análisis de calidad antes de
 * ser liberada para producción.
 */
@Entity({ tableName: 'mfg_warehouse_locations' })
export class MfgWarehouseLocationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** Código único de la ubicación: MP-A-01, PT-B-03, CUAR-01 */
  @Property({ type: 'text', length: 30 })
  code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** Tipo de inventario que maneja esta ubicación */
  @Property({ type: 'text', length: 20 })
  warehouse_type: string = 'raw_material'

  /**
   * ambient            = temperatura ambiente
   * refrigerated       = refrigerado 0-8°C (vacunas, ingredientes sensibles)
   * frozen             = congelado < -18°C
   * controlled_humidity = humedad controlada (productos higroscópicos)
   */
  @Property({ type: 'text', length: 25 })
  storage_conditions: string = 'ambient'

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  capacity_kg?: string | null

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
// MfgStockLot — Lote de inventario
// =============================================================================

/**
 * Cada lote de material con su trazabilidad completa.
 * FEFO: First Expired, First Out — el sistema prioriza los lotes
 * de menor fecha de vencimiento para salir primero a producción.
 *
 * Para materia prima importada:
 *   supplier_lot_number = número de lote del proveedor extranjero
 *   unit_cost_usd = costo CIF real en almacén (precio FOB + flete + seguro + arancel + gastos)
 *
 * Para producto terminado:
 *   production_order_id = orden que lo produjo
 *   unit_cost_usd = costo real de producción calculado por mfg_costs
 *
 * El campo qc_inspection_id conecta el lote con el resultado de QC
 * que lo liberó de cuarentena o lo rechazó.
 */
@Entity({ tableName: 'mfg_stock_lots' })
export class MfgStockLotEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  material_id!: string

  @Property({ type: 'text', length: 100 })
  material_code!: string

  @Property({ type: 'text', length: 255 })
  material_name!: string

  /** Tipo de material para separar los 4 tipos de inventario */
  @Property({ type: 'text', length: 20 })
  material_type: string = 'raw_material'

  /** Número de lote interno (generado por el sistema) */
  @Property({ type: 'text', length: 50 })
  lot_number!: string

  /** Número de lote del proveedor (para trazabilidad hacia atrás en importaciones) */
  @Property({ type: 'text', length: 100, nullable: true })
  supplier_lot_number?: string | null

  /** Ubicación actual del lote */
  @Property({ type: 'uuid', nullable: true })
  location_id?: string | null

  /** Cantidad actual disponible en este lote */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity: string = '0.0000'

  @Property({ type: 'text', length: 20 })
  uom!: string

  /**
   * Costo unitario en USD.
   * MP importada: costo CIF real.
   * PT: costo real de producción al cierre de la orden.
   */
  @Property({ type: 'decimal', precision: 14, scale: 6, nullable: true })
  unit_cost_usd?: string | null

  /**
   * quarantine = recibido pero en espera de análisis QC antes de producción
   * available  = disponible para uso/producción
   * reserved   = reservado por una orden de producción (físicamente en almacén)
   * consumed   = lote completamente usado
   * expired    = venció antes de ser usado
   * rejected   = rechazado por QC — requiere disposición (devolución, destrucción)
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'quarantine'

  @Property({ type: 'date', nullable: true })
  expiry_date?: Date | null

  @Property({ type: 'date' })
  entry_date!: Date

  /** Inspección de calidad que liberó o retuvo este lote */
  @Property({ type: 'uuid', nullable: true })
  qc_inspection_id?: string | null

  /** Orden de producción que generó este lote (para PT y WIP) */
  @Property({ type: 'uuid', nullable: true })
  production_order_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgStockMovement — Movimiento de inventario
// =============================================================================

/**
 * Registro inmutable de cada entrada o salida de inventario.
 * Es el kardex de manufactura — nunca se borra ni se modifica.
 *
 * Tipos de movimiento:
 *   GR_purchase      = Goods Receipt por compra (entrada de MP)
 *   GR_production    = Goods Receipt por producción (entrada de PT a almacén)
 *   GI_production    = Goods Issue para producción (salida de MP al piso)
 *   GI_scrap         = Baja por merma o rechazo
 *   transfer         = Transferencia entre ubicaciones
 *   adjustment       = Ajuste manual autorizado
 *   count_adjustment = Ajuste por conteo cíclico
 *   quarantine_hold  = Puesta en cuarentena
 *   quarantine_release = Liberación de cuarentena
 *   expired_writeoff = Baja por vencimiento
 *
 * Trazabilidad: reference_type + reference_id permiten remontar cada
 * movimiento a su origen (orden de producción, orden de compra, etc.)
 */
@Entity({ tableName: 'mfg_stock_movements' })
export class MfgStockMovementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  lot_id!: string

  @Property({ type: 'text', length: 30 })
  movement_type!: string

  /** Positivo = entrada, Negativo = salida */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity!: string

  @Property({ type: 'uuid', nullable: true })
  from_location_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  to_location_id?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  reference_type?: string | null

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  @Property({ type: 'text', nullable: true })
  reason?: string | null

  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// MfgCycleCount — Conteo Cíclico de Inventario
// =============================================================================

/**
 * En lugar de un inventario general anual que paraliza la planta,
 * el conteo cíclico programa conteos parciales por zona/categoría cada semana.
 * Todo el inventario se cuenta al menos una vez al mes.
 *
 * Las diferencias detectadas se registran y requieren aprobación del controller
 * antes de ajustar el sistema. Esto cumple con los controles internos
 * requeridos por auditorías en Venezuela (SENIAT, auditorías de calidad).
 */
@Entity({ tableName: 'mfg_cycle_counts' })
export class MfgCycleCountEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** CC-2026-01 */
  @Property({ type: 'text', length: 50 })
  count_number!: string

  @Property({ type: 'uuid', nullable: true })
  location_id?: string | null

  /** Tipo de materiales a contar en este ciclo */
  @Property({ type: 'text', length: 20, nullable: true })
  material_type_filter?: string | null

  @Property({ type: 'date' })
  scheduled_date!: Date

  @Property({ type: 'date', nullable: true })
  completed_date?: Date | null

  /** planned | in_progress | pending_approval | approved | cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'planned'

  @Property({ type: 'uuid', nullable: true })
  counted_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  /** Número de lotes con diferencias detectadas */
  @Property({ type: 'int' })
  total_discrepancies: number = 0

  /** Valor total de las diferencias en USD */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total_discrepancy_value_usd: string = '0.00'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
