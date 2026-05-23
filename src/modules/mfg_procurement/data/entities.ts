import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgSupplier — Proveedor Industrial
// =============================================================================

/**
 * Proveedores de materias primas, empaque y repuestos.
 * Los campos más críticos para Venezuela son avg_lead_time_days y
 * on_time_delivery_pct, calculados AUTOMÁTICAMENTE del historial real
 * de órdenes de compra — no del que el proveedor prometió.
 *
 * Esto permite al planificador MRP usar tiempos de entrega reales:
 * "Proveedor X dice que entrega en 30 días, pero históricamente
 * tarda 52 días en promedio y solo cumple el 60% de las veces" →
 * el MRP usará 52 días de lead time, no 30.
 *
 * payment_terms determina el flujo de caja necesario:
 *   advance         = pago anticipado total (muy común con proveedores extranjeros a Venezuela)
 *   letter_of_credit = carta de crédito (garantía bancaria)
 *   net_30 / net_60  = crédito (solo para nacionales de confianza)
 */
@Entity({ tableName: 'mfg_suppliers' })
export class MfgSupplierEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 30 })
  supplier_code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 100, nullable: true })
  country?: string | null

  /** national | international */
  @Property({ type: 'text', length: 20 })
  supplier_type: string = 'national'

  @Property({ type: 'text', length: 255, nullable: true })
  contact_name?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  contact_email?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  contact_phone?: string | null

  /** advance | letter_of_credit | net_30 | net_60 | open_account */
  @Property({ type: 'text', length: 25 })
  payment_terms: string = 'advance'

  @Property({ type: 'text', length: 10 })
  currency: string = 'USD'

  /**
   * Lead time promedio real (calculado automáticamente del historial).
   * Se actualiza con cada OC recibida: nuevo_avg = (avg_anterior × (n-1) + actual_days) / n
   */
  @Property({ type: 'decimal', precision: 8, scale: 1, nullable: true })
  avg_lead_time_days?: string | null

  /** % de OCs que llegaron en o antes de la fecha prometida */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  on_time_delivery_pct?: string | null

  @Property({ type: 'int' })
  total_orders: number = 0

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
// MfgPurchaseOrder — Orden de Compra Industrial
// =============================================================================

/**
 * Orden de compra con tracking completo del proceso de importación venezolano.
 *
 * Para OCs internacionales, el ciclo es:
 *   draft → sent → confirmed → in_transit → at_customs → delivered
 *
 * El tracking de fechas permite identificar dónde está demorada la importación:
 *   - Retraso en embarque (actual_ship_date > estimated_ship_date)
 *   - Retraso en aduana venezolana (actual_customs_clearance vs estimated)
 *   - Retraso en transporte interno
 *
 * Cálculo del COSTO CIF REAL en almacén (el que va a mfg_stock_lots.unit_cost_usd):
 *   total_cif_cost = subtotal_fob + freight_cost + insurance_cost
 *                  + tariff_cost + import_vat + agency_fees + inland_transport
 *
 * Los dos tipos de cambio BCV capturan la diferencia entre:
 *   bcv_rate_at_order:   tasa cuando se hizo el compromiso de compra
 *   bcv_rate_at_arrival: tasa cuando el material llega al almacén
 *   → permite calcular la variación cambiaria de la importación
 */
