import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgSaleOrderMfg — Orden de Venta Industrial
// =============================================================================

/**
 * Pedido de un cliente industrial (cadena de supermercados, distribuidora,
 * otra industria) sobre el stock de producto terminado.
 *
 * Al confirmar la orden, el sistema reserva los lotes de PT en almacén
 * usando FEFO (primer en vencer = primero en salir), igual que la producción.
 *
 * Bimoneda venezolana:
 *   currency = USD → precio en dólares + IVA 16% + IGTF 3% (para pagos USD)
 *   currency = VES → precio en bolívares (convertido al BCV del día)
 *
 * Para clientes que exigen certificado de análisis (cadenas como Farmatodo,
 * Central Madeirense, distribuidoras de alimentos), requires_coa = true
 * bloquea el despacho hasta que el CoA del lote esté liberado por QC.
 */
@Entity({ tableName: 'mfg_sale_orders_mfg' })
export class MfgSaleOrderMfgEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** SO-MFG-2026-001 */
  @Property({ type: 'text', length: 50 })
  order_number!: string

  @Property({ type: 'uuid', nullable: true })
  customer_id?: string | null

  @Property({ type: 'text', length: 255 })
  customer_name!: string

  /** RIF venezolano del cliente (para factura) */
  @Property({ type: 'text', length: 20, nullable: true })
  customer_rif?: string | null

  /**
   * draft         = en elaboración
   * confirmed     = confirmado, materiales reservados
   * in_preparation = en preparación para despacho (picking)
   * dispatched    = guía de despacho emitida, en tránsito
   * invoiced      = facturado y entregado
   * cancelled     = cancelado
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  /** USD | VES */
  @Property({ type: 'text', length: 10 })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  subtotal_usd: string = '0.00'

  /** IVA 16% en Venezuela */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  iva_pct: string = '16.00'

  /** IGTF 3% — aplica cuando el pago es en divisas (Ley IGTF Venezuela) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  igtf_pct?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  iva_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  igtf_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  total_usd: string = '0.00'

  /** zelle | binance | efectivo_usd | transferencia | pago_movil | punto */
  @Property({ type: 'text', length: 30, nullable: true })
  payment_method?: string | null

  @Property({ type: 'date', nullable: true })
  scheduled_dispatch_date?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_dispatch_date?: Date | null

  @Property({ type: 'text', nullable: true })
  delivery_address?: string | null

  /** Productos que requieren cadena de frío durante el transporte */
  @Property({ type: 'boolean', default: false })
  requires_temperature_control: boolean = false

  /**
   * true = el cliente (cadena, distribuidora) exige certificado de análisis
   * del lote antes de aceptar la mercancía. Bloquea despacho si CoA no existe.
   */
  @Property({ type: 'boolean', default: false })
  requires_coa: boolean = false

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
// MfgSaleOrderLineMfg — Línea de Orden de Venta Industrial
// =============================================================================

/**
 * Cada producto (con su lote reservado) en la orden de venta industrial.
 * lot_id conecta directamente al lote de PT del almacén (mfg_inventory),
 * lo que permite la trazabilidad completa:
 *   cliente ← SO línea ← lote PT ← orden de producción ← MP lotes ← proveedor
 */
@Entity({ tableName: 'mfg_sale_order_lines' })
export class MfgSaleOrderLineMfgEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  sale_order_id!: string

  @Property({ type: 'smallint' })
  line_number!: number

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  @Property({ type: 'decimal', precision: 12, scale: 6 })
  unit_price_usd!: string

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  total_price_usd!: string

  /** Lote de PT reservado por esta línea (FEFO automático) */
  @Property({ type: 'uuid', nullable: true })
  lot_id?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  lot_number?: string | null

  /** Orden de producción que generó este lote (para trazabilidad) */
  @Property({ type: 'uuid', nullable: true })
  production_order_id?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgDispatchOrder — Guía de Despacho
// =============================================================================

