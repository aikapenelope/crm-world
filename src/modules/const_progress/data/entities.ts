import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum ValuationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  INVOICED = 'invoiced',
  PAID = 'paid',
  REJECTED = 'rejected',
}

// =============================================================================
// ConstValuationEntity — Valuación (cobro parcial por avance)
// =============================================================================

@Entity({ tableName: 'const_valuations' })
export class ConstValuationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  project_id!: string

  @Property({ type: 'text', length: 20 })
  valuation_number!: string

  @Property({ type: 'date' })
  period_from!: Date

  @Property({ type: 'date' })
  period_to!: Date

  @Enum({ items: () => ValuationStatus, type: 'string', length: 15 })
  status!: ValuationStatus

  // Financials
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_contract!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  previous_billed: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  current_period: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  retention_amount: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  advance_deduction: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  net_payable: string = '0.00'

  // VES equivalent (multi-currency)
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount_ves?: string | null

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  // Workflow
  @Property({ type: 'timestamptz', nullable: true })
  submitted_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  @Property({ type: 'text', length: 255, nullable: true })
  approved_by?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  invoice_number?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// ConstValuationLineEntity — Línea de valuación por partida
// =============================================================================

@Entity({ tableName: 'const_valuation_lines' })
export class ConstValuationLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  valuation_id!: string

  @Property({ type: 'uuid' })
  budget_item_id!: string

  // Snapshots
  @Property({ type: 'text', length: 30 })
  item_number!: string

  @Property({ type: 'text', length: 500 })
  item_name!: string

  @Property({ type: 'text', length: 20, nullable: true })
  unit?: string | null

  // Contract data
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  contracted_quantity!: string

  @Property({ type: 'decimal', precision: 18, scale: 4 })
  unit_price!: string

  // Progress
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" })
  previous_quantity: string = '0.0000'

  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" })
  current_quantity: string = '0.0000'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  current_amount: string = '0.00'

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  accumulated_percent: string = '0.00'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
