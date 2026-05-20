import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum ServiceOrderStatus {
  RECEIVED = 'received',
  DIAGNOSIS = 'diagnosis',
  ESTIMATE_SENT = 'estimate_sent',
  APPROVED = 'approved',
  IN_REPAIR = 'in_repair',
  QUALITY_CHECK = 'quality_check',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ServiceOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ServiceOrderItemType {
  LABOR = 'labor',
  PART = 'part',
}

// =============================================================================
// Service Order — Orden de trabajo del taller
// =============================================================================

@Entity({ tableName: 'auto_service_orders' })
export class AutoServiceOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Número de orden (secuencial)
  @Property({ type: 'text', length: 30 })
  order_number!: string

  // Vehículo y cliente
  @Property({ type: 'uuid' })
  vehicle_id!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  // Status workflow
  @Enum({ items: () => ServiceOrderStatus, type: 'string', length: 15, default: ServiceOrderStatus.RECEIVED })
  status: ServiceOrderStatus = ServiceOrderStatus.RECEIVED

  // Recepción
  @Property({ type: 'timestamptz' })
  received_at: Date = new Date()

  @Property({ type: 'int', default: 0 })
  km_at_entry: number = 0

  // Lo que reporta el cliente
  @Property({ type: 'text', nullable: true })
  customer_complaint?: string | null

  // Hallazgos del técnico
  @Property({ type: 'text', nullable: true })
  diagnosis_notes?: string | null

  // Técnico asignado
  @Property({ type: 'uuid', nullable: true })
  assigned_technician_id?: string | null

  // Fechas
  @Property({ type: 'timestamptz', nullable: true })
  estimated_completion?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  actual_completion?: Date | null

  // Prioridad
  @Enum({ items: () => ServiceOrderPriority, type: 'string', length: 10, default: ServiceOrderPriority.NORMAL })
  priority: ServiceOrderPriority = ServiceOrderPriority.NORMAL

  // Totales
  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  total_labor: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  total_parts: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2, default: "'0.00'" })
  total_amount: string = '0.00'

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

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
// Service Order Item — Línea de trabajo (mano de obra o repuesto)
// =============================================================================

@Entity({ tableName: 'auto_service_order_items' })
export class AutoServiceOrderItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  service_order_id!: string

  // Tipo: mano de obra o repuesto
  @Enum({ items: () => ServiceOrderItemType, type: 'string', length: 10 })
  type!: ServiceOrderItemType

  @Property({ type: 'text', length: 255 })
  description!: string

  @Property({ type: 'int', default: 1 })
  quantity: number = 1

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  unit_price!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total_price!: string

  // Referencia a repuesto (si type = 'part')
  @Property({ type: 'uuid', nullable: true })
  part_id?: string | null

  // Aprobado por el cliente
  @Property({ type: 'boolean', default: true })
  is_approved: boolean = true

  // Notas del técnico
  @Property({ type: 'text', nullable: true })
  technician_notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
