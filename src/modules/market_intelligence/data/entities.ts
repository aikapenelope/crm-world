import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Saved valuation results.
 * Each valuation is a snapshot of market analysis at a point in time.
 */
@Entity({ tableName: 'market_valuations' })
export class MarketValuationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Query parameters
  @Property({ type: 'text', length: 30 })
  property_type!: string

  @Property({ type: 'text', length: 20 })
  operation!: string

  @Property({ type: 'text', length: 100 })
  city!: string

  @Property({ type: 'text', length: 200, nullable: true })
  zone?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2?: string | null

  @Property({ type: 'smallint', nullable: true })
  bedrooms?: number | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  reference_price?: string | null

  // Results (KPIs)
  @Property({ type: 'int' })
  sample_size!: number

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  avg_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  median_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  min_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  max_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  p25_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  p75_price?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  avg_price_per_m2?: string | null

  // Position of reference price in the market
  @Property({ type: 'text', length: 20, nullable: true })
  price_position?: string | null // 'below_market' | 'at_market' | 'above_market'

  @Property({ type: 'smallint', nullable: true })
  percentile_rank?: number | null // 0-100

  // Comparable IDs (top matches from market_listings)
  @Property({ type: 'jsonb', nullable: true })
  comparable_ids?: string[] | null

  @Property({ type: 'uuid', nullable: true })
  property_id?: string | null // If valuation was for a specific property

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
