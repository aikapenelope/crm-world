import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum PropertyType {
  APARTAMENTO = 'apartamento',
  CASA = 'casa',
  TERRENO = 'terreno',
  COMERCIAL = 'comercial',
  OFICINA = 'oficina',
  GALPON = 'galpon',
  OTRO = 'otro',
}

export enum PropertyOperation {
  VENTA = 'venta',
  ALQUILER = 'alquiler',
  VENTA_ALQUILER = 'venta_alquiler',
}

export enum PropertyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RESERVED = 'reserved',
  SOLD = 'sold',
  RENTED = 'rented',
  INACTIVE = 'inactive',
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

@Entity({ tableName: 'properties' })
export class PropertyEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  title!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Enum({ items: () => PropertyType, type: 'string', length: 30 })
  property_type!: PropertyType

  @Enum({ items: () => PropertyOperation, type: 'string', length: 20 })
  operation!: PropertyOperation

  @Enum({ items: () => PropertyStatus, type: 'string', length: 20, default: PropertyStatus.DRAFT })
  status: PropertyStatus = PropertyStatus.DRAFT

  @Property({ type: 'decimal', precision: 18, scale: 2 })
  price!: string

  @Property({ type: 'text', length: 10, default: 'USD' })
  currency: string = 'USD'

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2?: string | null

  @Property({ type: 'smallint', nullable: true })
  bedrooms?: number | null

  @Property({ type: 'smallint', nullable: true })
  bathrooms?: number | null

  @Property({ type: 'smallint', nullable: true })
  parking?: number | null

  @Property({ type: 'text', length: 500, nullable: true })
  address_line?: string | null

  @Property({ type: 'text', length: 100 })
  city!: string

  @Property({ type: 'text', length: 100, nullable: true })
  state?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  zip?: string | null

  @Property({ type: 'text', length: 5, default: 'VE' })
  country: string = 'VE'

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 2, default: '5.00' })
  commission_rate: string = '5.00'

  @Property({ type: 'uuid', nullable: true })
  contact_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  assigned_to?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// ---------------------------------------------------------------------------
// Property Images
// ---------------------------------------------------------------------------

@Entity({ tableName: 'property_images' })
export class PropertyImageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  property_id!: string

  @Property({ type: 'uuid' })
  attachment_id!: string

  @Property({ type: 'smallint', default: 0 })
  sort_order: number = 0

  @Property({ type: 'boolean', default: false })
  is_cover: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// ---------------------------------------------------------------------------
// Property Links
// ---------------------------------------------------------------------------

@Entity({ tableName: 'property_links' })
export class PropertyLinkEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  property_id!: string

  @Property({ type: 'text', length: 30 })
  platform!: string

  @Property({ type: 'text', length: 500 })
  url!: string

  @Property({ type: 'text', length: 100, nullable: true })
  label?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
