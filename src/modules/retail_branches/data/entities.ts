import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum BranchType {
  STORE = 'store',
  WAREHOUSE = 'warehouse',
  KIOSK = 'kiosk',
  POPUP = 'popup',
}

export enum BranchStaffRole {
  MANAGER = 'manager',
  CASHIER = 'cashier',
  STOCK_CLERK = 'stock_clerk',
  SALES_REP = 'sales_rep',
}

export enum TransferStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

// =============================================================================
// Retail Branch — Sucursal/Tienda
// =============================================================================

@Entity({ tableName: 'retail_branches' })
export class RetailBranchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'text', length: 20 })
  code!: string

  @Enum({ items: () => BranchType, type: 'string', length: 15, default: BranchType.STORE })
  branch_type: BranchType = BranchType.STORE

  // Referencia al SalesChannel de Open Mercato (opcional)
  @Property({ type: 'uuid', nullable: true })
  sales_channel_id?: string | null

  // Dirección
  @Property({ type: 'text', nullable: true })
  address_line1?: string | null

  @Property({ type: 'text', nullable: true })
  address_line2?: string | null

  @Property({ type: 'text', nullable: true })
  city?: string | null

  @Property({ type: 'text', nullable: true })
  state?: string | null

  @Property({ type: 'text', nullable: true })
  postal_code?: string | null

  // Coordenadas
  @Property({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: string | null

  // Contacto
  @Property({ type: 'text', nullable: true })
  phone?: string | null

  @Property({ type: 'text', nullable: true })
  email?: string | null

  // Gerente
  @Property({ type: 'uuid', nullable: true })
  manager_user_id?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  // Horario de operación: { mon: { open: "08:00", close: "18:00" }, ... }
  @Property({ type: 'json', nullable: true })
  operating_hours?: Record<string, { open: string; close: string }> | null

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Retail Branch Staff — Personal asignado a sucursal
// =============================================================================

@Entity({ tableName: 'retail_branch_staff' })
export class RetailBranchStaffEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  branch_id!: string

  @Property({ type: 'uuid' })
  user_id!: string

  @Enum({ items: () => BranchStaffRole, type: 'string', length: 15 })
  role!: BranchStaffRole

  @Property({ type: 'boolean', default: false })
  is_primary: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// Retail Transfer — Transferencia entre sucursales
// =============================================================================

@Entity({ tableName: 'retail_transfers' })
export class RetailTransferEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  transfer_number!: string

  @Property({ type: 'uuid' })
  from_branch_id!: string

  @Property({ type: 'uuid' })
  to_branch_id!: string

  @Enum({ items: () => TransferStatus, type: 'string', length: 20, default: TransferStatus.DRAFT })
  status: TransferStatus = TransferStatus.DRAFT

  @Property({ type: 'uuid' })
  requested_by!: string

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  shipped_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  received_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Retail Transfer Line — Líneas de transferencia
// =============================================================================

@Entity({ tableName: 'retail_transfer_lines' })
export class RetailTransferLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  transfer_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'int' })
  quantity_requested!: number

  @Property({ type: 'int', default: 0 })
  quantity_shipped: number = 0

  @Property({ type: 'int', default: 0 })
  quantity_received: number = 0

  @Property({ type: 'text', nullable: true })
  notes?: string | null
}
