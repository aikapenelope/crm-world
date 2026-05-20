import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  INSPECTING = 'inspecting',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED_SHIPPING = 'damaged_shipping',
  OTHER = 'other',
}

export enum RefundMethod {
  ORIGINAL = 'original',
  CREDIT_NOTE = 'credit_note',
  STORE_CREDIT = 'store_credit',
  CASH = 'cash',
}

export enum ItemCondition {
  NEW = 'new',
  GOOD = 'good',
  DAMAGED = 'damaged',
  DEFECTIVE = 'defective',
  UNSELLABLE = 'unsellable',
}

export enum CreditNoteStatus {
  ACTIVE = 'active',
  PARTIALLY_USED = 'partially_used',
  FULLY_USED = 'fully_used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// =============================================================================
// Return Policy — Política de devolución por categoría
// =============================================================================

@Entity({ tableName: 'retail_return_policies' })
export class RetailReturnPolicyEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  // IDs de categorías del catálogo que aplican
  @Property({ type: 'json', nullable: true })
  category_ids?: string[] | null

  @Property({ type: 'int', default: 30 })
  max_days: number = 30

  @Property({ type: 'boolean', default: true })
  requires_receipt: boolean = true

  @Property({ type: 'boolean', default: false })
  requires_original_packaging: boolean = false

  @Enum({ items: () => RefundMethod, type: 'string', length: 15, default: RefundMethod.CREDIT_NOTE })
  refund_method: RefundMethod = RefundMethod.CREDIT_NOTE

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  restocking_fee_percent: string = '0.00'

  // Condiciones adicionales
  @Property({ type: 'json', nullable: true })
  conditions?: Record<string, unknown> | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Return — Solicitud de devolución
// =============================================================================

@Entity({ tableName: 'retail_returns' })
export class RetailReturnEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  return_number!: string

  @Property({ type: 'uuid' })
  branch_id!: string

  @Property({ type: 'uuid', nullable: true })
  customer_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  original_order_id?: string | null

  @Enum({ items: () => ReturnStatus, type: 'string', length: 15, default: ReturnStatus.REQUESTED })
  status: ReturnStatus = ReturnStatus.REQUESTED

  @Enum({ items: () => ReturnReason, type: 'string', length: 20 })
  reason!: ReturnReason

  @Property({ type: 'text', nullable: true })
  reason_detail?: string | null

  @Enum({ items: () => RefundMethod, type: 'string', length: 15, default: RefundMethod.CREDIT_NOTE })
  refund_method: RefundMethod = RefundMethod.CREDIT_NOTE

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  subtotal!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  restocking_fee: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  refund_amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'uuid', nullable: true })
  processed_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  processed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Return Line — Líneas de la devolución
// =============================================================================

@Entity({ tableName: 'retail_return_lines' })
export class RetailReturnLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  return_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'int' })
  quantity!: number

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  unit_price!: string

  @Enum({ items: () => ItemCondition, type: 'string', length: 15, default: ItemCondition.GOOD })
  condition: ItemCondition = ItemCondition.GOOD

  @Property({ type: 'boolean', default: true })
  restock: boolean = true

  @Property({ type: 'text', nullable: true })
  notes?: string | null
}

// =============================================================================
// Credit Note — Nota de crédito retail
// =============================================================================

@Entity({ tableName: 'retail_credit_notes' })
export class RetailCreditNoteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  credit_note_number!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  @Property({ type: 'uuid', nullable: true })
  return_id?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  balance!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Enum({ items: () => CreditNoteStatus, type: 'string', length: 15, default: CreditNoteStatus.ACTIVE })
  status: CreditNoteStatus = CreditNoteStatus.ACTIVE

  @Property({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
