import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum FeeType {
  ORDINARY = 'ordinary',
  EXTRAORDINARY = 'extraordinary',
  SPECIAL = 'special',
}

export enum DistributionMethod {
  ALIQUOT = 'aliquot',
  EQUAL = 'equal',
  CUSTOM = 'custom',
}

export enum FeeConfigStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  GENERATED = 'generated',
  CLOSED = 'closed',
}

export enum ReceiptStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// =============================================================================
// CondoFeeConfigEntity — Configuración de cuota por edificio
// =============================================================================

@Entity({ tableName: 'condo_fee_configs' })
export class CondoFeeConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Enum({ items: () => FeeType, type: 'string', length: 15 })
  fee_type!: FeeType

  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  base_amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Enum({ items: () => DistributionMethod, type: 'string', length: 10 })
  distribution_method!: DistributionMethod

  @Property({ type: 'date' })
  due_date!: Date

  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  late_fee_percent: string = '0.00'

  @Property({ type: 'int', default: 15 })
  late_fee_days: number = 15

  @Property({ type: 'boolean', default: false })
  approved_in_assembly: boolean = false

  @Property({ type: 'date', nullable: true })
  assembly_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Enum({ items: () => FeeConfigStatus, type: 'string', length: 15 })
  status!: FeeConfigStatus

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoReceiptEntity — Recibo individual por unidad
// =============================================================================

@Entity({ tableName: 'condo_receipts' })
export class CondoReceiptEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  fee_config_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'uuid' })
  unit_id!: string

  @Property({ type: 'text', length: 50 })
  receipt_number!: string

  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'text', length: 255 })
  owner_name!: string

  @Property({ type: 'text', length: 20 })
  unit_number!: string

  @Property({ type: 'decimal', precision: 8, scale: 5 })
  aliquot_percent!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount_usd!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount_ves?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  late_fee_amount: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_amount!: string

  @Enum({ items: () => ReceiptStatus, type: 'string', length: 15 })
  status!: ReceiptStatus

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  paid_amount: string = '0.00'

  @Property({ type: 'timestamptz', nullable: true })
  paid_at?: Date | null

  @Property({ type: 'text', length: 50, nullable: true })
  payment_method?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  payment_reference?: string | null

  @Property({ type: 'date' })
  due_date!: Date

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoReceiptLineEntity — Desglose del recibo
// =============================================================================

@Entity({ tableName: 'condo_receipt_lines' })
export class CondoReceiptLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  receipt_id!: string

  @Property({ type: 'text', length: 255 })
  concept!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string

  @Property({ type: 'boolean', default: true })
  is_common_expense: boolean = true
}
