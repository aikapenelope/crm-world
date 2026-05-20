import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum LoyaltyTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  ADJUST = 'adjust',
  BONUS = 'bonus',
}

export enum LoyaltyReferenceType {
  SALE = 'sale',
  RETURN = 'return',
  MANUAL = 'manual',
  CAMPAIGN = 'campaign',
  EXPIRATION = 'expiration',
}

export enum CampaignType {
  POINTS_MULTIPLIER = 'points_multiplier',
  BONUS_POINTS = 'bonus_points',
  DISCOUNT = 'discount',
  WHATSAPP_BLAST = 'whatsapp_blast',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignTargetSegment {
  ALL = 'all',
  TIER = 'tier',
  INACTIVE = 'inactive',
  BIRTHDAY = 'birthday',
  CUSTOM = 'custom',
}

// =============================================================================
// Loyalty Program — Configuración del programa
// =============================================================================

@Entity({ tableName: 'retail_loyalty_programs' })
export class RetailLoyaltyProgramEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  // Puntos por cada USD gastado
  @Property({ type: 'decimal', precision: 10, scale: 2, default: "'10.00'" })
  points_per_usd: string = '10.00'

  @Property({ type: 'text', length: 10, default: "'USD'" })
  points_currency: string = 'USD'

  // Mínimo para canjear
  @Property({ type: 'int', default: 100 })
  min_redemption_points: number = 100

  // Valor de cada punto en USD
  @Property({ type: 'decimal', precision: 10, scale: 4, default: "'0.0100'" })
  point_value_usd: string = '0.0100'

  // Días para expirar (null = no expiran)
  @Property({ type: 'int', nullable: true })
  expiration_days?: number | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Loyalty Tier — Niveles VIP
// =============================================================================

@Entity({ tableName: 'retail_loyalty_tiers' })
export class RetailLoyaltyTierEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  program_id!: string

  @Property({ type: 'text' })
  name!: string

  // Puntos acumulados lifetime para alcanzar este nivel
  @Property({ type: 'int' })
  min_points_lifetime!: number

  // Descuento automático (%)
  @Property({ type: 'decimal', precision: 5, scale: 2, default: "'0.00'" })
  discount_percent: string = '0.00'

  // Multiplicador de puntos (1.0 = normal, 1.5 = 50% más)
  @Property({ type: 'decimal', precision: 4, scale: 2, default: "'1.00'" })
  multiplier: string = '1.00'

  // Beneficios adicionales
  @Property({ type: 'json', nullable: true })
  benefits?: Record<string, unknown> | null

  @Property({ type: 'int', default: 0 })
  sort_order: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// Loyalty Account — Cuenta de puntos por cliente
// =============================================================================

@Entity({ tableName: 'retail_loyalty_accounts' })
export class RetailLoyaltyAccountEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  customer_id!: string

  @Property({ type: 'uuid' })
  program_id!: string

  @Property({ type: 'int', default: 0 })
  current_points: number = 0

  @Property({ type: 'int', default: 0 })
  lifetime_points: number = 0

  @Property({ type: 'uuid', nullable: true })
  tier_id?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  last_activity_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Loyalty Transaction — Movimientos de puntos
// =============================================================================

@Entity({ tableName: 'retail_loyalty_transactions' })
export class RetailLoyaltyTransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  account_id!: string

  @Enum({ items: () => LoyaltyTransactionType, type: 'string', length: 10 })
  type!: LoyaltyTransactionType

  // Positivo = ganancia, negativo = gasto
  @Property({ type: 'int' })
  points!: number

  @Property({ type: 'int' })
  balance_after!: number

  @Enum({ items: () => LoyaltyReferenceType, type: 'string', length: 15, default: LoyaltyReferenceType.MANUAL })
  reference_type: LoyaltyReferenceType = LoyaltyReferenceType.MANUAL

  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// Campaign — Campañas de marketing
// =============================================================================

@Entity({ tableName: 'retail_campaigns' })
export class RetailCampaignEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Enum({ items: () => CampaignType, type: 'string', length: 20 })
  type!: CampaignType

  @Enum({ items: () => CampaignStatus, type: 'string', length: 15, default: CampaignStatus.DRAFT })
  status: CampaignStatus = CampaignStatus.DRAFT

  @Enum({ items: () => CampaignTargetSegment, type: 'string', length: 15, default: CampaignTargetSegment.ALL })
  target_segment: CampaignTargetSegment = CampaignTargetSegment.ALL

  @Property({ type: 'uuid', nullable: true })
  target_tier_id?: string | null

  @Property({ type: 'int', nullable: true })
  target_days_inactive?: number | null

  // Config: { multiplier, bonus_points, discount_percent, message_template }
  @Property({ type: 'json', nullable: true })
  config?: Record<string, unknown> | null

  @Property({ type: 'timestamptz' })
  starts_at!: Date

  @Property({ type: 'timestamptz', nullable: true })
  ends_at?: Date | null

  @Property({ type: 'int', default: 0 })
  total_recipients: number = 0

  @Property({ type: 'int', default: 0 })
  total_redeemed: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
