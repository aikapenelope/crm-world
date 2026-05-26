import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum OnlineOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum OrderSource {
  WEB = 'web',
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
}

export enum PublishPlatform {
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
}

export enum PublishStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PUBLISHED = 'published',
}

// =============================================================================
// Storefront — Configuración de tienda online
// =============================================================================

@Entity({ tableName: 'retail_storefronts' })
export class RetailStorefrontEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'text', length: 50 })
  slug!: string

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  // { show_prices, allow_guest_checkout, min_order_usd }
  @Property({ type: 'json', nullable: true })
  config?: Record<string, unknown> | null

  // { logo_url, primary_color, banner_url }
  @Property({ type: 'json', nullable: true })
  branding?: Record<string, unknown> | null

  // Métodos de pago habilitados
  @Property({ type: 'json', nullable: true })
  payment_methods?: string[] | null

  // Zonas de delivery con tarifas
  @Property({ type: 'json', nullable: true })
  delivery_zones?: Record<string, unknown>[] | null

  // { instagram, whatsapp, tiktok }
  @Property({ type: 'json', nullable: true })
  social_links?: Record<string, string> | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Online Order — Pedido online
// =============================================================================

@Entity({ tableName: 'retail_online_orders' })
export class RetailOnlineOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  order_number!: string

  @Property({ type: 'uuid', nullable: true })
  sales_order_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  customer_id?: string | null

  @Property({ type: 'text', nullable: true })
  guest_name?: string | null

  @Property({ type: 'text', nullable: true })
  guest_phone?: string | null

  @Property({ type: 'text', nullable: true })
  guest_email?: string | null

  @Enum({ items: () => OnlineOrderStatus, type: 'string', length: 15, default: OnlineOrderStatus.PENDING })
  status: OnlineOrderStatus = OnlineOrderStatus.PENDING

  @Enum({ items: () => DeliveryType, type: 'string', length: 10, default: DeliveryType.DELIVERY })
  delivery_type: DeliveryType = DeliveryType.DELIVERY

  // { line1, line2, city, state, reference }
  @Property({ type: 'json', nullable: true })
  delivery_address?: Record<string, string> | null

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  delivery_fee: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  subtotal!: string

  @Property({ type: 'decimal', precision: 18, scale: 2, default: '0.00' })
  tax_amount: string = '0.00'

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'text', nullable: true })
  payment_method?: string | null

  @Property({ type: 'text', nullable: true })
  payment_reference?: string | null

  @Enum({ items: () => PaymentStatus, type: 'string', length: 10, default: PaymentStatus.PENDING })
  payment_status: PaymentStatus = PaymentStatus.PENDING

  @Property({ type: 'timestamptz', nullable: true })
  estimated_delivery_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  delivered_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Enum({ items: () => OrderSource, type: 'string', length: 10, default: OrderSource.WEB })
  source: OrderSource = OrderSource.WEB

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Online Order Line — Líneas del pedido
// =============================================================================

@Entity({ tableName: 'retail_online_order_lines' })
export class RetailOnlineOrderLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'uuid' })
  order_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'uuid', nullable: true })
  variant_id?: string | null

  @Property({ type: 'text' })
  product_title!: string

  @Property({ type: 'int' })
  quantity!: number

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  unit_price!: string

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  total!: string
}

// =============================================================================
// Social Publish — Publicaciones en redes
// =============================================================================

@Entity({ tableName: 'retail_social_publishes' })
export class RetailSocialPublishEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Enum({ items: () => PublishPlatform, type: 'string', length: 15 })
  platform!: PublishPlatform

  @Property({ type: 'text' })
  content!: string

  @Property({ type: 'text', nullable: true })
  hashtags?: string | null

  @Property({ type: 'json', nullable: true })
  image_urls?: string[] | null

  @Property({ type: 'timestamptz', nullable: true })
  published_at?: Date | null

  @Enum({ items: () => PublishStatus, type: 'string', length: 10, default: PublishStatus.DRAFT })
  status: PublishStatus = PublishStatus.DRAFT

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
