import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgSubcontractOrder — Orden de Maquila
// =============================================================================

/**
 * Orden de producción enviada a un maquilador externo.
 * La empresa provee las materias primas y empaque; el maquilador
 * aporta la mano de obra y equipos a cambio de un precio por unidad producida.
 *
 * El sistema controla los materiales enviados al maquilador como un
 * "almacén virtual externo". Mientras la orden está activa, esos materiales
 * salen del inventario principal pero se pueden rastrear.
 *
 * Al cierre, el análisis de merma compara:
 *   - Materiales enviados vs. producto terminado recibido
 *   - Merma real vs. merma estándar contractual
 *
 * Si actual_scrap_pct > standard_scrap_pct: el maquilador consumió más
 * material del permitido → penalización o descuento en la factura.
 *
 * Ejemplo venezolano:
 *   Empresa X envía 1,000 kg de harina + empaques a la maquiladora Y.
 *   La maquiladora devuelve 950 bolsas de 1kg terminadas.
 *   Merma real = 50 kg de harina (5%) vs. estándar contractual 3%.
 *   Diferencia = 2% sobre estándar → descuento de USD X en la factura.
 */
@Entity({ tableName: 'mfg_subcontract_orders' })
export class MfgSubcontractOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** SC-2026-001 */
  @Property({ type: 'text', length: 50 })
  order_number!: string

  /** FK a mfg_suppliers — el maquilador es un proveedor de tipo servicio */
  @Property({ type: 'uuid', nullable: true })
  subcontractor_id?: string | null

  @Property({ type: 'text', length: 255 })
  subcontractor_name!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  quantity_ordered!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  quantity_received: string = '0.0000'

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Tarifa de maquila por unidad producida (en USD) */
  @Property({ type: 'decimal', precision: 12, scale: 6 })
  price_per_unit_usd!: string

  /** Honorario total = quantity_received × price_per_unit_usd */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  total_maquila_fee_usd: string = '0.00'

  /**
   * draft           = en proceso de preparación de materiales
   * materials_sent  = materiales enviados al maquilador
   * in_production   = el maquilador está produciendo
   * completed       = producto terminado recibido y cerrado
   * cancelled       = cancelado
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  @Property({ type: 'date', nullable: true })
  scheduled_delivery?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_delivery?: Date | null

  /**
   * Merma contractual acordada con el maquilador (%).
   * Si la merma real supera este porcentaje, se aplican penalizaciones.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  standard_scrap_pct: string = '0.00'

  /** Merma real calculada al cerrar la orden */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  actual_scrap_pct?: string | null

  /** true si actual_scrap_pct > standard_scrap_pct */
  @Property({ type: 'boolean', default: false })
  scrap_exceeded: boolean = false

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
// MfgSubcontractMaterial — Material Enviado al Maquilador
// =============================================================================

/**
 * Cada material (MP, empaque) enviado al maquilador para esta orden.
 * Representa el "almacén virtual" en instalaciones del maquilador.
 *
 * El balance de materiales al cierre:
 *   - quantity_sent = total enviado
 *   - quantity_returned = material no usado devuelto
 *   - consumido = quantity_sent - quantity_returned
 *   - consumo_esperado = (consumo según BOM) × quantity_received
 *   - merma_real = consumido - consumo_esperado
 *
 * lot_id conecta este envío con el lote específico de inventario,
 * permitiendo la trazabilidad completa:
 *   PT recibido ← maquila SC-001 ← lote LOTE-2026-001 de MP
 */
@Entity({ tableName: 'mfg_subcontract_materials' })
export class MfgSubcontractMaterialEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  subcontract_order_id!: string

  @Property({ type: 'uuid' })
  material_id!: string

  @Property({ type: 'text', length: 100 })
  material_code!: string

  @Property({ type: 'text', length: 255 })
  material_name!: string

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity_sent!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  @Property({ type: 'decimal', precision: 12, scale: 6, nullable: true })
  unit_cost_usd?: string | null

  /** Para materiales que deben ser devueltos (envases, moldes, etc.) */
  @Property({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  quantity_expected_back?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity_returned: string = '0.0000'

  /** Lote específico del inventario que fue enviado al maquilador */
  @Property({ type: 'uuid', nullable: true })
  lot_id?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  lot_number?: string | null

  @Property({ type: 'date', nullable: true })
  sent_date?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
