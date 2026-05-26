import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TransactionType {
  SALE = 'sale',
  LEASE = 'lease',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ---------------------------------------------------------------------------
// Property Transactions
// ---------------------------------------------------------------------------

@Entity({ tableName: 'property_transactions' })
export class PropertyTransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Reference to the property being sold/leased
  @Property({ type: 'uuid' })
  property_id!: string

  // Reference to the buyer/tenant (customer_entities)
  @Property({ type: 'uuid', nullable: true })
  contact_id?: string | null

  // Transaction details
  @Enum({ items: () => TransactionType, type: 'string', length: 10 })
  transaction_type!: TransactionType

  @Enum({ items: () => TransactionStatus, type: 'string', length: 15, default: TransactionStatus.PENDING })
  status: TransactionStatus = TransactionStatus.PENDING

  @Property({ type: 'timestamptz', nullable: true })
  closing_date?: Date | null

  // Financial
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  sale_price!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  sale_price_ves?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exchange_rate?: string | null

  // Commission
  @Property({ type: 'decimal', precision: 5, scale: 2, default: '5.00' })
  commission_rate: string = '5.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  commission_amount?: string | null

  @Property({ type: 'text', length: 10, nullable: true })
  commission_currency?: string | null

  // Payment tracking
  @Property({ type: 'text', length: 50, nullable: true })
  payment_method_code?: string | null

  @Property({ type: 'uuid', nullable: true })
  payment_record_id?: string | null

  // Lease-specific fields
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  monthly_rent?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  lease_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  lease_end?: Date | null

  @Property({ type: 'smallint', nullable: true })
  lease_months?: number | null

  // Agents
  @Property({ type: 'uuid', nullable: true })
  listing_agent_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  buyer_agent_id?: string | null

  // Notes
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
