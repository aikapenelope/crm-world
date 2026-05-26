import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum CircularCategory {
  GENERAL = 'general',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  ASSEMBLY = 'assembly',
  PAYMENT = 'payment',
  RULES = 'rules',
  EMERGENCY = 'emergency',
}

export enum CircularPriority {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

export enum CircularStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
}

export enum VoteType {
  YES_NO = 'yes_no',
  MULTIPLE_CHOICE = 'multiple_choice',
  RANKING = 'ranking',
}

export enum VoteStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum AssemblyType {
  ORDINARY = 'ordinary',
  EXTRAORDINARY = 'extraordinary',
}

export enum AssemblyStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// =============================================================================
// CondoCircularEntity — Circular/Aviso
// =============================================================================

@Entity({ tableName: 'condo_circulars' })
export class CondoCircularEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 50 })
  circular_number!: string

  @Property({ type: 'text', length: 255 })
  title!: string

  @Property({ type: 'text' })
  content!: string

  @Enum({ items: () => CircularCategory, type: 'string', length: 15 })
  category!: CircularCategory

  @Enum({ items: () => CircularPriority, type: 'string', length: 15 })
  priority!: CircularPriority

  @Property({ type: 'timestamptz', nullable: true })
  published_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null

  @Property({ type: 'boolean', default: false })
  send_whatsapp: boolean = false

  @Property({ type: 'int', default: 0 })
  total_recipients: number = 0

  @Property({ type: 'int', default: 0 })
  total_read: number = 0

  @Property({ type: 'uuid', nullable: true })
  created_by?: string | null

  @Enum({ items: () => CircularStatus, type: 'string', length: 15 })
  status!: CircularStatus

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoVoteEntity — Votación/Consulta
// =============================================================================

@Entity({ tableName: 'condo_votes' })
export class CondoVoteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 255 })
  title!: string

  @Property({ type: 'text' })
  description!: string

  @Enum({ items: () => VoteType, type: 'string', length: 20 })
  vote_type!: VoteType

  @Property({ type: 'json' })
  options!: string[]

  @Property({ type: 'boolean', default: true })
  requires_quorum: boolean = true

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '50.00' })
  quorum_percent: string = '50.00'

  @Enum({ items: () => VoteStatus, type: 'string', length: 15 })
  status!: VoteStatus

  @Property({ type: 'timestamptz' })
  opens_at!: Date

  @Property({ type: 'timestamptz' })
  closes_at!: Date

  @Property({ type: 'json', nullable: true })
  results?: Record<string, unknown> | null

  @Property({ type: 'int', default: 0 })
  total_votes: number = 0

  // Total alícuota que ha votado (para verificar quórum)
  @Property({ type: 'decimal', precision: 8, scale: 5, default: '0.00000' })
  total_aliquot_voted: string = '0.00000'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoVoteCastEntity — Voto individual (ponderado por alícuota Art. 23 LPH)
// =============================================================================

@Entity({ tableName: 'condo_vote_casts' })
export class CondoVoteCastEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  vote_id!: string

  @Property({ type: 'uuid' })
  unit_id!: string

  @Property({ type: 'text', length: 255 })
  choice!: string

  // Peso del voto proporcional a la alícuota (Art. 23 LPH)
  @Property({ type: 'decimal', precision: 8, scale: 5 })
  aliquot_weight!: string

  @Property({ type: 'timestamptz' })
  cast_at: Date = new Date()
}

// =============================================================================
// CondoAssemblyEntity — Acta de asamblea
// =============================================================================

@Entity({ tableName: 'condo_assemblies' })
export class CondoAssemblyEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 50 })
  assembly_number!: string

  @Enum({ items: () => AssemblyType, type: 'string', length: 15 })
  assembly_type!: AssemblyType

  @Property({ type: 'text', length: 255 })
  title!: string

  @Property({ type: 'date' })
  date!: Date

  @Property({ type: 'text', length: 10, nullable: true })
  start_time?: string | null

  @Property({ type: 'text', length: 10, nullable: true })
  end_time?: string | null

  @Property({ type: 'text', nullable: true })
  location?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  quorum_present?: string | null

  @Property({ type: 'int', default: 0 })
  attendees_count: number = 0

  @Property({ type: 'json', nullable: true })
  agenda?: string[] | null

  @Property({ type: 'text', nullable: true })
  minutes?: string | null

  @Property({ type: 'json', nullable: true })
  decisions?: string[] | null

  @Enum({ items: () => AssemblyStatus, type: 'string', length: 15 })
  status!: AssemblyStatus

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
