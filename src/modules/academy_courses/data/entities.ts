import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum CourseModality {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}

@Entity({ tableName: 'academy_courses' })
export class AcademyCourseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', length: 100 })
  category!: string

  @Property({ type: 'text', length: 50 })
  level!: string

  @Property({ type: 'decimal', precision: 6, scale: 1 })
  duration_hours!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  price_usd!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Enum({ items: () => CourseModality, type: 'string', length: 15 })
  modality!: CourseModality

  @Property({ type: 'int', default: 20 })
  max_students: number = 20

  @Property({ type: 'text', nullable: true })
  prerequisites?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
// AcademyInstructorEntity lives in academy_instructors/data/entities.ts
