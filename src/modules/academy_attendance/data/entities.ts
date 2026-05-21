import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity({ tableName: 'academy_attendance' })
export class AcademyAttendanceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  session_id!: string

  @Property({ type: 'uuid' })
  enrollment_id!: string

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Enum({ items: () => AttendanceStatus, type: 'string', length: 10 })
  status: AttendanceStatus = AttendanceStatus.PRESENT

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  recorded_at: Date = new Date()
}
