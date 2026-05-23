import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgCostCenter — Centro de Costo
// =============================================================================

/**
 * Unidad de agrupación de costos (línea, departamento, actividad).
 * Todos los gastos de manufactura se asignan a un centro de costo
 * para el análisis por responsabilidad y el costeo por absorción.
 */
@Entity({ tableName: 'mfg_cost_centers' })
export class MfgCostCenterEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 30 })
  code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** production = línea de producción · support = soporte industrial · admin = administración */
  @Property({ type: 'text', length: 20 })
  type: string = 'production'

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
// MfgStandardCost — Costo Estándar del Producto
// =============================================================================

/**
 * El costo que DEBERÍA costar producir 1 unidad del producto bajo condiciones
 * normales de eficiencia y con los precios de insumos vigentes al momento de
 * establecer el estándar.
 *
 * Bimoneda venezolana:
 *   - raw_material_cost_usd: MP importada al tipo de cambio BCV del día
 *   - local_material_cost_usd: MP nacional convertida a USD al BCV
 *   - labor_cost_usd: mano de obra (salario Bs × recargos LOTTT) convertida a USD
 *   - overhead_cost_usd: costos indirectos asignados (energía, mantenimiento, etc.)
 *   - bcv_rate_used: tipo de cambio BCV usado para las conversiones
 *
 * El estándar se revisa periódicamente (mínimo trimestralmente) porque:
 *   1. El BCV cambia (devalúa los costos en Bs al expresarlos en USD)
 *   2. Los precios de MP importada cambian con cada importación
 *   3. Los salarios se ajustan frecuentemente (decretos LOTTT, convenciones)
 *
 * Cada producto tiene un estándar activo y múltiples archivados para comparar
 * cómo ha evolucionado la estructura de costo a lo largo del tiempo.
 */
@Entity({ tableName: 'mfg_standard_costs' })
export class MfgStandardCostEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  /** Unidad de medida a la que aplica el costo (ej: 1 kg, 1 unidad, 1 litro) */
  @Property({ type: 'text', length: 20 })
  uom!: string

  @Property({ type: 'date' })
  valid_from!: Date

  @Property({ type: 'date', nullable: true })
  valid_until?: Date | null

  /** draft | active | superseded */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  /** Costo de MP importada por unidad (en USD) */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  raw_material_cost_usd: string = '0.000000'

  /** Costo de MP/empaque nacional por unidad (convertido a USD al BCV) */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  local_material_cost_usd: string = '0.000000'

  /**
   * Costo de mano de obra directa por unidad.
   * Calculado como: tiempo_estándar_hrs × tarifa_MO_USD
   * La tarifa_MO_USD = (salario_Bs + cargas_LOTTT_Bs) / BCV
   */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  labor_cost_usd: string = '0.000000'

  /** Costos indirectos asignados por absorción (energía, mant., depreciación) */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  overhead_cost_usd: string = '0.000000'

  /** Total = raw + local + labor + overhead */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  total_standard_cost_usd: string = '0.000000'

  /** Tasa BCV usada para convertir costos Bs → USD al establecer este estándar */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  bcv_rate_used?: string | null

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
// MfgCostVariance — Variaciones de Costo al Cierre de Orden
// =============================================================================

/**
 * Al cerrar una orden de producción, el sistema calcula las variaciones
 * comparando el costo estándar contra el costo real.
 *
 * Las TRES variaciones son el diagnóstico de la gestión de producción:
 *
 * 1. VARIACIÓN DE PRECIO (price_variance_usd):
 *    ¿Pagué la materia prima más caro que el estándar?
 *    = (precio_real_USD - precio_estándar_USD) × cantidad_real
 *    Positivo = DESFAVORABLE (pagué más caro)
 *    Causa típica VE: importación urgente con flete express, nueva cotización
 *
 * 2. VARIACIÓN DE CANTIDAD (quantity_variance_usd):
 *    ¿Usé más materia prima de lo que especifica el BOM?
 *    = (cantidad_real - cantidad_estándar) × precio_estándar_USD
 *    Positivo = DESFAVORABLE (desperdicié más)
 *    Causa típica: mala calibración de maquinaria, MP de menor calidad
 *
 * 3. VARIACIÓN DE MANO DE OBRA (labor_variance_usd):
 *    ¿El proceso tardó más que el tiempo estándar?
 *    = (horas_reales - horas_estándar) × tarifa_MO_USD
 *    Positivo = DESFAVORABLE (tardé más)
 *    Causa típica VE: cortes eléctricos (fuerza mayor), operario entrenamiento
 *
 * Negativo siempre = FAVORABLE (ahorré vs. el estándar).
 *
 * bcv_rate_used: el tipo de cambio BCV del día del cierre de la orden.
 * Permite explicar si una variación de precio viene de cambio de tasa BCV
 * o de un precio real de MP más alto.
 */
@Entity({ tableName: 'mfg_cost_variances' })
export class MfgCostVarianceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  order_id!: string

  @Property({ type: 'text', length: 50 })
  order_number!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_quantity!: string

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  actual_quantity: string = '0.0000'

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Costo total según el estándar × cantidad real producida */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  standard_cost_usd: string = '0.0000'

  /** Costo total real (MP issues + horas MO × tarifa) */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  actual_cost_usd: string = '0.0000'

  /** actual_cost - standard_cost. Negativo = favorable */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  total_variance_usd: string = '0.0000'

  /** Variación por diferencia de precio de MP */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  price_variance_usd: string = '0.0000'

  /** Variación por diferencia de cantidad de MP consumida */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  quantity_variance_usd: string = '0.0000'

  /** Variación por diferencia en horas de mano de obra */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  labor_variance_usd: string = '0.0000'

  /**
   * pending    = orden completada, variación no calculada aún
   * calculated = variaciones calculadas, en revisión del controller
   * approved   = aprobadas y contabilizadas
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  @Property({ type: 'timestamptz', nullable: true })
  calculated_at?: Date | null

  /** Tasa BCV del día del cierre — para auditoría de la conversión bimoneda */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  bcv_rate_used?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
