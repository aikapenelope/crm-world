import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Fiscal configuration per tenant/organization.
 * Stores the tenant's RIF, tax rates, and withholding settings.
 */
@Entity({ tableName: 've_fiscal_configs' })
export class VeFiscalConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Fiscal identity
  @Property({ type: 'text', length: 15 })
  rif!: string

  @Property({ type: 'text', length: 255 })
  business_name!: string

  @Property({ type: 'text' })
  fiscal_address!: string

  // Tax settings
  @Property({ type: 'boolean', default: false })
  is_special_taxpayer: boolean = false

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '16.00' })
  iva_rate: string = '16.00'

  @Property({ type: 'boolean', default: true })
  applies_igtf: boolean = true

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '3.00' })
  igtf_rate: string = '3.00'

  // Withholding agent settings
  @Property({ type: 'boolean', default: false })
  is_iva_withholding_agent: boolean = false

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '75.00' })
  iva_withholding_percentage: string = '75.00'

  @Property({ type: 'boolean', default: false })
  is_islr_withholding_agent: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

/**
 * Fiscal identity for customers (people/companies).
 * Extends the CRM customer entity with Venezuelan fiscal data.
 * Links via customer_entity_id to the customers module.
 */
@Entity({ tableName: 've_fiscal_identities' })
export class VeFiscalIdentityEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  customer_entity_id!: string

  // RIF or Cédula
  @Property({ type: 'text', length: 15 })
  fiscal_id!: string

  @Property({ type: 'text', length: 10 })
  fiscal_id_type!: string // 'rif' | 'cedula'

  @Property({ type: 'text', length: 255, nullable: true })
  fiscal_name?: string | null

  @Property({ type: 'text', nullable: true })
  fiscal_address?: string | null

  @Property({ type: 'boolean', default: false })
  is_special_taxpayer: boolean = false

  @Property({ type: 'boolean', default: false })
  is_iva_withholding_agent: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
