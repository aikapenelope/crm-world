import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgEnergyConsumption — Consumo de Energía por Turno / Línea
// =============================================================================

/**
 * Registro de consumo eléctrico por centro de trabajo y turno.
 * Permite calcular el costo energético por unidad producida y por orden.
 *
 * Particularidad venezolana crítica:
 *   energy_source = 'generator' indica que la empresa usó su propio generador
 *   durante ese período. El costo de generación propia puede ser 5-10x más caro
 *   que la tarifa de la red (CORPOELEC).
 *
 * Esto permite al sistema separar:
 *   - Costo energético "normal" (tarifa CORPOELEC)
 *   - Costo energético "emergencia" (generador)
 *   Y calcular el sobrecosto total de la generación propia en el período,
 *   lo cual justifica inversiones en paneles solares o mejoras a la red.
 */
@Entity({ tableName: 'mfg_energy_consumption' })
export class MfgEnergyConsumptionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 30 })
  work_center_code!: string

  @Property({ type: 'text', length: 255 })
  work_center_name!: string

  /** Orden de producción que consumió esta energía (null si es registro general) */
  @Property({ type: 'uuid', nullable: true })
  production_order_id?: string | null

  @Property({ type: 'date' })
  record_date!: Date

  /** morning | afternoon | night */
  @Property({ type: 'text', length: 15 })
  shift_type!: string

  /** Kilowatts-hora realmente consumidos (medidor o estimación) */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  kwh_consumed!: string

  /** kWh planificados según consumo estándar por unidad × producción */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  kwh_planned?: string | null

  /** Horas de producción en este registro */
  @Property({ type: 'decimal', precision: 6, scale: 2 })
  duration_hrs: string = '8.00'

  /** Tarifa eléctrica (USD/kWh) — CORPOELEC o generador */
  @Property({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  cost_per_kwh_usd?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  total_energy_cost_usd?: string | null

  /**
   * grid      = red eléctrica CORPOELEC (tarifa normal)
   * generator = planta eléctrica propia (5-10x más caro)
   * mixed     = parte de la red, parte generador
   */
  @Property({ type: 'text', length: 20 })
  energy_source: string = 'grid'

  /** Horas operando en generador durante este registro */
  @Property({ type: 'decimal', precision: 6, scale: 2 })
  generator_hrs: string = '0.00'

  /** Costo de combustible del generador durante este período */
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  generator_fuel_cost_usd?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// MfgPowerOutage — Registro de Cortes Eléctricos
// =============================================================================

/**
 * Registro detallado de cada interrupción del servicio eléctrico.
 * Alimenta el cálculo del OEE (ya en mfg_floor) y el análisis de
 * impacto económico total de CORPOELEC en la operación.
 *
 * Tipos de corte:
 *   scheduled_restriction = corte planificado por CORPOELEC (avisos previos)
 *   unscheduled_cut       = corte no planificado (el más dañino)
 *   voltage_fluctuation   = fluctuación que dañó equipos o requirió parada
 *   complete_blackout     = apagón total de la zona
 *
 * El campo used_generator = true indica que la empresa activó su planta
 * eléctrica propia para continuar o detener de forma segura.
 * fuel_cost_usd captura el costo real del combustible en ese corte.
 *
 * El dashboard acumula mensualmente:
 *   - Horas totales de cortes
 *   - Costo de producción perdida por cada hora de paro
 *   - Costo de combustible en generadores
 *   - "Costo CORPOELEC" total para la empresa
 *
 * Este número, comparado con una alternativa (panel solar, contrato de
 * generación, UPS industrial), justifica decisiones de inversión.
 */
@Entity({ tableName: 'mfg_power_outages' })
export class MfgPowerOutageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'timestamptz' })
  started_at!: Date

  @Property({ type: 'timestamptz', nullable: true })
  ended_at?: Date | null

  /** Calculado al registrar fin: (ended_at - started_at) en horas */
  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  duration_hrs?: string | null

  @Property({ type: 'text', length: 30 })
  outage_type: string = 'unscheduled_cut'

  /** Zona CORPOELEC afectada */
  @Property({ type: 'text', length: 100, nullable: true })
  zone?: string | null

  @Property({ type: 'uuid', nullable: true })
  reported_by?: string | null

  /** Horas de producción estimadas perdidas durante este corte */
  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  impact_production_hrs_lost?: string | null

  /** Líneas o productos afectados (texto libre) */
  @Property({ type: 'text', nullable: true })
  products_affected?: string | null

  /** true si se activó el generador propio durante este corte */
  @Property({ type: 'boolean', default: false })
  used_generator: boolean = false

  /** Litros de combustible consumidos en el generador por este corte */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  generator_fuel_liters?: string | null

  /** Costo de ese combustible en USD */
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fuel_cost_usd?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgEnergyCost — Costo Energético por Orden de Producción
// =============================================================================

/**
 * Resumen del costo energético asignado a una orden de producción.
 * Se calcula al cierre de la orden como parte del costeo completo.
 *
 * Para órdenes donde se usó generador durante una parte de la producción,
 * generator_premium_usd muestra el sobrecosto adicional vs. si hubiera
 * habido suministro normal de red todo el tiempo.
 *
 * Ejemplo:
 *   Orden PO-001: produjo 1,000 kg en 8h.
 *   - 6h en red: 200 kWh × $0.08 = $16
 *   - 2h en generador: 80 kWh × $0.45 = $36
 *   - Total: $52. Si hubiera sido red todo: $0.08 × 280 = $22.40
 *   - generator_premium_usd = $52 - $22.40 = $29.60
 *   - energy_cost_per_unit_usd = $52 / 1,000 = $0.052/kg
 */
@Entity({ tableName: 'mfg_energy_costs' })
export class MfgEnergyCostEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  production_order_id!: string

  @Property({ type: 'text', length: 50 })
  order_number!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  actual_quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  total_kwh: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  grid_kwh: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  generator_kwh: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  total_energy_cost_usd: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 8 })
  energy_cost_per_unit_usd: string = '0.00000000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  grid_cost_usd: string = '0.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  generator_cost_usd: string = '0.0000'

  /** Sobrecosto vs. si hubiera sido red eléctrica todo el tiempo */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  generator_premium_usd: string = '0.0000'

  @Property({ type: 'date' })
  period_start!: Date

  @Property({ type: 'date' })
  period_end!: Date

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
