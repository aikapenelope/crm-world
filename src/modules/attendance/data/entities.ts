import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  HALF_DAY = 'half_day',
}

// =============================================================================
// Attendance Records
// =============================================================================

@Entity({ tableName: 'attendance_records' })
export class AttendanceRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'date' })
  date!: Date

  @Enum({ items: () => AttendanceStatus, type: 'string', length: 15 })
  status!: AttendanceStatus

  @Property({ type: 'text', nullable: true })
  excuse_reason?: string | null

  @Property({ type: 'uuid', nullable: true })
  excuse_attachment_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  recorded_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Attendance Summary (materialized per student per month)
// =============================================================================

@Entity({ tableName: 'attendance_summary' })
export class AttendanceSummaryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'text', length: 10 })
  month!: string

  @Property({ type: 'smallint', default: 0 })
  days_present: number = 0

  @Property({ type: 'smallint', default: 0 })
  days_absent: number = 0

  @Property({ type: 'smallint', default: 0 })
  days_late: number = 0

  @Property({ type: 'smallint', default: 0 })
  days_excused: number = 0

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  attendance_percentage: string = '0.00'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
