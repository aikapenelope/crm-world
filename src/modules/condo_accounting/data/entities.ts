import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum EntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum EntryCategory {
  CONDO_FEE = 'condo_fee',
  EXTRAORDINARY = 'extraordinary',
  RESERVE_FUND = 'reserve_fund',
  MAINTENANCE = 'maintenance',
  UTILITIES = 'utilities',
  PAYROLL = 'payroll',
  INSURANCE = 'insurance',
  LEGAL = 'legal',
  OTHER = 'other',
}

export enum BudgetStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

// =============================================================================
// CondoAccountingEntryEntity — Movimiento contable
// =============================================================================

@Entity({ tableName: 'condo_accounting_entries' })
export class CondoAccountingEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Enum({ items: () => EntryType, type: 'string', length: 10 })
  entry_type!: EntryType

  @Enum({ items: () => EntryCategory, type: 'string', length: 15 })
  category!: EntryCategory

  @Property({ type: 'text', length: 255 })
  description!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  reference_type?: string | null

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  @Property({ type: 'date' })
  entry_date!: Date

  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'text', length: 255, nullable: true })
  supplier_name?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  document_number?: string | null

  @Property({ type: 'boolean', default: false })
  is_reserve_fund: boolean = false

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'uuid', nullable: true })
  recorded_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoReserveFundEntity — Control del fondo de reserva
// =============================================================================

@Entity({ tableName: 'condo_reserve_fund' })
export class CondoReserveFundEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  opening_balance!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  contributions: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  withdrawals: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  closing_balance!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  min_required?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoBudgetEntity — Presupuesto anual
// =============================================================================

@Entity({ tableName: 'condo_budgets' })
export class CondoBudgetEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'int' })
  year!: number

  @Enum({ items: () => BudgetStatus, type: 'string', length: 10 })
  status!: BudgetStatus

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_income!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_expenses!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '10.00' })
  reserve_fund_percent: string = '10.00'

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'boolean', default: false })
  approved_in_assembly: boolean = false

  @Property({ type: 'date', nullable: true })
  assembly_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
