import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// FarmUnit — Finca / Granja / Galpón
// =============================================================================

/**
 * Unidad productiva base. Puede ser una finca completa, una granja
 * o un galpón individual según el nivel de granularidad que maneje
 * la empresa. Las unidades de tipo 'integrated' pertenecen a un
 * productor externo que cría bajo contrato de integración.
 */
@Entity({ tableName: 'agri_farm_units' })
export class AgriFarmUnitEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /**
   * poultry   = avícola (pollos de engorde, ponedoras, pavos)
   * swine     = porcícola
   * bovine    = bovino (carne o leche)
   * agricultural = producción agrícola (maíz, soya, sorgo)
   * mixed     = combinación de especies / cultivos
   */
  @Property({ type: 'text', length: 20 })
  unit_type!: string

  @Property({ type: 'text', length: 500, nullable: true })
  location_address?: string | null

  /** "lat,lng" — coordenadas GPS para mapas */
  @Property({ type: 'text', length: 60, nullable: true })
  location_gps?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  area_value?: string | null

  /** hectares | sqm */
  @Property({ type: 'text', length: 10, nullable: true })
  area_unit?: string | null

  /**
   * own        = galpón propio de la empresa
   * integrated = operado por productor integrado bajo contrato
   */
  @Property({ type: 'text', length: 20 })
  ownership_type: string = 'own'

  /** ID del productor integrado en el módulo customers (cuando ownership_type = 'integrated') */
  @Property({ type: 'uuid', nullable: true })
  owner_producer_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  technical_manager?: string | null

  /** active | inactive | maintenance */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'int', nullable: true })
  capacity_heads?: number | null

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
// Flock — Lote de Producción Animal (principalmente avícola)
// =============================================================================

/**
 * Un flock es el conjunto de animales criados en un mismo galpón
 * durante un ciclo de producción. En avicultura de engorde, cada
 * ciclo dura 42-49 días (Ross 308 / Cobb 500). La entidad conecta
 * la producción primaria con el beneficio y la trazabilidad.
 */
@Entity({ tableName: 'agri_flocks' })
export class AgriFlockEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** LOTE-2026-001 — identificador legible para trazabilidad */
  @Property({ type: 'text', length: 50 })
  flock_number!: string

  @Property({ type: 'uuid' })
  farm_unit_id!: string

  /**
   * broiler = pollo de engorde
   * layer   = gallina ponedora
   * turkey  = pavo
   * swine   = cerdo
   * bovine  = bovino
   */
  @Property({ type: 'text', length: 20 })
  species!: string

  /** Ross 308 | Cobb 500 | Arbor Acres | Topigs Norsvin | etc. */
  @Property({ type: 'text', length: 100, nullable: true })
  genetic_line?: string | null

  @Property({ type: 'date' })
  start_date!: Date

  /** Proveedor de pollitos de un día (FK a customers) */
  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  /** Número de lote del proveedor — para trazabilidad hacia atrás */
  @Property({ type: 'text', length: 100, nullable: true })
  supplier_lot_number?: string | null

  @Property({ type: 'int' })
  initial_count!: number

  /** Peso promedio inicial en gramos */
  @Property({ type: 'int', nullable: true })
  initial_avg_weight_g?: number | null

  /**
   * Umbral de mortalidad diaria (%) que dispara alerta.
   * Default 0.20% para pollos de engorde.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  mortality_threshold_pct: string = '0.20'

  @Property({ type: 'date', nullable: true })
  planned_end_date?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_end_date?: Date | null

  /** active | completed | terminated_early */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

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
// FlockWeeklyRecord — Registro semanal de parámetros productivos
// =============================================================================

/**
 * Cada semana del ciclo se registran los parámetros productivos
 * del lote. Con estos datos el sistema calcula FCA e IEP y proyecta
 * el rendimiento al final del ciclo. La frecuencia es semanal
 * (aunque se puede registrar más frecuente si el usuario lo desea).
 */
/** Índice crítico: todas las queries de KPI (FCA, IEP) filtran por tenant + flock */
@Index({ name: 'idx_agri_weekly_flock', properties: ['tenant_id', 'flock_id'] })
@Entity({ tableName: 'agri_flock_weekly_records' })
export class AgriFlockWeeklyRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  /** Número de semana del ciclo (1 = primera semana) */
  @Property({ type: 'smallint' })
  week_number!: number

  @Property({ type: 'date' })
  record_date!: Date

  /** Aves vivas al final de la semana */
  @Property({ type: 'int' })
  live_count!: number

  /** Muertes registradas durante la semana */
  @Property({ type: 'int' })
  weekly_mortality!: number

  /** Mortalidad acumulada desde el inicio del ciclo */
  @Property({ type: 'int' })
  cumulative_mortality!: number

  /** Peso corporal promedio en gramos (muestra representativa de ≥ 30 aves) */
  @Property({ type: 'int' })
  avg_body_weight_g!: number

  /** Alimento consumido durante la semana en kg */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  weekly_feed_kg!: string

  /** Alimento acumulado desde inicio del ciclo en kg */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  cumulative_feed_kg!: string

  /**
   * FCA acumulado = kg alimento acumulado / kg peso ganado acumulado.
   * Calculado en API, almacenado aquí para histórico y dashboards.
   */
  @Property({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  fca_accumulated?: string | null

  /**
   * IEP = (Peso promedio kg × Viabilidad%) / (FCA × Edad días) × 100
   * Referencia venezolana: IEP > 300 es excelente en pollo de engorde.
   */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  iep?: string | null

  /** Temperatura promedio del galpón en °C */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  house_temp_avg_c?: string | null

  /** Humedad relativa promedio % */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  house_humidity_avg_pct?: string | null

  /** Consumo de agua en litros (indicador sanitario clave) */
  @Property({ type: 'decimal', precision: 10, scale: 1, nullable: true })
  water_consumption_liters?: string | null

  @Property({ type: 'text', nullable: true })
  health_observations?: string | null

  /** UUID del usuario que registró este dato */
  @Property({ type: 'uuid', nullable: true })
  recorded_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
