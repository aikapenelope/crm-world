import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum VisitStatus {
  PLANNED = 'planned',
  VISITED = 'visited',
  SKIPPED = 'skipped',
  ORDER_TAKEN = 'order_taken',
  NO_ORDER = 'no_order',
}

// =============================================================================
// Distribution Route
// =============================================================================

@Entity({ tableName: 'dist_routes' })
export class DistRouteEntity {
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

  @Property({ type: 'text', length: 100, nullable: true })
  zone?: string | null

  // Día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
  @Property({ type: 'smallint', nullable: true })
  day_of_week?: number | null

  // Vendedor asignado
  @Property({ type: 'uuid', nullable: true })
  assigned_seller_id?: string | null

  // Repartidor asignado
  @Property({ type: 'uuid', nullable: true })
  assigned_driver_id?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  vehicle_plate?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Route Stop — Parada en la ruta (cliente)
// =============================================================================

@Entity({ tableName: 'dist_route_stops' })
export class DistRouteStopEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  route_id!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  // Orden de visita
  @Property({ type: 'int', default: 0 })
  sequence_order: number = 0

  @Property({ type: 'text', nullable: true })
  address?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  contact_phone?: string | null

  @Property({ type: 'text', nullable: true })
  delivery_notes?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Route Visit — Registro de visita realizada
// =============================================================================

@Entity({ tableName: 'dist_route_visits' })
export class DistRouteVisitEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  route_id!: string

  @Property({ type: 'uuid' })
  stop_id!: string

  @Property({ type: 'date' })
  visit_date!: Date

  @Enum({ items: () => VisitStatus, type: 'string', length: 15, default: VisitStatus.PLANNED })
  status: VisitStatus = VisitStatus.PLANNED

  // Pedido generado (si aplica)
  @Property({ type: 'uuid', nullable: true })
  order_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  visited_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
