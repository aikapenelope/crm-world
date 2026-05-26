import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Market listings from MercadoLibre Venezuela.
 *
 * This is a SHARED table (no tenant_id) because market data is public
 * and serves all tenants in the Real Estate vertical.
 *
 * Synced daily by the mercadolibre-sync worker.
 */
@Entity({ tableName: 'market_listings' })
@Index({ name: 'idx_ml_city_type', properties: ['city', 'property_type'] })
@Index({ name: 'idx_ml_operation_status', properties: ['operation', 'sync_status'] })
@Index({ name: 'idx_ml_price', properties: ['price_usd'] })
export class MarketListingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  // MercadoLibre item ID (for deduplication)
  @Property({ type: 'text', length: 30, unique: true })
  ml_id!: string

  // Listing data
  @Property({ type: 'text', length: 500 })
  title!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', length: 500, nullable: true })
  permalink?: string | null

  @Property({ type: 'text', length: 500, nullable: true })
  thumbnail?: string | null

  // Classification
  @Property({ type: 'text', length: 30 })
  property_type!: string // apartamento, casa, terreno, comercial, oficina

  @Property({ type: 'text', length: 20 })
  operation!: string // venta, alquiler

  @Property({ type: 'text', length: 30, nullable: true })
  category_id?: string | null

  // Pricing
  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  price?: string | null

  @Property({ type: 'text', length: 10, nullable: true })
  price_currency?: string | null

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  price_usd?: string | null

  // Location
  @Property({ type: 'text', length: 100, nullable: true })
  city?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  state?: string | null

  @Property({ type: 'text', length: 200, nullable: true })
  neighborhood?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null

  // Attributes
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2?: string | null

  @Property({ type: 'smallint', nullable: true })
  bedrooms?: number | null

  @Property({ type: 'smallint', nullable: true })
  bathrooms?: number | null

  @Property({ type: 'smallint', nullable: true })
  parking?: number | null

  // Seller info
  @Property({ type: 'text', length: 100, nullable: true })
  seller_nickname?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  seller_id?: string | null

  // Sync metadata
  @Property({ type: 'text', length: 20, default: 'active' })
  sync_status: string = 'active' // active, delisted, error

  @Property({ type: 'timestamptz', nullable: true })
  ml_published_at?: Date | null

  @Property({ type: 'timestamptz' })
  synced_at: Date = new Date()

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
