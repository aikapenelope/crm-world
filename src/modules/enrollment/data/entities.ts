import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum EnrollmentPeriodStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum ApplicationType {
  NEW = 'new',
  RENEWAL = 'renewal',
  TRANSFER = 'transfer',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  DOCUMENTS_PENDING = 'documents_pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// =============================================================================
// Enrollment Periods
// =============================================================================

@Entity({ tableName: 'enrollment_periods' })
export class EnrollmentPeriodEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', length: 20 })
  school_year!: string

  @Property({ type: 'date' })
  start_date!: Date

  @Property({ type: 'date' })
  end_date!: Date

  @Enum({ items: () => EnrollmentPeriodStatus, type: 'string', length: 10, default: EnrollmentPeriodStatus.OPEN })
  status: EnrollmentPeriodStatus = EnrollmentPeriodStatus.OPEN

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  enrollment_fee?: string | null

  @Property({ type: 'text', length: 10, default: "'USD'" })
  fee_currency: string = 'USD'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Enrollment Applications
// =============================================================================

@Entity({ tableName: 'enrollment_applications' })
export class EnrollmentApplicationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  period_id!: string

  @Property({ type: 'uuid', nullable: true })
  student_id?: string | null

  @Property({ type: 'uuid' })
  applicant_contact_id!: string

  @Enum({ items: () => ApplicationType, type: 'string', length: 15 })
  application_type!: ApplicationType

  @Property({ type: 'text', length: 20 })
  requested_grade!: string

  @Property({ type: 'text', length: 5, nullable: true })
  requested_section?: string | null

  @Enum({ items: () => ApplicationStatus, type: 'string', length: 20, default: ApplicationStatus.PENDING })
  status: ApplicationStatus = ApplicationStatus.PENDING

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  @Property({ type: 'text', nullable: true })
  rejection_reason?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Enrollment Documents (checklist per application)
// =============================================================================

@Entity({ tableName: 'enrollment_documents' })
export class EnrollmentDocumentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  application_id!: string

  @Property({ type: 'text', length: 50 })
  document_type!: string

  @Property({ type: 'uuid', nullable: true })
  attachment_id?: string | null

  @Enum({ items: () => DocumentStatus, type: 'string', length: 15, default: DocumentStatus.PENDING })
  status: DocumentStatus = DocumentStatus.PENDING

  @Property({ type: 'text', nullable: true })
  rejection_reason?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
