import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum SessionType {
  THEORY = 'theory',
  PRACTICE = 'practice',
  EXAM = 'exam',
  ORIENTATION = 'orientation',
  MAKEUP = 'makeup',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ tableName: 'academy_sessions' })
export class AcademySessionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  group_id!: string

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'int' })
  session_number!: number

  @Property({ type: 'date' })
  session_date!: Date

  @Property({ type: 'text', length: 5 })
  start_time!: string

  @Property({ type: 'text', length: 5 })
  end_time!: string

  @Property({ type: 'text', length: 255, nullable: true })
  topic?: string | null

  @Enum({ items: () => SessionType, type: 'string', length: 15 })
  session_type: SessionType = SessionType.THEORY

  @Enum({ items: () => SessionStatus, type: 'string', length: 15 })
  status: SessionStatus = SessionStatus.SCHEDULED

  @Property({ type: 'text', nullable: true })
  instructor_notes?: string | null

  @Property({ type: 'int', default: 0 })
  attendance_count: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
