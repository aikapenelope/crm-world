import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'academy_instructors' })
export class AcademyInstructorEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 255, nullable: true })
  email?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  phone?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  specialty?: string | null

  @Property({ type: 'text', nullable: true })
  bio?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate_usd?: string | null

  @Property({ type: 'json', nullable: true })
  modalities?: string[] | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
