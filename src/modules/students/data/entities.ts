import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum GradeLevel {
  MATERNAL = 'maternal',
  PREESCOLAR_1 = 'preescolar_1',
  PREESCOLAR_2 = 'preescolar_2',
  PREESCOLAR_3 = 'preescolar_3',
  PRIMARIA_1 = 'primaria_1',
  PRIMARIA_2 = 'primaria_2',
  PRIMARIA_3 = 'primaria_3',
  PRIMARIA_4 = 'primaria_4',
  PRIMARIA_5 = 'primaria_5',
  PRIMARIA_6 = 'primaria_6',
  BACHILLERATO_1 = 'bachillerato_1',
  BACHILLERATO_2 = 'bachillerato_2',
  BACHILLERATO_3 = 'bachillerato_3',
  BACHILLERATO_4 = 'bachillerato_4',
  BACHILLERATO_5 = 'bachillerato_5',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
  SUSPENDED = 'suspended',
  TRANSFERRED = 'transferred',
}

export enum Gender {
  MASCULINO = 'masculino',
  FEMENINO = 'femenino',
}

export enum RepresentativeRelationship {
  PADRE = 'padre',
  MADRE = 'madre',
  ABUELO = 'abuelo',
  ABUELA = 'abuela',
  TIO = 'tio',
  TIA = 'tia',
  TUTOR_LEGAL = 'tutor_legal',
  OTRO = 'otro',
}

// =============================================================================
// Students
// =============================================================================

@Entity({ tableName: 'students' })
export class StudentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  first_name!: string

  @Property({ type: 'text', length: 100 })
  last_name!: string

  @Property({ type: 'text', length: 20, nullable: true })
  cedula?: string | null

  @Property({ type: 'date', nullable: true })
  birth_date?: Date | null

  @Enum({ items: () => Gender, type: 'string', length: 15, nullable: true })
  gender?: Gender | null

  @Property({ type: 'text', length: 5, nullable: true })
  blood_type?: string | null

  @Property({ type: 'uuid', nullable: true })
  photo_attachment_id?: string | null

  @Enum({ items: () => GradeLevel, type: 'string', length: 20 })
  grade_level!: GradeLevel

  @Property({ type: 'text', length: 5, default: 'A' })
  section: string = 'A'

  @Enum({ items: () => EnrollmentStatus, type: 'string', length: 20, default: EnrollmentStatus.ACTIVE })
  enrollment_status: EnrollmentStatus = EnrollmentStatus.ACTIVE

  @Property({ type: 'date', nullable: true })
  enrollment_date?: Date | null

  @Property({ type: 'text', length: 255, nullable: true })
  previous_school?: string | null

  @Property({ type: 'text', nullable: true })
  medical_notes?: string | null

  @Property({ type: 'text', nullable: true })
  allergies?: string | null

  @Property({ type: 'text', length: 200, nullable: true })
  emergency_contact_name?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  emergency_contact_phone?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Student Representatives (junction with customers.person)
// =============================================================================

@Entity({ tableName: 'student_representatives' })
export class StudentRepresentativeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid' })
  contact_id!: string

  @Enum({ items: () => RepresentativeRelationship, type: 'string', length: 20 })
  relationship!: RepresentativeRelationship

  @Property({ type: 'boolean', default: false })
  is_primary: boolean = false

  @Property({ type: 'boolean', default: true })
  is_authorized_pickup: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
