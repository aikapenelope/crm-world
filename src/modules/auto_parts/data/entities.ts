import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum PartCategory {
  BRAKES = 'brakes',
  ENGINE = 'engine',
  ELECTRICAL = 'electrical',
  SUSPENSION = 'suspension',
  FILTERS = 'filters',
  FLUIDS = 'fluids',
  BODY = 'body',
  OTHER = 'other',
}

@Entity({ tableName: 'auto_parts' })
export class AutoPartEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 50 })
  code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 100, nullable: true })
  brand?: string | null

  @Enum({ items: () => PartCategory, type: 'string', length: 15, default: PartCategory.OTHER })
  category: PartCategory = PartCategory.OTHER

  // Compatibilidad (marcas de vehículo)
  @Property({ type: 'json', nullable: true })
  compatible_brands?: string[] | null

  @Property({ type: 'text', length: 20, default: 'pieza' })
  unit: string = 'pieza'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  cost_price!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  sell_price!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'int', default: 0 })
  quantity_in_stock: number = 0

  @Property({ type: 'int', default: 0 })
  reorder_point: number = 0

  @Property({ type: 'text', length: 50, nullable: true })
  location?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
