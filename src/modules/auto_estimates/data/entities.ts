import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum EstimateStatus { DRAFT = 'draft', SENT = 'sent', PARTIALLY_APPROVED = 'partially_approved', APPROVED = 'approved', REJECTED = 'rejected', EXPIRED = 'expired' }
export enum EstimateItemType { LABOR = 'labor', PART = 'part' }

@Entity({ tableName: 'auto_estimates' })
export class AutoEstimateEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) service_order_id!: string
  @Property({ type: 'uuid' }) vehicle_id!: string
  @Property({ type: 'uuid' }) customer_id!: string
  @Property({ type: 'text', length: 30 }) estimate_number!: string
  @Enum({ items: () => EstimateStatus, type: 'string', length: 20, default: EstimateStatus.DRAFT }) status: EstimateStatus = EstimateStatus.DRAFT
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' }) subtotal_labor: string = '0.00'
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' }) subtotal_parts: string = '0.00'
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' }) tax_amount: string = '0.00'
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' }) total_amount: string = '0.00'
  @Property({ type: 'text', length: 10, default: 'USD' }) currency: string = 'USD'
  @Property({ type: 'date', nullable: true }) valid_until?: Date | null
  @Property({ type: 'timestamptz', nullable: true }) sent_at?: Date | null
  @Property({ type: 'timestamptz', nullable: true }) approved_at?: Date | null
  @Property({ type: 'text', nullable: true }) customer_notes?: string | null
  @Property({ type: 'text', nullable: true }) public_link?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
  @Property({ type: 'timestamptz', nullable: true }) deleted_at?: Date | null
}

@Entity({ tableName: 'auto_estimate_items' })
export class AutoEstimateItemEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) estimate_id!: string
  @Enum({ items: () => EstimateItemType, type: 'string', length: 10 }) type!: EstimateItemType
  @Property({ type: 'text', length: 255 }) description!: string
  @Property({ type: 'int', default: 1 }) quantity: number = 1
  @Property({ type: 'decimal', precision: 18, scale: 2 }) unit_price!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) total_price!: string
  @Property({ type: 'boolean', default: false }) is_approved: boolean = false
  @Property({ type: 'text', nullable: true }) declined_reason?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
}
