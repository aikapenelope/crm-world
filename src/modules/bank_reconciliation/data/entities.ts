import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum ReconciliationStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  IGNORED = 'ignored',
}

export enum TransactionDirection {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

// =============================================================================
// Bank Statement (uploaded file metadata)
// =============================================================================

@Entity({ tableName: 'bank_statements' })
export class BankStatementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Bank identification
  @Property({ type: 'text', length: 50 })
  bank_code!: string

  @Property({ type: 'text', length: 100 })
  bank_name!: string

  @Property({ type: 'text', length: 50, nullable: true })
  account_number?: string | null

  // File info
  @Property({ type: 'text', length: 255 })
  filename!: string

  @Property({ type: 'text', length: 7 })
  period_month!: string

  // Stats
  @Property({ type: 'int', default: 0 })
  total_transactions: number = 0

  @Property({ type: 'int', default: 0 })
  matched_count: number = 0

  @Property({ type: 'int', default: 0 })
  unmatched_count: number = 0

  // Timestamps
  @Property({ type: 'timestamptz' })
  uploaded_at: Date = new Date()

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Bank Transaction (parsed from CSV)
// =============================================================================

@Entity({ tableName: 'bank_transactions' })
export class BankTransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Link to statement
  @Property({ type: 'uuid' })
  statement_id!: string

  // Transaction data (parsed from CSV)
  @Property({ type: 'date' })
  transaction_date!: Date

  @Property({ type: 'text', length: 255, nullable: true })
  description?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  reference?: string | null

  @Enum({ items: () => TransactionDirection, type: 'string', length: 10 })
  direction!: TransactionDirection

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: 'VES' })
  currency: string = 'VES'

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balance?: string | null

  // Reconciliation
  @Enum({ items: () => ReconciliationStatus, type: 'string', length: 15, default: ReconciliationStatus.PENDING })
  reconciliation_status: ReconciliationStatus = ReconciliationStatus.PENDING

  // Link to matched payment record (from payment_methods module)
  @Property({ type: 'uuid', nullable: true })
  matched_payment_id?: string | null

  @Property({ type: 'text', nullable: true })
  match_notes?: string | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
