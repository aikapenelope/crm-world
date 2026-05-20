import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum MilestoneType {
  START = 'start',
  DELIVERY = 'delivery',
  PAYMENT = 'payment',
  INSPECTION = 'inspection',
  PERMIT = 'permit',
  OTHER = 'other',
}

export enum MilestoneStatus {
  UPCOMING = 'upcoming',
  AT_RISK = 'at_risk',
  ACHIEVED = 'achieved',
  DELAYED = 'delayed',
}

// =============================================================================
// ConstTaskEntity — Tarea del cronograma
// =============================================================================

@Entity({ tableName: 'const_tasks' })
export class ConstTaskEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  project_id!: string

  @Property({ type: 'uuid', nullable: true })
  parent_id?: string | null

  @Property({ type: 'text', length: 30 })
  task_number!: string

  @Property({ type: 'text', length: 500 })
  name!: string

  @Property({ type: 'int', default: 0 })
  level: number = 0

  @Enum({ items: () => TaskStatus, type: 'string', length: 15 })
  status!: TaskStatus

  @Property({ type: 'date' })
  planned_start!: Date

  @Property({ type: 'date' })
  planned_end!: Date

  @Property({ type: 'date', nullable: true })
  actual_start?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_end?: Date | null

  @Property({ type: 'int', default: 1 })
  duration_days: number = 1

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  progress_percent: string = '0.00'

  @Property({ type: 'text', length: 255, nullable: true })
  assigned_to?: string | null

  @Property({ type: 'boolean', default: false })
  is_milestone: boolean = false

  @Property({ type: 'boolean', default: false })
  is_critical: boolean = false

  @Property({ type: 'json', nullable: true })
  predecessor_ids?: string[] | null

  @Property({ type: 'uuid', nullable: true })
  budget_item_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'int', default: 0 })
  sort_order: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// ConstMilestoneEntity — Hito del proyecto
// =============================================================================

@Entity({ tableName: 'const_milestones' })
export class ConstMilestoneEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  project_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Enum({ items: () => MilestoneType, type: 'string', length: 15 })
  milestone_type!: MilestoneType

  @Property({ type: 'date' })
  planned_date!: Date

  @Property({ type: 'date', nullable: true })
  actual_date?: Date | null

  @Enum({ items: () => MilestoneStatus, type: 'string', length: 15 })
  status!: MilestoneStatus

  @Property({ type: 'boolean', default: false })
  linked_valuation: boolean = false

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
