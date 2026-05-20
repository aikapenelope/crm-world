import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// Enums
// =============================================================================

export enum InspectionType {
  INTAKE = 'intake',
  DIAGNOSIS = 'diagnosis',
  PROGRESS = 'progress',
  COMPLETION = 'completion',
}

export enum InspectionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SENT_TO_CUSTOMER = 'sent_to_customer',
}

export enum OverallCondition {
  GOOD = 'good',
  FAIR = 'fair',
  NEEDS_ATTENTION = 'needs_attention',
  CRITICAL = 'critical',
}

export enum ItemCondition {
  GOOD = 'good',
  FAIR = 'fair',
  NEEDS_ATTENTION = 'needs_attention',
  CRITICAL = 'critical',
  NOT_INSPECTED = 'not_inspected',
}

export enum SystemCategory {
  BRAKES = 'brakes',
  ENGINE = 'engine',
  SUSPENSION = 'suspension',
  ELECTRICAL = 'electrical',
  TIRES = 'tires',
  FLUIDS = 'fluids',
  BODY = 'body',
  INTERIOR = 'interior',
  EXHAUST = 'exhaust',
  TRANSMISSION = 'transmission',
  COOLING = 'cooling',
  STEERING = 'steering',
  OTHER = 'other',
}

export enum Urgency {
  NONE = 'none',
  SOON = 'soon',
  IMMEDIATE = 'immediate',
}

export enum InspectionPhotoType {
  BEFORE = 'before',
  DURING = 'during',
  AFTER = 'after',
  FINDING = 'finding',
}

// =============================================================================
// Inspection — Inspección digital del vehículo
// =============================================================================

@Entity({ tableName: 'auto_inspections' })
export class AutoInspectionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  service_order_id!: string

  @Property({ type: 'uuid' })
  vehicle_id!: string

  // Tipo de inspección
  @Enum({ items: () => InspectionType, type: 'string', length: 15, default: InspectionType.INTAKE })
  type: InspectionType = InspectionType.INTAKE

  // Quién inspecciona
  @Property({ type: 'uuid', nullable: true })
  inspector_id?: string | null

  // Estado
  @Enum({ items: () => InspectionStatus, type: 'string', length: 20, default: InspectionStatus.IN_PROGRESS })
  status: InspectionStatus = InspectionStatus.IN_PROGRESS

  // Condición general
  @Enum({ items: () => OverallCondition, type: 'string', length: 20, nullable: true })
  overall_condition?: OverallCondition | null

  // Notas generales
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  // Envío al cliente
  @Property({ type: 'timestamptz', nullable: true })
  sent_to_customer_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  customer_viewed_at?: Date | null

  // Timestamps
  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// Inspection Item — Hallazgo por sistema del vehículo
// =============================================================================

@Entity({ tableName: 'auto_inspection_items' })
export class AutoInspectionItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  inspection_id!: string

  // Sistema del vehículo
  @Enum({ items: () => SystemCategory, type: 'string', length: 15 })
  system_category!: SystemCategory

  // Nombre del item inspeccionado
  @Property({ type: 'text', length: 255 })
  item_name!: string

  // Condición encontrada
  @Enum({ items: () => ItemCondition, type: 'string', length: 20, default: ItemCondition.NOT_INSPECTED })
  condition: ItemCondition = ItemCondition.NOT_INSPECTED

  // Notas del técnico
  @Property({ type: 'text', nullable: true })
  notes?: string | null

  // Acción recomendada
  @Property({ type: 'text', nullable: true })
  recommended_action?: string | null

  // Urgencia
  @Enum({ items: () => Urgency, type: 'string', length: 10, default: Urgency.NONE })
  urgency: Urgency = Urgency.NONE

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// Inspection Photo — Foto de la inspección
// =============================================================================

@Entity({ tableName: 'auto_inspection_photos' })
export class AutoInspectionPhotoEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  inspection_id!: string

  // Item asociado (nullable = foto general de la inspección)
  @Property({ type: 'uuid', nullable: true })
  inspection_item_id?: string | null

  // URL de la foto
  @Property({ type: 'text' })
  photo_url!: string

  // Tipo de foto
  @Enum({ items: () => InspectionPhotoType, type: 'string', length: 10, default: InspectionPhotoType.FINDING })
  photo_type: InspectionPhotoType = InspectionPhotoType.FINDING

  // Descripción
  @Property({ type: 'text', length: 255, nullable: true })
  caption?: string | null

  // Anotaciones (círculos, flechas — JSON)
  @Property({ type: 'json', nullable: true })
  annotations_json?: any | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
