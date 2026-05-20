import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum CreditLimitStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

export enum CreditTransactionType {
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  CREDIT_NOTE = 'credit_note',
  ADJUSTMENT = 'adjustment',
}

export enum CreditReferenceType {
  SALES_INVOICE = 'sales_invoice',
  SALES_PAYMENT = 'sales_payment',
  SALES_CREDIT_MEMO = 'sales_credit_memo',
  MANUAL = 'manual',
}

// =============================================================================
// Credit Limit — Límite de crédito por cliente
// =============================================================================

@Entity({ tableName: 'dist_credit_limits' })
export class DistCreditLimitEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Cliente (referencia al módulo customers)
  @Property({ type: 'uuid' })
  customer_id!: string

  // Límite de crédito
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  credit_limit!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Plazo de pago en días (15, 30, 60, 90)
  @Property({ type: 'smallint', default: 30 })
  payment_terms_days: number = 30

  // Estado
  @Enum({ items: () => CreditLimitStatus, type: 'string', length: 15, default: CreditLimitStatus.ACTIVE })
  status: CreditLimitStatus = CreditLimitStatus.ACTIVE

  // Aprobación
  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  // Saldo actual (calculado, se actualiza con cada transacción)
  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  current_balance: string = '0.00'

  // Notas
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Credit Transaction — Movimiento en la cuenta del cliente
// =============================================================================

@Entity({ tableName: 'dist_credit_transactions' })
export class DistCreditTransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Cliente
  @Property({ type: 'uuid' })
  customer_id!: string

  // Tipo de transacción
  @Enum({ items: () => CreditTransactionType, type: 'string', length: 15 })
  type!: CreditTransactionType

  // Referencia al documento origen
  @Enum({ items: () => CreditReferenceType, type: 'string', length: 20 })
  reference_type!: CreditReferenceType

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  // Monto (positivo = deuda/cargo, negativo = abono/pago)
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exchange_rate?: string | null

  // Saldo después de esta transacción
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  balance_after!: string

  // Fecha de vencimiento (para facturas)
  @Property({ type: 'date', nullable: true })
  due_date?: Date | null

  // Descripción
  @Property({ type: 'text', length: 255 })
  description!: string

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
