import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum SubcontractorSpecialty {
  EXCAVATION = 'excavation', CONCRETE = 'concrete', STEEL = 'steel', MASONRY = 'masonry',
  ELECTRICAL = 'electrical', MECHANICAL = 'mechanical', PLUMBING = 'plumbing',
  HVAC = 'hvac', FINISHING = 'finishing', LANDSCAPING = 'landscaping', OTHER = 'other',
}

export enum SubcontractStatus {
  DRAFT = 'draft', ACTIVE = 'active', COMPLETED = 'completed', TERMINATED = 'terminated',
}

export enum SubcontractPaymentStatus {
  PENDING = 'pending', APPROVED = 'approved', PAID = 'paid',
}

@Entity({ tableName: 'const_subcontractors' })
export class ConstSubcontractorEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'text', length: 255 }) name!: string
  @Property({ type: 'text', length: 20, nullable: true }) rif?: string | null
  @Enum({ items: () => SubcontractorSpecialty, type: 'string', length: 15 }) specialty!: SubcontractorSpecialty
  @Property({ type: 'text', length: 255, nullable: true }) contact_name?: string | null
  @Property({ type: 'text', length: 50, nullable: true }) phone?: string | null
  @Property({ type: 'text', length: 255, nullable: true }) email?: string | null
  @Property({ type: 'int', nullable: true }) rating?: number | null
  @Property({ type: 'boolean', default: true }) is_active: boolean = true
  @Property({ type: 'text', nullable: true }) notes?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}

@Entity({ tableName: 'const_subcontracts' })
export class ConstSubcontractEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'uuid' }) subcontractor_id!: string
  @Property({ type: 'text', length: 255 }) subcontractor_name!: string
  @Property({ type: 'text', length: 100 }) contract_number!: string
  @Property({ type: 'text' }) scope_description!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) contract_amount!: string
  @Property({ type: 'decimal', precision: 5, scale: 2, default: '10.00' }) retention_percent: string = '10.00'
  @Property({ type: 'text', length: 10, default: 'USD' }) currency: string = 'USD'
  @Property({ type: 'date', nullable: true }) start_date?: Date | null
  @Property({ type: 'date', nullable: true }) end_date?: Date | null
  @Enum({ items: () => SubcontractStatus, type: 'string', length: 15 }) status!: SubcontractStatus
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' }) amount_paid: string = '0.00'
  @Property({ type: 'text', nullable: true }) notes?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}

@Entity({ tableName: 'const_subcontract_payments' })
export class ConstSubcontractPaymentEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'uuid' }) subcontract_id!: string
  @Property({ type: 'text', length: 30 }) payment_number!: string
  @Property({ type: 'text', length: 255 }) period_description!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) gross_amount!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) retention_amount!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) net_amount!: string
  @Enum({ items: () => SubcontractPaymentStatus, type: 'string', length: 15 }) status!: SubcontractPaymentStatus
  @Property({ type: 'date', nullable: true }) payment_date?: Date | null
  @Property({ type: 'text', nullable: true }) notes?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}
