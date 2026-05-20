import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum DeliveryOrderStatus {
  PREPARING = 'preparing',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
}

export enum DeliveryItemStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  PARTIAL = 'partial',
  RETURNED = 'returned',
  REJECTED = 'rejected',
}

// =============================================================================
// Delivery Order — Orden de despacho
// =============================================================================

@Entity({ tableName: 'dist_delivery_orders' })
export class DistDeliveryOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Ruta asociada (opcional — puede ser entrega directa)
  @Property({ type: 'uuid', nullable: true })
  route_id?: string | null

  // Conductor/repartidor
  @Property({ type: 'uuid', nullable: true })
  driver_id?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  vehicle_plate?: string | null

  // Fecha de despacho
  @Property({ type: 'date' })
  dispatch_date!: Date

  // Estado
  @Enum({ items: () => DeliveryOrderStatus, type: 'string', length: 15, default: DeliveryOrderStatus.PREPARING })
  status: DeliveryOrderStatus = DeliveryOrderStatus.PREPARING

  // Contadores
  @Property({ type: 'int', default: 0 })
  total_items: number = 0

  @Property({ type: 'int', default: 0 })
  delivered_items: number = 0

  @Property({ type: 'int', default: 0 })
  returned_items: number = 0

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

// =============================================================================
// Delivery Item — Item individual a entregar
// =============================================================================

@Entity({ tableName: 'dist_delivery_items' })
export class DistDeliveryItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  delivery_order_id!: string

  // Pedido de venta asociado
  @Property({ type: 'uuid' })
  sales_order_id!: string

  // Cliente
  @Property({ type: 'uuid' })
  customer_id!: string

  // Producto
  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  // Cantidades
  @Property({ type: 'int' })
  quantity_dispatched!: number

  @Property({ type: 'int', default: 0 })
  quantity_delivered: number = 0

  @Property({ type: 'int', default: 0 })
  quantity_returned: number = 0

  // Estado
  @Enum({ items: () => DeliveryItemStatus, type: 'string', length: 15, default: DeliveryItemStatus.PENDING })
  status: DeliveryItemStatus = DeliveryItemStatus.PENDING

  // Notas de entrega
  @Property({ type: 'text', nullable: true })
  delivery_notes?: string | null

  // Confirmación
  @Property({ type: 'timestamptz', nullable: true })
  confirmed_at?: Date | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
