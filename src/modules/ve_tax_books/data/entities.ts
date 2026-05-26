import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum BookType {
  SALES = 'sales',
  PURCHASES = 'purchases',
}

export enum DocumentType {
  FACTURA = 'factura',
  NOTA_CREDITO = 'nota_credito',
  NOTA_DEBITO = 'nota_debito',
  COMPROBANTE_RETENCION = 'comprobante_retencion',
}

// =============================================================================
// Tax Book Entry
// =============================================================================

/**
 * Registro en el libro de compras o ventas.
 * Cada entrada representa una factura emitida (ventas) o recibida (compras)
 * para la declaración mensual de IVA ante el SENIAT.
 */
@Entity({ tableName: 've_tax_book_entries' })
export class VeTaxBookEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Tipo de libro: ventas o compras
  @Enum({ items: () => BookType, type: 'string', length: 15 })
  book_type!: BookType

  // Período mensual (formato: "2026-05")
  @Property({ type: 'text', length: 7 })
  period_month!: string

  // Fecha de la operación
  @Property({ type: 'date' })
  entry_date!: Date

  // Tipo de documento
  @Enum({ items: () => DocumentType, type: 'string', length: 30 })
  document_type!: DocumentType

  // Número de factura/documento
  @Property({ type: 'text', length: 50 })
  document_number!: string

  // Número de control (solo si tiene — no todas las facturas lo tienen)
  @Property({ type: 'text', length: 50, nullable: true })
  control_number?: string | null

  // Datos de la contraparte (cliente en ventas, proveedor en compras)
  @Property({ type: 'text', length: 15 })
  counterpart_rif!: string

  @Property({ type: 'text', length: 255 })
  counterpart_name!: string

  // Operación exenta de IVA
  @Property({ type: 'boolean', default: false })
  is_exempt: boolean = false

  // Montos fiscales
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  taxable_base!: string

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '16.00' })
  tax_rate: string = '16.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  tax_amount: string = '0.00'

  // IGTF (si aplica — pago en divisas)
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  igtf_amount: string = '0.00'

  // Retención IVA (si aplica — cuando el cliente es agente de retención)
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  withholding_amount: string = '0.00'

  // Total del documento
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_amount!: string

  // Moneda y tasa de cambio
  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exchange_rate?: string | null

  // Método de pago (código del módulo payment_methods)
  @Property({ type: 'text', length: 50, nullable: true })
  payment_method_code?: string | null

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
