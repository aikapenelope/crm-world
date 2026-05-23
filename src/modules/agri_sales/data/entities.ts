import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriSaleOrder — Orden de Venta Industrial
// =============================================================================

/**
 * Orden de venta de productos agropecuarios a clientes industriales
 * (cadenas de supermercados, restaurantes, distribuidores, exportación).
 *
 * La venta en Venezuela tiene dos capas de precio:
 *   - Precio en USD (base del negocio desde 2020)
 *   - Equivalente en VES al tipo BCV del día de emisión (para el IVA)
 *
 * El IVA (16%) se calcula sobre el monto en VES. El IGTF (3%) aplica
 * cuando el pago se recibe en divisa extranjera (USD, USDT, etc.).
 */
@Entity({ tableName: 'agri_sale_orders' })
export class AgriSaleOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** ORD-2026-001 — número de orden secuencial */
  @Property({ type: 'text', length: 50 })
  order_number!: string

  /** Cliente (FK a customers module) */
  @Property({ type: 'uuid' })
  customer_id!: string

  @Property({ type: 'date' })
  order_date!: Date

  @Property({ type: 'date', nullable: true })
  requested_delivery_date?: Date | null

  /** items: [{ lot_id, lot_number, product_name, quantity_kg, unit_price_usd }] */
  @Property({ type: 'json' })
  items: object[] = []

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  subtotal_usd!: string

  /** Descuento comercial en USD */
  @Property({ type: 'decimal', precision: 12, scale: 2, default: "'0.00'" })
  discount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'16.00'" })
  iva_rate: string = '16.00'

  /** IVA calculado en bolívares (base en VES × 16%) */
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  iva_amount_ves?: string | null

  /** Tasa BCV del día de emisión */
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  bcv_rate?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total_usd!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  total_ves?: string | null

  /**
   * draft | confirmed | partially_dispatched | fully_dispatched |
   * invoiced | paid | cancelled
   */
  @Property({ type: 'text', length: 25 })
  status: string = 'draft'

  /** Condiciones de pago: contado | 15 días | 30 días | 60 días */
  @Property({ type: 'text', length: 50, nullable: true })
  payment_terms?: string | null

  /** Temperatura requerida durante el transporte (ej: "0-4°C") */
  @Property({ type: 'text', length: 30, nullable: true })
  required_transport_temp?: string | null

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
// AgriSaleDispatch — Despacho / Guía de Entrega
// =============================================================================

/**
 * Registra la entrega física de los productos al cliente.
 * Cada despacho tiene su propio registro de temperatura durante el
 * transporte, vinculando la cadena de frío con el comercio.
 *
 * Un despacho puede corresponder a una orden completa o parcial.
 * La temperatura de entrega es evidencia para certificaciones de
 * exportación y reclamos de calidad del cliente.
 */
@Entity({ tableName: 'agri_sale_dispatches' })
export class AgriSaleDispatchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** GD-2026-001 — guía de despacho */
  @Property({ type: 'text', length: 50 })
  dispatch_number!: string

  @Property({ type: 'uuid' })
  sale_order_id!: string

  @Property({ type: 'date' })
  dispatch_date!: Date

  /** Placa del camión */
  @Property({ type: 'text', length: 20, nullable: true })
  vehicle_plate?: string | null

  /** Nombre del chofer */
  @Property({ type: 'text', length: 255, nullable: true })
  driver_name?: string | null

  /** Temperatura al momento de cargar en el camión (°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  loading_temp_c?: string | null

  /** Temperatura al momento de entregar al cliente (°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  delivery_temp_c?: string | null

  /** items despachados: [{ lot_id, lot_number, quantity_kg }] */
  @Property({ type: 'json' })
  items: object[] = []

  /** Peso total despachado en kg */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  total_weight_kg!: string

  /**
   * pending | in_transit | delivered | temperature_incident
   * temperature_incident = temp fuera de rango durante el transporte
   */
  @Property({ type: 'text', length: 25 })
  status: string = 'pending'

  /** Firma digital / confirmación de recepción del cliente */
  @Property({ type: 'boolean', default: false })
  client_received: boolean = false

  @Property({ type: 'timestamptz', nullable: true })
  delivered_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// AgriSaleInvoice — Factura Fiscal
// =============================================================================

/**
 * Factura formal emitida al cliente, integrada con ve_fiscal.
 * Una factura puede cubrir uno o varios despachos.
 * El número de control SENIAT es obligatorio para empresas formales.
 *
 * Para exportación: la factura puede ser en USD sin IVA venezolano
 * (las exportaciones están exentas de IVA según LIVA Art. 16).
 */
@Entity({ tableName: 'agri_sale_invoices' })
export class AgriSaleInvoiceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** FAC-2026-0001 */
  @Property({ type: 'text', length: 30 })
  invoice_number!: string

  /** Número de control SENIAT (obligatorio para emisión formal) */
  @Property({ type: 'text', length: 30, nullable: true })
  control_number?: string | null

  @Property({ type: 'uuid' })
  sale_order_id!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  @Property({ type: 'date' })
  issue_date!: Date

  @Property({ type: 'date' })
  due_date!: Date

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  subtotal_usd!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'16.00'" })
  iva_rate: string = '16.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  iva_amount_ves?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  bcv_rate?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total_usd!: string

  /** IGTF (3%) — aplica cuando el pago es en divisa */
  @Property({ type: 'decimal', precision: 10, scale: 2, default: "'0.00'" })
  igtf_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 12, scale: 2, default: "'0.00'" })
  paid_amount_usd: string = '0.00'

  /** pending | partial | paid | overdue | cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  @Property({ type: 'timestamptz', nullable: true })
  paid_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
