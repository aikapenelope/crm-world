import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Factura mensual del abonado.
 *
 * La factura se emite en USD (moneda base del ISP venezolano) y también
 * incluye el equivalente en VES al tipo BCV del día de emisión para el
 * cálculo del IVA (que la ley venezolana exige en bolívares).
 */
@Entity({ tableName: 'isp_invoices' })
export class IspInvoiceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  subscriber_id!: string

  /** FAC-{YYYYMM}-{seq:5} */
  @Property({ type: 'text', length: 30 })
  invoice_number!: string

  /** Número de control SENIAT (opcional — muchos ISPs PYME aún no tienen) */
  @Property({ type: 'text', length: 30, nullable: true })
  control_number?: string | null

  /** "2026-05" — período facturado */
  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'date' })
  issue_date!: Date

  @Property({ type: 'date' })
  due_date!: Date

  /** pending / partial / paid / overdue / cancelled / in_dispute */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  /** Monto base del plan en USD */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  base_amount_usd!: string

  /** Cargos adicionales (IP fija, etc.) */
  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  addons_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  discount_amount_usd: string = '0.00'

  /** Subtotal antes de impuestos */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  subtotal_usd!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '16.00' })
  iva_rate: string = '16.00'

  /** IVA en bolívares (calculado sobre el monto en VES) */
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  iva_amount_ves?: string | null

  /** Tasa BCV del día de emisión */
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  bcv_rate?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  total_usd!: string

  /** Equivalente en VES (referencial) */
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  total_ves?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  paid_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  balance_usd!: string

  @Property({ type: 'timestamptz', nullable: true })
  paid_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

/**
 * Registro de pago recibido de un abonado.
 * Multi-moneda: USD, VES, USDT. IGTF aplica cuando el pago no es en VES.
 */
@Entity({ tableName: 'isp_payments' })
export class IspPaymentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  invoice_id!: string

  @Property({ type: 'uuid' })
  subscriber_id!: string

  @Property({ type: 'date' })
  payment_date!: Date

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount_usd!: string

  /** USD / VES / USDT */
  @Property({ type: 'text', length: 10 })
  currency: string = 'USD'

  /** zelle / pago_movil / efectivo_usd / efectivo_ves / transferencia / binance / otro */
  @Property({ type: 'text', length: 30 })
  payment_method!: string

  @Property({ type: 'text', length: 100, nullable: true })
  reference_number?: string | null

  @Property({ type: 'boolean', default: false })
  igtf_applies: boolean = false

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  igtf_amount_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  bcv_rate_at_payment?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount_ves?: string | null

  @Property({ type: 'uuid', nullable: true })
  confirmed_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  confirmed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  photo_receipt_url?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

/**
 * Ciclo de facturación: define el día del mes en que se generan las facturas
 * para un grupo de abonados.
 */
@Entity({ tableName: 'isp_billing_cycles' })
export class IspBillingCycleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'smallint' })
  billing_day!: number

  @Property({ type: 'text', length: 20, nullable: true })
  segment?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
