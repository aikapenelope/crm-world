import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum SchoolEventType {
  CLASS_DAY = 'class_day',
  HOLIDAY = 'holiday',
  EXAM_PERIOD = 'exam_period',
  MEETING = 'meeting',
  EVENT = 'event',
  ADMINISTRATIVE = 'administrative',
  GRADUATION = 'graduation',
}

@Entity({ tableName: 'school_events' })
export class SchoolEventEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 200 })
  title!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Enum({ items: () => SchoolEventType, type: 'string', length: 20 })
  event_type!: SchoolEventType

  @Property({ type: 'date' })
  start_date!: Date

  @Property({ type: 'date' })
  end_date!: Date

  @Property({ type: 'json', nullable: true })
  applies_to_grades?: string[] | null

  @Property({ type: 'boolean', default: true })
  is_all_day: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