/**
 * Documento de despacho (Guía de Despacho venezolana) que acompaña
 * la mercancía desde la planta hasta el cliente.
 *
 * Incluye el vehículo, conductor y condiciones de transporte.
 * Para productos que requieren temperatura controlada (cadena de frío),
 * se registran las condiciones requeridas para que el transporte
 * cumpla la normativa sanitaria venezolana.
 *
 * customer_signature = true cuando el cliente firmó la guía al recibir,
 * lo que cierra el ciclo comercial y habilita la facturación.
 *
 * La placa venezolana sigue el formato actual: AA-123-BC
 */
@Entity({ tableName: 'mfg_dispatch_orders' })
export class MfgDispatchOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** DISP-2026-001 — número de la Guía de Despacho */
  @Property({ type: 'text', length: 50 })
  dispatch_number!: string

  @Property({ type: 'uuid' })
  sale_order_id!: string

  @Property({ type: 'text', length: 50 })
  sale_order_number!: string

  @Property({ type: 'text', length: 255 })
  customer_name!: string

  /** draft | loading | in_transit | delivered | returned */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  @Property({ type: 'text', length: 255, nullable: true })
  carrier_name?: string | null

  /** Placa del vehículo (formato venezolano AA-123-BC) */
  @Property({ type: 'text', length: 20, nullable: true })
  vehicle_plate?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  driver_name?: string | null

  @Property({ type: 'boolean', default: false })
  requires_temperature_control: boolean = false

  /** Rango de temperatura requerido: "0-4°C", "Ambiente", "-18°C" */
  @Property({ type: 'text', length: 30, nullable: true })
  temperature_range?: string | null

  @Property({ type: 'date', nullable: true })
  dispatch_date?: Date | null

  @Property({ type: 'date', nullable: true })
  delivery_date?: Date | null

  /** El cliente firmó la guía confirmando la recepción */
  @Property({ type: 'boolean', default: false })
  customer_signature: boolean = false

  @Property({ type: 'text', nullable: true })
  delivery_notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgCoa — Certificate of Analysis (Certificado de Análisis)
// =============================================================================

/**
 * Certificado de análisis por lote de producto terminado.
 * Los clientes industriales (cadenas de supermercados, distribuidoras,
 * otras industrias) lo exigen para aceptar cada entrega.
 *
 * qa_results almacena los resultados de QC que sustentan la liberación:
 *   { "humedad_pct": 8.5, "proteina_pct": 12.1, "microbiologia": "ausente",
 *     "peso_kg": 25.03, "ph": 6.8 }
 * Los parámetros específicos dependen del producto.
 *
 * is_released = true cuando el gerente de calidad firmó el CoA.
 * Solo con is_released = true se puede generar la guía de despacho
 * para pedidos con requires_coa = true.
 *
 * La URL del PDF se genera al hacer GET /api/mfg-dispatch/coa-pdf?id=...
 * con el QR code de verificación auténtica del certificado.
 */
@Entity({ tableName: 'mfg_coa' })
export class MfgCoaEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** COA-2026-001 */
  @Property({ type: 'text', length: 50 })
  coa_number!: string

  @Property({ type: 'uuid' })
  lot_id!: string

  @Property({ type: 'text', length: 50 })
  lot_number!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'date' })
  production_date!: Date

  @Property({ type: 'date', nullable: true })
  expiry_date?: Date | null

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  @Property({ type: 'uuid', nullable: true })
  dispatch_order_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  customer_name?: string | null

  /**
   * Resultados de los análisis de calidad del lote.
   * Formato flexible por producto — definido en el plan de calidad.
   */
  @Property({ type: 'jsonb', nullable: true })
  qa_results?: Record<string, string | number | boolean> | null

  /** Gerente de QC que firmó la liberación del lote */
  @Property({ type: 'text', length: 255, nullable: true })
  approved_by?: string | null

  @Property({ type: 'date', nullable: true })
  approved_at?: Date | null

  /** true = CoA firmado y listo para acompañar el despacho */
  @Property({ type: 'boolean', default: false })
  is_released: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
