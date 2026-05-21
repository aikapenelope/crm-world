import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum EnrollmentStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
  FAILED = 'failed',
}

@Entity({ tableName: 'academy_enrollments' })
export class AcademyEnrollmentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 30 })
  enrollment_number!: string

  @Property({ type: 'uuid' })
  group_id!: string

  /** Denormalized for display without joins */
  @Property({ type: 'text', length: 255 })
  student_name!: string

  @Property({ type: 'text', length: 255, nullable: true })
  student_email?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  student_phone?: string | null

  @Property({ type: 'date' })
  enrollment_date!: Date

  @Enum({ items: () => EnrollmentStatus, type: 'string', length: 20 })
  status: EnrollmentStatus = EnrollmentStatus.PENDING_PAYMENT

  @Property({ type: 'date', nullable: true })
  completion_date?: Date | null

  @Property({ type: 'text', length: 100, nullable: true })
  final_grade?: string | null

  @Property({ type: 'uuid', nullable: true })
  certificate_id?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  price_agreed!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
