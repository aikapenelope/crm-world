import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum OrderStatus {
  DRAFT = 'draft', SENT = 'sent', CONFIRMED = 'confirmed',
  PARTIAL_RECEIVED = 'partial_received', RECEIVED = 'received', CANCELLED = 'cancelled',
}

@Entity({ tableName: 'const_material_orders' })
export class ConstMaterialOrderEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'text', length: 20 }) order_number!: string
  @Property({ type: 'text', length: 255 }) supplier_name!: string
  @Property({ type: 'text', length: 20, nullable: true }) supplier_rif?: string | null
  @Enum({ items: () => OrderStatus, type: 'string', length: 20 }) status!: OrderStatus
  @Property({ type: 'date' }) order_date!: Date
  @Property({ type: 'date', nullable: true }) expected_delivery?: Date | null
  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" }) total_amount: string = '0.00'
  @Property({ type: 'text', length: 10, default: "'USD'" }) currency: string = 'USD'
  @Property({ type: 'text', nullable: true }) notes?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}

@Entity({ tableName: 'const_material_order_lines' })
export class ConstMaterialOrderLineEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'uuid' }) order_id!: string
  @Property({ type: 'uuid', nullable: true }) budget_item_id?: string | null
  @Property({ type: 'text', length: 500 }) material_name!: string
  @Property({ type: 'text', length: 20 }) unit!: string
  @Property({ type: 'decimal', precision: 14, scale: 4 }) ordered_quantity!: string
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" }) received_quantity: string = '0.0000'
  @Property({ type: 'decimal', precision: 18, scale: 4 }) unit_price!: string
  @Property({ type: 'decimal', precision: 18, scale: 2 }) total_price!: string
}

@Entity({ tableName: 'const_material_stock' })
export class ConstMaterialStockEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'text', length: 500 }) material_name!: string
  @Property({ type: 'text', length: 20 }) unit!: string
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" }) budget_quantity: string = '0.0000'
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" }) ordered_quantity: string = '0.0000'
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" }) received_quantity: string = '0.0000'
  @Property({ type: 'decimal', precision: 14, scale: 4, default: "'0.0000'" }) consumed_quantity: string = '0.0000'
  @Property({ type: 'decimal', precision: 18, scale: 4, default: "'0.0000'" }) unit_cost: string = '0.0000'
  @Property({ type: 'text', length: 10, default: "'USD'" }) currency: string = 'USD'
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}
