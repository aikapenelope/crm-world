import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum ChargeStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  CREDITED = 'credited',
}

export enum ChargeConcept {
  MENSUALIDAD = 'mensualidad',
  INSCRIPCION = 'inscripcion',
  MATERIAL = 'material',
  UNIFORME = 'uniforme',
  TRANSPORTE = 'transporte',
  EVENTO = 'evento',
  OTRO = 'otro',
}

export enum DiscountType {
  SIBLING = 'sibling',
  SCHOLARSHIP = 'scholarship',
  EMPLOYEE = 'employee',
  EARLY_PAYMENT = 'early_payment',
  OTHER = 'other',
}

// =============================================================================
// Tuition Plans
// =============================================================================

@Entity({ tableName: 'tuition_plans' })
export class TuitionPlanEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid', nullable: true })
  period_id?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  grade_level?: string | null

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monthly_amount!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'smallint', default: 10 })
  months: number = 10

  @Property({ type: 'smallint', default: 5 })
  due_day: number = 5

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '5.00' })
  late_fee_percentage: string = '5.00'

  @Property({ type: 'smallint', default: 10 })
  late_fee_after_days: number = 10

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Tuition Charges (one per student per month)
// =============================================================================

@Entity({ tableName: 'tuition_charges' })
export class TuitionChargeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid', nullable: true })
  plan_id?: string | null

  @Property({ type: 'text', length: 10 })
  period_month!: string

  @Enum({ items: () => ChargeConcept, type: 'string', length: 20, default: ChargeConcept.MENSUALIDAD })
  concept: ChargeConcept = ChargeConcept.MENSUALIDAD

  @Property({ type: 'text', length: 255, nullable: true })
  description?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Enum({ items: () => ChargeStatus, type: 'string', length: 15, default: ChargeStatus.PENDING })
  status: ChargeStatus = ChargeStatus.PENDING

  @Property({ type: 'date' })
  due_date!: Date

  @Property({ type: 'date', nullable: true })
  paid_date?: Date | null

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  late_fee_applied: string = '0.00'

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  amount_paid: string = '0.00'

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
// Tuition Payments
// =============================================================================

@Entity({ tableName: 'tuition_payments' })
export class TuitionPaymentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  charge_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid', nullable: true })
  representative_contact_id?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string

  @Property({ type: 'text', length: 10 })
  currency!: string

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchange_rate?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  payment_method_code?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  reference?: string | null

  @Property({ type: 'date' })
  payment_date!: Date

  @Property({ type: 'uuid', nullable: true })
  recorded_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// Tuition Discounts
// =============================================================================

@Entity({ tableName: 'tuition_discounts' })
export class TuitionDiscountEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Enum({ items: () => DiscountType, type: 'string', length: 20 })
  discount_type!: DiscountType

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixed_amount?: string | null

  @Property({ type: 'text', length: 255 })
  reason!: string

  @Property({ type: 'date', nullable: true })
  valid_from?: Date | null

  @Property({ type: 'date', nullable: true })
  valid_until?: Date | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
