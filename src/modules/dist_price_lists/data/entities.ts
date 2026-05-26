import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum PriceListType {
  STANDARD = 'standard',
  PROMOTIONAL = 'promotional',
  VOLUME = 'volume',
}

// =============================================================================
// Price List — Lista de precios
// =============================================================================

@Entity({ tableName: 'dist_price_lists' })
export class DistPriceListEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', length: 50 })
  code!: string

  @Enum({ items: () => PriceListType, type: 'string', length: 15, default: PriceListType.STANDARD })
  type: PriceListType = PriceListType.STANDARD

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'boolean', default: false })
  is_default: boolean = false

  // Vigencia (nullable = sin vencimiento)
  @Property({ type: 'date', nullable: true })
  valid_from?: Date | null

  @Property({ type: 'date', nullable: true })
  valid_until?: Date | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Price List Item — Precio por producto en una lista
// =============================================================================

@Entity({ tableName: 'dist_price_list_items' })
export class DistPriceListItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  price_list_id!: string

  // Producto del catálogo
  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  // Precio unitario
  @Property({ type: 'decimal', precision: 18, scale: 4 })
  unit_price!: string

  // Cantidad mínima para este precio (descuento por volumen)
  @Property({ type: 'int', default: 1 })
  min_quantity: number = 1

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Customer Price List Assignment — Qué lista tiene cada cliente
// =============================================================================

@Entity({ tableName: 'dist_customer_price_lists' })
export class DistCustomerPriceListEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  @Property({ type: 'uuid' })
  price_list_id!: string

  // Prioridad (si tiene varias listas, cuál aplica primero)
  @Property({ type: 'int', default: 0 })
  priority: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
