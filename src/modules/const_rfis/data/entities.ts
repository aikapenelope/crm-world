import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum RFIDiscipline {
  CIVIL = 'civil', ARCHITECTURAL = 'architectural', STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical', MECHANICAL = 'mechanical', PLUMBING = 'plumbing', OTHER = 'other',
}
export enum RFIPriority { LOW = 'low', NORMAL = 'normal', HIGH = 'high', URGENT = 'urgent' }
export enum RFIStatus { OPEN = 'open', PENDING_RESPONSE = 'pending_response', ANSWERED = 'answered', CLOSED = 'closed', VOID = 'void' }
export enum SubmittalType { SHOP_DRAWING = 'shop_drawing', PRODUCT_DATA = 'product_data', SAMPLE = 'sample', CALCULATION = 'calculation', CERTIFICATE = 'certificate', TEST_REPORT = 'test_report' }
export enum SubmittalStatus { DRAFT = 'draft', SUBMITTED = 'submitted', UNDER_REVIEW = 'under_review', APPROVED = 'approved', APPROVED_AS_NOTED = 'approved_as_noted', REVISE_RESUBMIT = 'revise_resubmit', REJECTED = 'rejected' }

@Entity({ tableName: 'const_rfis' })
export class ConstRfiEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'text', length: 20 }) rfi_number!: string
  @Property({ type: 'text', length: 255 }) subject!: string
  @Property({ type: 'text' }) description!: string
  @Enum({ items: () => RFIDiscipline, type: 'string', length: 15 }) discipline!: RFIDiscipline
  @Enum({ items: () => RFIPriority, type: 'string', length: 10 }) priority!: RFIPriority
  @Enum({ items: () => RFIStatus, type: 'string', length: 20 }) status!: RFIStatus
  @Property({ type: 'text', length: 255 }) submitted_by!: string
  @Property({ type: 'text', length: 255, nullable: true }) assigned_to?: string | null
  @Property({ type: 'date', nullable: true }) due_date?: Date | null
  @Property({ type: 'timestamptz', nullable: true }) answered_at?: Date | null
  @Property({ type: 'text', nullable: true }) answer?: string | null
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true }) cost_impact?: string | null
  @Property({ type: 'int', nullable: true }) schedule_impact_days?: number | null
  @Property({ type: 'text', length: 100, nullable: true }) linked_drawing?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}

@Entity({ tableName: 'const_submittals' })
export class ConstSubmittalEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'text', length: 20 }) submittal_number!: string
  @Property({ type: 'text', length: 255 }) title!: string
  @Property({ type: 'text', length: 100, nullable: true }) spec_section?: string | null
  @Enum({ items: () => SubmittalType, type: 'string', length: 20 }) submittal_type!: SubmittalType
  @Enum({ items: () => SubmittalStatus, type: 'string', length: 25 }) status!: SubmittalStatus
  @Property({ type: 'text', length: 255 }) submitted_by!: string
  @Property({ type: 'text', length: 255, nullable: true }) reviewer?: string | null
  @Property({ type: 'date', nullable: true }) submitted_at?: Date | null
  @Property({ type: 'date', nullable: true }) due_date?: Date | null
  @Property({ type: 'date', nullable: true }) reviewed_at?: Date | null
  @Property({ type: 'text', nullable: true }) review_notes?: string | null
  @Property({ type: 'int', default: 1 }) revision_number: number = 1
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}
