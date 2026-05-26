import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Payment method definition per tenant.
 * Each tenant can customize which methods are active and their details.
 */
@Entity({ tableName: 'payment_methods' })
export class PaymentMethodEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 50, unique: false })
  code!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', length: 10 })
  currency!: string

  @Property({ type: 'boolean', default: false })
  requiresReference: boolean = false

  @Property({ type: 'text', length: 100, nullable: true })
  referenceLabel?: string | null

  @Property({ type: 'text', nullable: true })
  instructions?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  icon?: string | null

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true

  @Property({ type: 'int', default: 0 })
  sortOrder: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

/**
 * Record of a payment received.
 * Links to an invoice/order via reference_type + reference_id.
 */
@Entity({ tableName: 'payment_records' })
export class PaymentRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 50 })
  payment_method_code!: string

  @Property({ type: 'decimal', precision: 18, scale: 4 })
  amount!: string

  @Property({ type: 'text', length: 10 })
  currency!: string

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  amount_usd?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  reference?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  reference_type?: string | null

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  @Property({ type: 'text', length: 20, default: 'pending' })
  status: string = 'pending'

  @Property({ type: 'uuid', nullable: true })
  confirmed_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  confirmed_at?: Date | null

  @Property({ type: 'timestamptz' })
  payment_date!: Date

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
