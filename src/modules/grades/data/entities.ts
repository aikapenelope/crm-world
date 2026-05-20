import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Subjects (materias)
// =============================================================================

@Entity({ tableName: 'subjects' })
export class SubjectEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', length: 10 })
  code!: string

  @Property({ type: 'json', nullable: true })
  grade_levels?: string[] | null

  @Property({ type: 'boolean', default: false })
  is_qualitative: boolean = false

  @Property({ type: 'smallint', default: 0 })
  sort_order: number = 0

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Grade Periods (lapsos)
// =============================================================================

@Entity({ tableName: 'grade_periods' })
export class GradePeriodEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 20 })
  school_year!: string

  @Property({ type: 'smallint' })
  period_number!: number

  @Property({ type: 'text', length: 50 })
  name!: string

  @Property({ type: 'date' })
  start_date!: Date

  @Property({ type: 'date' })
  end_date!: Date

  @Property({ type: 'boolean', default: false })
  is_active: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Student Grades (one per student × subject × period)
// =============================================================================

@Entity({ tableName: 'student_grades' })
export class StudentGradeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid' })
  subject_id!: string

  @Property({ type: 'uuid' })
  period_id!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: string | null

  @Property({ type: 'text', length: 5, nullable: true })
  qualitative_score?: string | null

  @Property({ type: 'text', nullable: true })
  observations?: string | null

  @Property({ type: 'uuid', nullable: true })
  recorded_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Report Cards (boletines)
// =============================================================================

export enum ReportCardStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELIVERED = 'delivered',
}

@Entity({ tableName: 'report_cards' })
export class ReportCardEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid' })
  period_id!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  average_score?: string | null

  @Property({ type: 'text', nullable: true })
  general_observations?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  teacher_name?: string | null

  @Property({ type: 'uuid', nullable: true })
  pdf_attachment_id?: string | null

  @Enum({ items: () => ReportCardStatus, type: 'string', length: 15, default: ReportCardStatus.DRAFT })
  status: ReportCardStatus = ReportCardStatus.DRAFT

  @Property({ type: 'timestamptz', nullable: true })
  generated_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
