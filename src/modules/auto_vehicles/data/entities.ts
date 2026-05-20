import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum EngineType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  GAS = 'gas',
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

export enum VehiclePhotoType {
  FRONT = 'front',
  REAR = 'rear',
  LEFT = 'left',
  RIGHT = 'right',
  INTERIOR = 'interior',
  ENGINE = 'engine',
  DAMAGE = 'damage',
  OTHER = 'other',
}

// =============================================================================
// Vehicle — Ficha del vehículo
// =============================================================================

@Entity({ tableName: 'auto_vehicles' })
export class AutoVehicleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // Propietario (referencia al módulo customers)
  @Property({ type: 'uuid' })
  customer_id!: string

  // Identificación del vehículo
  @Property({ type: 'text', length: 15 })
  plate!: string

  @Property({ type: 'text', length: 50 })
  brand!: string

  @Property({ type: 'text', length: 50 })
  model!: string

  @Property({ type: 'smallint' })
  year!: number

  @Property({ type: 'text', length: 30, nullable: true })
  color?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  vin?: string | null

  // Especificaciones
  @Enum({ items: () => EngineType, type: 'string', length: 10, default: EngineType.GASOLINE })
  engine_type: EngineType = EngineType.GASOLINE

  @Enum({ items: () => TransmissionType, type: 'string', length: 10, default: TransmissionType.MANUAL })
  transmission: TransmissionType = TransmissionType.MANUAL

  // Kilometraje actual (se actualiza en cada visita)
  @Property({ type: 'int', default: 0 })
  current_km: number = 0

  // Notas
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// Vehicle Photo — Fotos del vehículo
// =============================================================================

@Entity({ tableName: 'auto_vehicle_photos' })
export class AutoVehiclePhotoEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  vehicle_id!: string

  // URL/path de la foto (almacenada via attachments)
  @Property({ type: 'text' })
  photo_url!: string

  // Tipo de foto
  @Enum({ items: () => VehiclePhotoType, type: 'string', length: 10, default: VehiclePhotoType.OTHER })
  photo_type: VehiclePhotoType = VehiclePhotoType.OTHER

  // Descripción
  @Property({ type: 'text', length: 255, nullable: true })
  caption?: string | null

  // Cuándo se tomó
  @Property({ type: 'timestamptz' })
  taken_at: Date = new Date()

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
