import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INFRASTRUCTURE = 'infrastructure',
  INDUSTRIAL = 'industrial',
  RENOVATION = 'renovation',
}

export enum ProjectStatus {
  PROSPECT = 'prospect',
  BIDDING = 'bidding',
  AWARDED = 'awarded',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ContractType {
  FIXED_PRICE = 'fixed_price',
  UNIT_PRICE = 'unit_price',
  COST_PLUS = 'cost_plus',
  DESIGN_BUILD = 'design_build',
}

export enum ClientType {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

// =============================================================================
// ConstProjectEntity — Proyecto de construcción
// =============================================================================

@Entity({ tableName: 'const_projects' })
export class ConstProjectEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 50 })
  code!: string

  @Enum({ items: () => ProjectType, type: 'string', length: 20 })
  project_type!: ProjectType

  @Enum({ items: () => ProjectStatus, type: 'string', length: 20 })
  status!: ProjectStatus

  // Client
  @Property({ type: 'uuid', nullable: true })
  client_id?: string | null

  @Property({ type: 'text', length: 255 })
  client_name!: string

  @Enum({ items: () => ClientType, type: 'string', length: 10 })
  client_type!: ClientType

  // Location
  @Property({ type: 'text', nullable: true })
  location?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  city?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  state?: string | null

  // Contract
  @Property({ type: 'text', length: 100, nullable: true })
  contract_number?: string | null

  @Enum({ items: () => ContractType, type: 'string', length: 20 })
  contract_type!: ContractType

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  contract_amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Dates
  @Property({ type: 'date', nullable: true })
  start_date?: Date | null

  @Property({ type: 'date', nullable: true })
  planned_end_date?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_end_date?: Date | null

  // Financial terms
  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  advance_percent: string = '0.00'

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'10.00'" })
  retention_percent: string = '10.00'

  // Progress
  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  overall_progress: string = '0.00'

  // Team
  @Property({ type: 'text', length: 255, nullable: true })
  project_manager?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  site_supervisor?: string | null

  // Metadata
  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
