import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum WithholdingType {
  IVA = 'iva',
  ISLR = 'islr',
}

export enum WithholdingStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  DECLARED = 'declared',
}

// =============================================================================
// Withholding Record
// =============================================================================

/**
 * Registro de retención de IVA o ISLR.
 * Se genera cuando la empresa (agente de retención) retiene impuesto
 * al pagar a un proveedor.
 */
@Entity({ tableName: 've_withholding_records' })
export class VeWithholdingRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Tipo de retención
  @Enum({ items: () => WithholdingType, type: 'string', length: 10 })
  type!: WithholdingType

  // Período (formato: "2026-05" para IVA quincenal, "2026-05" para ISLR mensual)
  @Property({ type: 'text', length: 7 })
  period_month!: string

  // Quincena (1 = primera quincena, 2 = segunda quincena) — solo para IVA
  @Property({ type: 'smallint', default: 1 })
  fortnight: number = 1

  // Datos del proveedor
  @Property({ type: 'text', length: 15 })
  supplier_rif!: string

  @Property({ type: 'text', length: 255 })
  supplier_name!: string

  // Datos de la factura del proveedor
  @Property({ type: 'text', length: 50 })
  invoice_number!: string

  @Property({ type: 'date' })
  invoice_date!: Date

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  invoice_amount!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  tax_amount!: string

  // Retención
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  withholding_rate!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  withholding_amount!: string

  // Número de comprobante de retención (se genera al aplicar)
  @Property({ type: 'text', length: 50, nullable: true })
  voucher_number?: string | null

  // Estado
  @Enum({ items: () => WithholdingStatus, type: 'string', length: 15, default: WithholdingStatus.PENDING })
  status: WithholdingStatus = WithholdingStatus.PENDING

  // Fecha de declaración
  @Property({ type: 'timestamptz', nullable: true })
  declared_at?: Date | null

  // Notas
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
