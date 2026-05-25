import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum GroupStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// SessionType and SessionStatus enums live in academy_sessions/data/entities.ts

@Entity({ tableName: 'academy_groups' })
export class AcademyGroupEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  group_code!: string

  @Property({ type: 'uuid' })
  course_id!: string

  @Property({ type: 'uuid', nullable: true })
  instructor_id?: string | null

  @Property({ type: 'date' })
  start_date!: Date

  @Property({ type: 'date' })
  end_date!: Date

  /** Days of the week: ['monday','wednesday','friday'] */
  @Property({ type: 'json' })
  schedule_days: string[] = []

  /** Start time in HH:MM format */
  @Property({ type: 'text', length: 5 })
  schedule_time!: string

  @Property({ type: 'int', default: 90 })
  session_duration_minutes: number = 90

  @Property({ type: 'text', length: 255, nullable: true })
  location?: string | null

  @Property({ type: 'text', nullable: true })
  online_link?: string | null

  @Enum({ items: () => GroupStatus, type: 'string', length: 20 })
  status: GroupStatus = GroupStatus.SCHEDULED

  @Property({ type: 'int', default: 20 })
  max_students: number = 20

  @Property({ type: 'int', default: 0 })
  enrolled_count: number = 0

  @Property({ type: 'int', default: 0 })
  sessions_count: number = 0

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
// AcademySessionEntity lives in academy_sessions/data/entities.ts
