import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum CertificateStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  REVOKED = 'revoked',
}

@Entity({ tableName: 'academy_certificates' })
export class AcademyCertificateEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 50 })
  certificate_number!: string

  @Property({ type: 'uuid' })
  enrollment_id!: string

  /** Denormalized snapshots at completion time */
  @Property({ type: 'text', length: 255 })
  course_name!: string

  @Property({ type: 'text', length: 100 })
  group_code!: string

  @Property({ type: 'text', length: 255 })
  instructor_name!: string

  @Property({ type: 'text', length: 255 })
  student_name!: string

  @Property({ type: 'timestamptz', nullable: true })
  issued_at?: Date | null

  @Property({ type: 'text', length: 100, nullable: true })
  final_grade?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  attendance_percent?: string | null

  @Property({ type: 'text', length: 50, default: 'standard' })
  template_type: string = 'standard'

  @Enum({ items: () => CertificateStatus, type: 'string', length: 15 })
  status: CertificateStatus = CertificateStatus.PENDING

  @Property({ type: 'text', length: 255, nullable: true })
  issued_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
