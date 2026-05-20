import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED = 'mixed',
}

export enum UnitType {
  APARTMENT = 'apartment',
  PENTHOUSE = 'penthouse',
  LOCAL = 'local',
  OFFICE = 'office',
  PARKING = 'parking',
  STORAGE = 'storage',
}

export enum UnitStatus {
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent',
}

export enum CommonAreaType {
  SOCIAL = 'social',
  SPORTS = 'sports',
  PARKING = 'parking',
  GARDEN = 'garden',
  OTHER = 'other',
}

// =============================================================================
// CondoBuildingEntity — Edificio/Conjunto residencial
// =============================================================================

@Entity({ tableName: 'condo_buildings' })
export class CondoBuildingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 50 })
  code!: string

  @Enum({ items: () => BuildingType, type: 'string', length: 15 })
  building_type!: BuildingType

  @Property({ type: 'text', nullable: true })
  address?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  city?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  state?: string | null

  @Property({ type: 'int', default: 0 })
  total_units: number = 0

  @Property({ type: 'int', nullable: true })
  total_floors?: number | null

  @Property({ type: 'int', nullable: true })
  year_built?: number | null

  @Property({ type: 'text', length: 20, nullable: true })
  rif?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  admin_company?: string | null

  @Property({ type: 'text', nullable: true })
  document_number?: string | null

  @Property({ type: 'json', nullable: true })
  common_areas?: string[] | null

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// CondoUnitEntity — Unidad (apartamento, local, oficina)
// =============================================================================

@Entity({ tableName: 'condo_units' })
export class CondoUnitEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 20 })
  unit_number!: string

  @Enum({ items: () => UnitType, type: 'string', length: 15 })
  unit_type!: UnitType

  @Property({ type: 'text', length: 10, nullable: true })
  floor?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2?: string | null

  // Alícuota: porcentaje de participación en gastos comunes (Art. 7 LPH)
  // 5 decimales para precisión (ej: 2.34567%)
  @Property({ type: 'decimal', precision: 8, scale: 5, default: "'0.00000'" })
  aliquot_percent: string = '0.00000'

  @Property({ type: 'int', nullable: true })
  bedrooms?: number | null

  @Property({ type: 'int', nullable: true })
  bathrooms?: number | null

  @Property({ type: 'int', default: 0 })
  parking_spots: number = 0

  @Property({ type: 'int', default: 0 })
  storage_units: number = 0

  @Enum({ items: () => UnitStatus, type: 'string', length: 15 })
  status!: UnitStatus

  @Property({ type: 'uuid', nullable: true })
  owner_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  resident_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  owner_name?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  owner_phone?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  owner_email?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  resident_name?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  resident_phone?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// CondoCommonAreaEntity — Áreas comunes reservables
// =============================================================================

@Entity({ tableName: 'condo_common_areas' })
export class CondoCommonAreaEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  building_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Enum({ items: () => CommonAreaType, type: 'string', length: 15 })
  area_type!: CommonAreaType

  @Property({ type: 'int', nullable: true })
  capacity?: number | null

  @Property({ type: 'boolean', default: false })
  is_reservable: boolean = false

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  reservation_fee?: string | null

  @Property({ type: 'text', nullable: true })
  rules?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
