import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum MaintenanceCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  ELEVATOR = 'elevator',
  STRUCTURAL = 'structural',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  GARDEN = 'garden',
  POOL = 'pool',
  OTHER = 'other',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum RequestStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SupplierSpecialty {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  ELEVATOR = 'elevator',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  GARDEN = 'garden',
  POOL = 'pool',
  GENERAL = 'general',
  OTHER = 'other',
}

// =============================================================================
// CondoMaintenanceRequestEntity — Solicitud de mantenimiento
// =============================================================================

@Entity({ tableName: 'condo_maintenance_requests' })
export class CondoMaintenanceRequestEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 20 })
  request_number!: string

  @Property({ type: 'uuid', nullable: true })
  requested_by_unit_id?: string | null

  @Property({ type: 'text', length: 255 })
  requested_by_name!: string

  @Property({ type: 'text', length: 50, nullable: true })
  requested_by_phone?: string | null

  @Enum({ items: () => MaintenanceCategory, type: 'string', length: 15 })
  category!: MaintenanceCategory

  @Enum({ items: () => MaintenancePriority, type: 'string', length: 15 })
  priority!: MaintenancePriority

  @Property({ type: 'text', length: 255 })
  title!: string

  @Property({ type: 'text' })
  description!: string

  @Property({ type: 'text', nullable: true })
  location?: string | null

  @Enum({ items: () => RequestStatus, type: 'string', length: 15 })
  status!: RequestStatus

  @Property({ type: 'text', length: 255, nullable: true })
  assigned_to?: string | null

  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  estimated_cost?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  actual_cost?: string | null

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  resolution_notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoWorkOrderEntity — Orden de trabajo para proveedor
// =============================================================================

@Entity({ tableName: 'condo_work_orders' })
export class CondoWorkOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 20 })
  order_number!: string

  @Property({ type: 'uuid', nullable: true })
  request_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'text', length: 255 })
  supplier_name!: string

  @Property({ type: 'text' })
  description!: string

  @Property({ type: 'date', nullable: true })
  scheduled_date?: Date | null

  @Enum({ items: () => WorkOrderStatus, type: 'string', length: 15 })
  status!: WorkOrderStatus

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  quoted_amount?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  approved_amount?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  final_amount?: string | null

  @Property({ type: 'text', length: 10, default: "'USD'" })
  currency: string = 'USD'

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// CondoSupplierEntity — Proveedor de servicios
// =============================================================================

@Entity({ tableName: 'condo_suppliers' })
export class CondoSupplierEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 20, nullable: true })
  rif?: string | null

  @Enum({ items: () => SupplierSpecialty, type: 'string', length: 15 })
  specialty!: SupplierSpecialty

  @Property({ type: 'text', length: 50, nullable: true })
  phone?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  email?: string | null

  @Property({ type: 'text', nullable: true })
  address?: string | null

  @Property({ type: 'int', nullable: true })
  rating?: number | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
