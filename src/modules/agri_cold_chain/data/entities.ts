import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriColdStorageUnit — Cuarto frío o congelador
// =============================================================================

/**
 * Representa un cuarto frío, congelador o cámara de transporte refrigerado.
 * Cada unidad tiene un rango de temperatura objetivo y puede estar asociada
 * a un sensor IoT que reporta lecturas periódicas.
 *
 * Venezuela: las fallas eléctricas (cortes CANTV/CORPOELEC) son el principal
 * riesgo para la cadena de frío. El campo min_alert_minutes define cuántos
 * minutos fuera de rango se toleran antes de disparar alerta (ej: 15 min
 * para absorber micro-cortes sin saturar notificaciones).
 */
@Entity({ tableName: 'agri_cold_storage_units' })
export class AgriColdStorageUnitEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /**
   * chill_room  = cuarto frío (0-4°C) — canal y productos frescos
   * freezer     = congelador (-18°C o menos) — productos congelados
   * refrigerator = refrigerador (2-8°C) — vacunas y medicamentos
   * reefer_truck = camión refrigerado — transporte
   */
  @Property({ type: 'text', length: 20 })
  unit_type: string = 'chill_room'

  /** Temperatura objetivo mínima (°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1 })
  target_temp_min!: string

  /** Temperatura objetivo máxima (°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1 })
  target_temp_max!: string

  /** Capacidad en toneladas */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  capacity_tons?: string | null

  /** Identificador del sensor IoT (para correlacionar lecturas) */
  @Property({ type: 'text', length: 100, nullable: true })
  sensor_id?: string | null

  /**
   * Minutos consecutivos fuera de rango antes de disparar la alerta.
   * Default: 15 minutos (para absorber micro-cortes eléctricos).
   */
  @Property({ type: 'smallint' })
  min_alert_minutes: number = 15

  /** Responsable de recibir la alerta (UUID en staff o customers) */
  @Property({ type: 'uuid', nullable: true })
  alert_contact_id?: string | null

  /** Número de WhatsApp para alertas inmediatas (formato +58XXXXXXXXXX) */
  @Property({ type: 'text', length: 20, nullable: true })
  alert_phone?: string | null

  /** active | maintenance | offline */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'text', nullable: true })
  location_description?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// AgriTemperatureLog — Registro de lectura de temperatura
// =============================================================================

/**
 * Cada lectura de temperatura del sensor. Los sensores pueden enviar
 * datos en tiempo real o en batch (el endpoint acepta arrays para batch).
 *
 * `is_excursion` se calcula al insertar: true si la temperatura está
 * fuera de [target_temp_min, target_temp_max] del cuarto frío asociado.
 *
 * El worker check-temperature-excursions.ts evalúa si hay excursiones
 * consecutivas por más de min_alert_minutes y dispara alertas.
 */
@Entity({ tableName: 'agri_temperature_logs' })
export class AgriTemperatureLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  cold_storage_unit_id!: string

  /** Temperatura registrada por el sensor (°C) */
  @Property({ type: 'decimal', precision: 6, scale: 2 })
  temperature_c!: string

  /** Humedad relativa (%) si el sensor la reporta */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  humidity_pct?: string | null

  /** Timestamp de la lectura del sensor (puede diferir del created_at si es batch) */
  @Property({ type: 'timestamptz' })
  recorded_at!: Date

  /** true si temp < target_min O temp > target_max en el momento de la lectura */
  @Property({ type: 'boolean', default: false })
  is_excursion: boolean = false

  /** Origen de la lectura: sensor_push | batch_upload | manual */
  @Property({ type: 'text', length: 20 })
  source: string = 'sensor_push'

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// AgriStorageLotRecord — Registro de lote en cuarto frío
// =============================================================================

/**
 * Registra la permanencia de un lote de producto terminado en un cuarto frío.
 * Vincula AgriProcessingLot con AgriColdStorageUnit.
 *
 * Si el lote estuvo fuera de rango durante su permanencia (por una o más
 * excursiones), queda marcado con non_conformity_id apuntando a la
 * no-conformidad creada en agri_quality.
 *
 * Este registro es evidencia para el plan HACCP (BPF de almacenamiento)
 * y para la trazabilidad completa del lote.
 */
@Entity({ tableName: 'agri_storage_lot_records' })
export class AgriStorageLotRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** ID del lote de producto terminado (agri_processing_lots) */
  @Property({ type: 'uuid' })
  processing_lot_id!: string

  @Property({ type: 'uuid' })
  cold_storage_unit_id!: string

  @Property({ type: 'timestamptz' })
  entered_at!: Date

  @Property({ type: 'timestamptz', nullable: true })
  exited_at?: Date | null

  /** Temperatura registrada al ingresar el lote (°C) */
  @Property({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  entry_temp_c?: string | null

  /** Temperatura registrada al retirar el lote (°C) */
  @Property({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  exit_temp_c?: string | null

  /**
   * ID de la no-conformidad creada en agri_quality si hubo excursión
   * de temperatura durante la permanencia de este lote.
   */
  @Property({ type: 'uuid', nullable: true })
  non_conformity_id?: string | null

  /** active | exited | recalled */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
