import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum BudgetCategory {
  CIVIL = 'civil',
  ELECTRICAL = 'electrical',
  MECHANICAL = 'mechanical',
  ARCHITECTURAL = 'architectural',
  SPECIAL = 'special',
  GENERAL = 'general',
}

export enum ResourceType {
  MATERIAL = 'material',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  SUBCONTRACT = 'subcontract',
  OVERHEAD = 'overhead',
}

// =============================================================================
// ConstBudgetItemEntity — Partida presupuestaria (árbol: capítulo → partida)
// =============================================================================

@Entity({ tableName: 'const_budget_items' })
export class ConstBudgetItemEntity {
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
  item_number!: string

  @Property({ type: 'int', default: 0 })
  level: number = 0

  @Property({ type: 'text', length: 500 })
  name!: string

  @Property({ type: 'text', length: 20, nullable: true })
  unit?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 4, default: '0.0000' })
  quantity: string = '0.0000'

  @Property({ type: 'decimal', precision: 18, scale: 4, default: '0.0000' })
  unit_cost: string = '0.0000'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  total_cost: string = '0.00'

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Enum({ items: () => BudgetCategory, type: 'string', length: 15 })
  category!: BudgetCategory

  @Property({ type: 'int', default: 0 })
  sort_order: number = 0

  @Property({ type: 'boolean', default: false })
  is_chapter: boolean = false

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// ConstBudgetResourceEntity — Insumo del APU
// =============================================================================

@Entity({ tableName: 'const_budget_resources' })
export class ConstBudgetResourceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  budget_item_id!: string

  @Enum({ items: () => ResourceType, type: 'string', length: 15 })
  resource_type!: ResourceType

  @Property({ type: 'text', length: 500 })
  name!: string

  @Property({ type: 'text', length: 20 })
  unit!: string

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity!: string

  @Property({ type: 'decimal', precision: 18, scale: 4 })
  unit_price!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'int', default: 0 })
  sort_order: number = 0
}
