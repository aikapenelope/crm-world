import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity({ tableName: 'academy_payments' })
export class AcademyPaymentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 30 })
  payment_number!: string

  @Property({ type: 'uuid' })
  enrollment_id!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount_ves?: string | null

  @Property({ type: 'text', length: 50 })
  payment_method!: string

  @Property({ type: 'text', length: 100, nullable: true })
  reference?: string | null

  @Property({ type: 'date' })
  payment_date!: Date

  @Enum({ items: () => PaymentStatus, type: 'string', length: 15 })
  status: PaymentStatus = PaymentStatus.CONFIRMED

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