@Entity({ tableName: 'mfg_purchase_orders' })
export class MfgPurchaseOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** PO-IMP-2026-001 para importaciones, PO-NAC-2026-001 para nacionales */
  @Property({ type: 'text', length: 50 })
  po_number!: string

  @Property({ type: 'uuid' })
  supplier_id!: string

  @Property({ type: 'text', length: 255 })
  supplier_name!: string

  /** national | international */
  @Property({ type: 'text', length: 20 })
  po_type: string = 'national'

  /**
   * draft           = en borrador
   * sent            = enviada al proveedor
   * confirmed       = confirmada por el proveedor
   * in_transit      = mercancía embarcada, en tránsito
   * at_customs      = llegó al puerto, en proceso de aduana
   * delivered       = mercancía recibida en almacén
   * cancelled       = cancelada
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  @Property({ type: 'text', length: 10 })
  currency: string = 'USD'

  /** Valor de la mercancía en puerto de origen (Free On Board) */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  subtotal_fob: string = '0.00'

  /** Flete internacional (marítimo o aéreo) */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  freight_cost: string = '0.00'

  /** Seguro de carga (típicamente 0.5-1% del FOB) */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  insurance_cost: string = '0.00'

  /** Arancel de importación (varía por código arancelario SENIAT) */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  tariff_cost: string = '0.00'

  /** IVA en aduana (16% sobre CIF + arancel en Venezuela) */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  import_vat: string = '0.00'

  /** Honorarios del agente de aduana */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  agency_fees: string = '0.00'

  /** Flete interno: puerto → almacén de la empresa */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  inland_transport: string = '0.00'

  /**
   * COSTO CIF TOTAL EN ALMACÉN
   * = subtotal_fob + freight + insurance + tariff + import_vat + agency_fees + inland_transport
   * Este es el costo real de la MP importada. Se divide entre la cantidad
   * recibida para obtener el unit_cost_usd de cada lote en mfg_inventory.
   */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  total_cif_cost: string = '0.00'

  /** FOB, CIF, EXW, DAP */
  @Property({ type: 'text', length: 10, nullable: true })
  incoterm?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  country_of_origin?: string | null

  /** Número de Declaración Aduanera Única (DAU) — Venezuela */
  @Property({ type: 'text', length: 50, nullable: true })
  dau_number?: string | null

  /** Nombre/código del agente de aduana asignado */
  @Property({ type: 'text', length: 255, nullable: true })
  customs_agent?: string | null

  @Property({ type: 'date', nullable: true })
  estimated_ship_date?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_ship_date?: Date | null

  @Property({ type: 'date', nullable: true })
  estimated_arrival_port?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_arrival_port?: Date | null

  @Property({ type: 'date', nullable: true })
  estimated_customs_clearance?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_customs_clearance?: Date | null

  @Property({ type: 'date', nullable: true })
  estimated_warehouse_arrival?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_warehouse_arrival?: Date | null

  /** Tasa BCV (Bs/USD) al momento de emitir la OC */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  bcv_rate_at_order?: string | null

  /** Tasa BCV al momento de recibir la mercancía en almacén */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  bcv_rate_at_arrival?: string | null

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
// MfgPurchaseOrderLine — Línea de Orden de Compra
// =============================================================================

/**
 * Cada material en la OC con su precio pactado y el costo CIF unitario
 * calculado al recibir.
 *
 * unit_cif_cost se calcula al cerrar la OC:
 *   unit_cif_cost = (total_cif_cost_po / total_items_po) × (unit_price / subtotal_fob)
 *
 * Este valor se transfiere a mfg_stock_lots.unit_cost_usd al crear el
 * lote de inventario para cada material recibido.
 *
 * requisition_id conecta esta línea con la MfgPurchaseRequisition del MRP
 * que generó la necesidad original. Permite al sistema saber que una
 * necesidad ya fue cubierta por una OC en tránsito.
 */
@Entity({ tableName: 'mfg_purchase_order_lines' })
export class MfgPurchaseOrderLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  po_id!: string

  @Property({ type: 'smallint' })
  line_number!: number

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

  @Property({ type: 'decimal', precision: 12, scale: 6 })
  unit_price!: string

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  total_price!: string

  /**
   * Costo CIF unitario calculado al recibir la mercancía.
   * Incluye la parte proporcional de flete, seguro, aranceles, etc.
   * Este es el costo real que va al kardex de inventario.
   */
  @Property({ type: 'decimal', precision: 14, scale: 6, nullable: true })
  unit_cif_cost?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity_received: string = '0.0000'

  @Property({ type: 'date', nullable: true })
  received_date?: Date | null

  @Property({ type: 'uuid', nullable: true })
  requisition_id?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
