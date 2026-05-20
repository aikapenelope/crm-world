import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum AnnouncementType {
  CIRCULAR = 'circular',
  NOTICE = 'notice',
  REMINDER = 'reminder',
  EMERGENCY = 'emergency',
}

export enum AnnouncementAudience {
  ALL = 'all',
  GRADE_SPECIFIC = 'grade_specific',
  SECTION_SPECIFIC = 'section_specific',
}

@Entity({ tableName: 'school_announcements' })
export class SchoolAnnouncementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 200 })
  title!: string

  @Property({ type: 'text' })
  body!: string

  @Enum({ items: () => AnnouncementType, type: 'string', length: 15 })
  announcement_type!: AnnouncementType

  @Enum({ items: () => AnnouncementAudience, type: 'string', length: 20, default: AnnouncementAudience.ALL })
  target_audience: AnnouncementAudience = AnnouncementAudience.ALL

  @Property({ type: 'json', nullable: true })
  target_grades?: string[] | null

  @Property({ type: 'json', nullable: true })
  target_sections?: string[] | null

  @Property({ type: 'timestamptz', nullable: true })
  published_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null

  @Property({ type: 'uuid' })
  created_by!: string

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

@Entity({ tableName: 'announcement_reads' })
export class AnnouncementReadEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  announcement_id!: string

  @Property({ type: 'uuid' })
  contact_id!: string

  @Property({ type: 'timestamptz' })
  read_at: Date = new Date()
}
