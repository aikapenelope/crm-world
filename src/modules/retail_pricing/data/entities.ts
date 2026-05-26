import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum PricingChannel {
  STORE = 'store',
  ONLINE = 'online',
  WHOLESALE = 'wholesale',
}

export enum PriceAlertType {
  BELOW_COST = 'below_cost',
  BELOW_MARGIN = 'below_margin',
  ABOVE_REGULATED = 'above_regulated',
  EXCHANGE_RATE_DRIFT = 'exchange_rate_drift',
}

export enum PriceAlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

// =============================================================================
// Pricing Rule — Regla de margen por categoría
// =============================================================================

@Entity({ tableName: 'retail_pricing_rules' })
export class RetailPricingRuleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  // Categoría del catálogo (null = aplica a todo)
  @Property({ type: 'uuid', nullable: true })
  category_id?: string | null

  // Margen mínimo obligatorio (%)
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  min_margin_percent!: string

  // Margen objetivo/sugerido (%)
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  target_margin_percent?: string | null

  // Canal al que aplica (null = todos)
  @Enum({ items: () => PricingChannel, type: 'string', length: 15, nullable: true })
  channel?: PricingChannel | null

  // Precio máximo regulado (null = sin regulación)
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  max_regulated_price?: string | null

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'int', default: 0 })
  priority: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Channel Price — Precio diferenciado por canal
// =============================================================================

@Entity({ tableName: 'retail_channel_prices' })
export class RetailChannelPriceEntity {
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

  @Enum({ items: () => PricingChannel, type: 'string', length: 15 })
  channel!: PricingChannel

  @Property({ type: 'decimal', precision: 18, scale: 4 })
  price!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  // Costo base para cálculo de margen
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cost?: string | null

  // Margen real calculado (%)
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  actual_margin_percent?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Bulk Price Update — Registro de actualizaciones masivas
// =============================================================================

@Entity({ tableName: 'retail_bulk_price_updates' })
export class RetailBulkPriceUpdateEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Tipo de actualización
  @Property({ type: 'text', length: 30 })
  update_type!: string // 'exchange_rate' | 'percentage' | 'fixed'

  // Parámetros
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  old_exchange_rate?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  new_exchange_rate?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage_change?: string | null

  // Filtros aplicados
  @Property({ type: 'uuid', nullable: true })
  category_id?: string | null

  @Enum({ items: () => PricingChannel, type: 'string', length: 15, nullable: true })
  channel?: PricingChannel | null

  // Resultados
  @Property({ type: 'int', default: 0 })
  products_affected: number = 0

  @Property({ type: 'uuid', nullable: true })
  executed_by?: string | null

  @Property({ type: 'timestamptz' })
  executed_at: Date = new Date()
}

// =============================================================================
// Price Alert — Alertas de precio
// =============================================================================

@Entity({ tableName: 'retail_price_alerts' })
export class RetailPriceAlertEntity {
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

  @Enum({ items: () => PriceAlertType, type: 'string', length: 25 })
  alert_type!: PriceAlertType

  @Enum({ items: () => PriceAlertStatus, type: 'string', length: 15, default: PriceAlertStatus.ACTIVE })
  status: PriceAlertStatus = PriceAlertStatus.ACTIVE

  // Detalles
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  current_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  cost?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  current_margin?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  min_margin_required?: string | null

  @Property({ type: 'text', nullable: true })
  message?: string | null

  @Property({ type: 'uuid', nullable: true })
  acknowledged_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  acknowledged_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
