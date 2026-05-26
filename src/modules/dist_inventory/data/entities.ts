import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum MovementType {
  PURCHASE_IN = 'purchase_in',
  SALE_OUT = 'sale_out',
  RETURN_IN = 'return_in',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  COUNT = 'count',
}

export enum MovementReferenceType {
  SALES_ORDER = 'sales_order',
  PURCHASE_ORDER = 'purchase_order',
  RETURN = 'return',
  MANUAL = 'manual',
}

// =============================================================================
// Inventory Item — Stock por producto
// =============================================================================

@Entity({ tableName: 'dist_inventory_items' })
export class DistInventoryItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Producto del catálogo
  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  // Bodega (default: main)
  @Property({ type: 'text', length: 50, default: 'main' })
  warehouse_code: string = 'main'

  // Cantidades
  @Property({ type: 'int', default: 0 })
  quantity_available: number = 0

  @Property({ type: 'int', default: 0 })
  quantity_committed: number = 0

  @Property({ type: 'int', default: 0 })
  quantity_in_transit: number = 0

  // Reposición
  @Property({ type: 'int', default: 0 })
  reorder_point: number = 0

  @Property({ type: 'int', default: 0 })
  reorder_quantity: number = 0

  // Costo
  @Property({ type: 'decimal', precision: 18, scale: 4, default: '0.0000' })
  unit_cost: string = '0.0000'

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  // Último conteo físico
  @Property({ type: 'date', nullable: true })
  last_count_date?: Date | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Inventory Movement — Movimiento de stock
// =============================================================================

@Entity({ tableName: 'dist_inventory_movements' })
export class DistInventoryMovementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'text', length: 50, default: 'main' })
  warehouse_code: string = 'main'

  // Tipo de movimiento
  @Enum({ items: () => MovementType, type: 'string', length: 15 })
  type!: MovementType

  // Cantidad (positivo = entrada, negativo = salida)
  @Property({ type: 'int' })
  quantity!: number

  // Referencia al documento origen
  @Enum({ items: () => MovementReferenceType, type: 'string', length: 20, default: MovementReferenceType.MANUAL })
  reference_type: MovementReferenceType = MovementReferenceType.MANUAL

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  // Costo unitario en este movimiento
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  unit_cost?: string | null

  // Notas
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  // Quién realizó el movimiento
  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  // Timestamp
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
