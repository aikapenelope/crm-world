import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriFieldPlot — Parcela Agrícola
// =============================================================================

/**
 * Parcela de cultivo para la producción propia de materia prima
 * (maíz, soya, sorgo) destinada a la fabricación de alimento balanceado.
 * Una empresa integrada verticalmente reduce su dependencia de proveedores
 * externos de granos al cultivar parte de sus insumos.
 */
@Entity({ tableName: 'agri_field_plots' })
export class AgriFieldPlotEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'decimal', precision: 10, scale: 4 })
  area_hectares!: string

  @Property({ type: 'text', length: 50, nullable: true })
  soil_type?: string | null

  /** drip | sprinkler | flood | rainfed */
  @Property({ type: 'text', length: 30, nullable: true })
  irrigation_system?: string | null

  @Property({ type: 'text', length: 60, nullable: true })
  location_gps?: string | null

  @Property({ type: 'uuid', nullable: true })
  farm_unit_id?: string | null

  /** active | fallow | maintenance */
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
// AgriCropCycle — Ciclo de Cultivo
// =============================================================================

/**
 * Un ciclo de cultivo es la siembra y cosecha de un cultivo en una parcela.
 * El costo de producción real (cost_per_ton_usd) al final del ciclo se
 * transfiere al módulo de costos como precio de la materia prima propia,
 * reduciendo la dependencia del precio de mercado de los granos.
 */
@Entity({ tableName: 'agri_crop_cycles' })
export class AgriCropCycleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  field_plot_id!: string

  /** maize | soybean | sorghum | sunflower | other */
  @Property({ type: 'text', length: 50 })
  crop_type!: string

  @Property({ type: 'text', length: 100, nullable: true })
  crop_variety?: string | null

  /** Densidad de siembra en semillas/hectárea */
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  planting_density?: string | null

  @Property({ type: 'date' })
  planting_date!: Date

  @Property({ type: 'date', nullable: true })
  expected_harvest_date?: Date | null

  @Property({ type: 'date', nullable: true })
  actual_harvest_date?: Date | null

  /** planned | active | harvested | failed */
  @Property({ type: 'text', length: 20 })
  status: string = 'planned'

  /** Rendimiento esperado en toneladas por hectárea */
  @Property({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  expected_yield_tons_ha?: string | null

  /** Rendimiento real obtenido en toneladas por hectárea */
  @Property({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  actual_yield_tons_ha?: string | null

  /** Toneladas totales cosechadas (actual_yield_tons_ha × area_hectares) */
  @Property({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  actual_yield_tons?: string | null

  /** Costo de producción por tonelada en USD */
  @Property({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost_per_ton_usd?: string | null

  /** own_feed = para alimento propio | sale = para vender | storage = almacenamiento */
  @Property({ type: 'text', length: 20, nullable: true })
  destination?: string | null

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
// AgriCropActivity — Actividad del Ciclo de Cultivo
// =============================================================================

/**
 * Cada labor realizada en el ciclo (preparación de suelo, siembra,
 * fertilización, etc.) genera un registro de actividad con sus costos.
 * La suma de todos los costos al final del ciclo determina el costo real
 * de producción por tonelada cosechada.
 *
 * inputs_used JSON: [{ "name": "Urea 46%", "quantity": 200, "unit": "kg", "cost_usd": 120 }]
 */
@Entity({ tableName: 'agri_crop_activities' })
export class AgriCropActivityEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  crop_cycle_id!: string

  /**
   * land_prep    = preparación de suelo
   * planting     = siembra
   * fertilization = fertilización
   * herbicide    = herbicida
   * pesticide    = plaguicida / fungicida
   * irrigation   = riego
   * harvesting   = cosecha
   * other        = otra labor
   */
  @Property({ type: 'text', length: 30 })
  activity_type!: string

  @Property({ type: 'date' })
  activity_date!: Date

  /** Insumos utilizados: nombre, cantidad, unidad, costo en USD */
  @Property({ type: 'json', nullable: true })
  inputs_used?: object[] | null

  @Property({ type: 'text', length: 255, nullable: true })
  equipment_used?: string | null

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  labor_hours?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  labor_cost_usd?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  inputs_cost_usd?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost_usd?: string | null

  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
