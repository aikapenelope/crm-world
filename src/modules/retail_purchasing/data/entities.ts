import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum PurchaseOrderOrigin {
  MANUAL = 'manual',
  AUTO_REORDER = 'auto_reorder',
}

export enum PayableStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum DebitCreditNoteType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

// =============================================================================
// Supplier — Proveedor
// =============================================================================

@Entity({ tableName: 'retail_suppliers' })
export class RetailSupplierEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'text', length: 20, nullable: true })
  rif?: string | null

  @Property({ type: 'text', nullable: true })
  contact_name?: string | null

  @Property({ type: 'text', nullable: true })
  phone?: string | null

  @Property({ type: 'text', nullable: true })
  email?: string | null

  @Property({ type: 'text', nullable: true })
  address?: string | null

  // Condiciones de pago por defecto (días)
  @Property({ type: 'smallint', default: 30 })
  default_payment_days: number = 30

  // Moneda preferida
  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Categorías que provee (IDs de categorías del catálogo)
  @Property({ type: 'json', nullable: true })
  category_ids?: string[] | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Purchase Order — Orden de compra
// =============================================================================

@Entity({ tableName: 'retail_purchase_orders' })
export class RetailPurchaseOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  order_number!: string

  @Property({ type: 'uuid' })
  supplier_id!: string

  @Enum({ items: () => PurchaseOrderStatus, type: 'string', length: 20, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT

  @Enum({ items: () => PurchaseOrderOrigin, type: 'string', length: 15, default: PurchaseOrderOrigin.MANUAL })
  origin: PurchaseOrderOrigin = PurchaseOrderOrigin.MANUAL

  // Moneda de la compra
  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Tasa de cambio al momento (para compras en USD con contabilidad en VES)
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  exchange_rate?: string | null

  // Totales
  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  subtotal: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  tax_amount: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  total: string = '0.00'

  // Fechas
  @Property({ type: 'date', nullable: true })
  expected_delivery_date?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  sent_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  received_at?: Date | null

  // Sucursal destino
  @Property({ type: 'uuid', nullable: true })
  branch_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'uuid', nullable: true })
  created_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Purchase Order Line — Línea de orden de compra
// =============================================================================

@Entity({ tableName: 'retail_purchase_order_lines' })
export class RetailPurchaseOrderLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  order_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'int' })
  quantity_ordered!: number

  @Property({ type: 'int', default: 0 })
  quantity_received: number = 0

  @Property({ type: 'decimal', precision: 18, scale: 4 })
  unit_cost!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  line_total!: string

  @Property({ type: 'text', nullable: true })
  notes?: string | null
}

// =============================================================================
// Account Payable — Cuenta por pagar
// =============================================================================

@Entity({ tableName: 'retail_accounts_payable' })
export class RetailAccountPayableEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  supplier_id!: string

  // Referencia al documento (orden de compra, factura proveedor)
  @Property({ type: 'text', nullable: true })
  document_number?: string | null

  @Property({ type: 'uuid', nullable: true })
  purchase_order_id?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  amount_paid: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  balance!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Enum({ items: () => PayableStatus, type: 'string', length: 15, default: PayableStatus.PENDING })
  status: PayableStatus = PayableStatus.PENDING

  // Fecha de vencimiento
  @Property({ type: 'date' })
  due_date!: Date

  @Property({ type: 'timestamptz', nullable: true })
  paid_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Supplier Debit/Credit Note — Nota de débito/crédito de proveedor
// =============================================================================

@Entity({ tableName: 'retail_supplier_notes' })
export class RetailSupplierNoteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  note_number!: string

  @Property({ type: 'uuid' })
  supplier_id!: string

  @Enum({ items: () => DebitCreditNoteType, type: 'string', length: 10 })
  type!: DebitCreditNoteType

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Razón
  @Property({ type: 'text', nullable: true })
  reason?: string | null

  // Referencia a orden de compra o factura
  @Property({ type: 'uuid', nullable: true })
  purchase_order_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  payable_id?: string | null

  @Property({ type: 'boolean', default: false })
  is_applied: boolean = false

  @Property({ type: 'timestamptz', nullable: true })
  applied_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
