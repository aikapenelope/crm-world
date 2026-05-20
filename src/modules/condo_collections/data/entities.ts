import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum DebtorStatus {
  ACTIVE = 'active',
  AGREEMENT = 'agreement',
  LEGAL = 'legal',
  RESOLVED = 'resolved',
}

export enum AgreementStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

export enum ActionType {
  WHATSAPP = 'whatsapp',
  CALL = 'call',
  VISIT = 'visit',
  LETTER = 'letter',
  LEGAL_NOTICE = 'legal_notice',
  ASSEMBLY_REPORT = 'assembly_report',
}

export enum ActionResult {
  CONTACTED = 'contacted',
  NO_ANSWER = 'no_answer',
  PROMISED_PAYMENT = 'promised_payment',
  REFUSED = 'refused',
  AGREEMENT_REACHED = 'agreement_reached',
}

// =============================================================================
// CondoDebtorEntity — Morosos (tabla materializada)
// =============================================================================

@Entity({ tableName: 'condo_debtors' })
export class CondoDebtorEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'uuid' })
  unit_id!: string

  @Property({ type: 'text', length: 255 })
  owner_name!: string

  @Property({ type: 'text', length: 50, nullable: true })
  owner_phone?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_debt!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'int', default: 0 })
  months_overdue: number = 0

  @Property({ type: 'date' })
  oldest_pending_date!: Date

  @Property({ type: 'date', nullable: true })
  last_payment_date?: Date | null

  @Property({ type: 'date', nullable: true })
  last_contact_date?: Date | null

  @Property({ type: 'text', length: 20, nullable: true })
  contact_method?: string | null

  @Enum({ items: () => DebtorStatus, type: 'string', length: 15 })
  status!: DebtorStatus

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoPaymentAgreementEntity — Acuerdo de pago para morosos
// =============================================================================

@Entity({ tableName: 'condo_payment_agreements' })
export class CondoPaymentAgreementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  unit_id!: string

  @Property({ type: 'uuid', nullable: true })
  debtor_id?: string | null

  @Property({ type: 'text', length: 50 })
  agreement_number!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_debt!: string

  @Property({ type: 'int' })
  installments!: number

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  installment_amount!: string

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'date' })
  start_date!: Date

  @Enum({ items: () => AgreementStatus, type: 'string', length: 15 })
  status!: AgreementStatus

  @Property({ type: 'int', default: 0 })
  paid_installments: number = 0

  @Property({ type: 'date', nullable: true })
  next_due_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoCollectionActionEntity — Registro de gestiones de cobro
// =============================================================================

@Entity({ tableName: 'condo_collection_actions' })
export class CondoCollectionActionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  unit_id!: string

  @Enum({ items: () => ActionType, type: 'string', length: 20 })
  action_type!: ActionType

  @Property({ type: 'timestamptz' })
  action_date!: Date

  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  @Enum({ items: () => ActionResult, type: 'string', length: 20 })
  result!: ActionResult

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'date', nullable: true })
  next_action_date?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
