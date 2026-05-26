import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum CommissionType {
  SALE = 'sale',
  COLLECTION = 'collection',
  GOAL_BONUS = 'goal_bonus',
}

export enum CommissionRecordStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
}

// =============================================================================
// Commission Rule — Regla de comisión
// =============================================================================

@Entity({ tableName: 'dist_commission_rules' })
export class DistCommissionRuleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Vendedor específico (null = aplica a todos)
  @Property({ type: 'uuid', nullable: true })
  seller_id?: string | null

  // Tipo de comisión
  @Enum({ items: () => CommissionType, type: 'string', length: 15 })
  type!: CommissionType

  // Porcentaje de comisión
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  rate!: string

  // Monto mínimo para aplicar (0 = sin mínimo)
  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  min_amount: string = '0.00'

  // Meta para bonus (null = no aplica)
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  goal_amount?: string | null

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
// Commission Record — Comisión generada
// =============================================================================

@Entity({ tableName: 'dist_commission_records' })
export class DistCommissionRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Vendedor
  @Property({ type: 'uuid' })
  seller_id!: string

  // Período
  @Property({ type: 'text', length: 7 })
  period_month!: string

  // Tipo
  @Enum({ items: () => CommissionType, type: 'string', length: 15 })
  type!: CommissionType

  // Referencia al documento que generó la comisión
  @Property({ type: 'text', length: 30, nullable: true })
  reference_type?: string | null

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  // Montos
  @Property({ type: 'decimal', precision: 18, scale: 2 })
  base_amount!: string

  @Property({ type: 'decimal', precision: 5, scale: 2 })
  rate_applied!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  commission_amount!: string

  // Estado
  @Enum({ items: () => CommissionRecordStatus, type: 'string', length: 10, default: CommissionRecordStatus.PENDING })
  status: CommissionRecordStatus = CommissionRecordStatus.PENDING

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
