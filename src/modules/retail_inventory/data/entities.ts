import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum StockCountStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum StockCountType {
  FULL = 'full',
  PARTIAL = 'partial',
  SPOT_CHECK = 'spot_check',
}

export enum CountLineStatus {
  PENDING = 'pending',
  COUNTED = 'counted',
  VERIFIED = 'verified',
}

// =============================================================================
// Retail Stock Count — Conteo cíclico
// =============================================================================

@Entity({ tableName: 'retail_stock_counts' })
export class RetailStockCountEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  branch_id!: string

  @Property({ type: 'text' })
  count_number!: string

  @Enum({ items: () => StockCountStatus, type: 'string', length: 15, default: StockCountStatus.PLANNED })
  status: StockCountStatus = StockCountStatus.PLANNED

  @Enum({ items: () => StockCountType, type: 'string', length: 15, default: StockCountType.FULL })
  count_type: StockCountType = StockCountType.FULL

  @Property({ type: 'date' })
  planned_date!: Date

  @Property({ type: 'timestamptz', nullable: true })
  started_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null

  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Retail Stock Count Line — Líneas del conteo
// =============================================================================

@Entity({ tableName: 'retail_stock_count_lines' })
export class RetailStockCountLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  count_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'int' })
  system_quantity!: number

  @Property({ type: 'int', nullable: true })
  counted_quantity?: number | null

  @Property({ type: 'int', nullable: true })
  difference?: number | null

  @Enum({ items: () => CountLineStatus, type: 'string', length: 10, default: CountLineStatus.PENDING })
  status: CountLineStatus = CountLineStatus.PENDING

  @Property({ type: 'text', nullable: true })
  notes?: string | null
}

// =============================================================================
// Retail Stock Rotation — Métricas de rotación (calculado por worker)
// =============================================================================

@Entity({ tableName: 'retail_stock_rotation' })
export class RetailStockRotationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  branch_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  // Período: "2026-05"
  @Property({ type: 'text', length: 7 })
  period_month!: string

  @Property({ type: 'int', default: 0 })
  opening_stock: number = 0

  @Property({ type: 'int', default: 0 })
  closing_stock: number = 0

  @Property({ type: 'int', default: 0 })
  total_sold: number = 0

  @Property({ type: 'int', default: 0 })
  total_received: number = 0

  // Índice de rotación: sold / avg_stock
  @Property({ type: 'decimal', precision: 10, scale: 2, default: "'0.00'" })
  rotation_index: string = '0.00'

  // Días de stock: stock / daily_avg_sales
  @Property({ type: 'int', default: 0 })
  days_of_stock: number = 0

  // Dead stock: sin movimiento en 90+ días
  @Property({ type: 'boolean', default: false })
  is_dead_stock: boolean = false

  @Property({ type: 'timestamptz', nullable: true })
  last_movement_at?: Date | null

  @Property({ type: 'timestamptz' })
  calculated_at: Date = new Date()
}
