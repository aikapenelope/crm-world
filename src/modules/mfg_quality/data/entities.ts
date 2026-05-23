import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgQualityPlan — Plan de Muestreo e Inspección
// =============================================================================

/**
 * Define QUÉ se inspecciona, CON QUÉ frecuencia, y cuáles son los límites
 * de especificación (LSL/USL) y de control estadístico (LCL/UCL).
 *
 * Terminología:
 *   LSL / USL = Lower/Upper Specification Limit — límite de cliente/estándar
 *   LCL / UCL = Lower/Upper Control Limit — límite estadístico (X̄ ± 3σ)
 *   target     = valor nominal ideal
 *
 * Cuando is_critical_control_point = true, una lectura fuera de especificación
 * genera automáticamente una No-Conformidad con severidad 'critical' y
 * activa el workflow nc_disposition_v1 sin intervención manual.
 *
 * Aplica para manufactura de alimentos (HACCP), farmacéutica (BPF) y
 * cualquier proceso con características críticas de calidad.
 */
@Entity({ tableName: 'mfg_quality_plans' })
export class MfgQualityPlanEntity {
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

  /**
   * receiving      = recepción de materia prima
   * in_process     = durante el proceso productivo
   * finished       = producto terminado antes de despacho
   * shipping       = verificación en carga/despacho
   */
  @Property({ type: 'text', length: 30 })
  control_point: string = 'in_process'

  /** Parámetro a medir: Humedad, pH, Temperatura, Peso neto, Longitud, etc. */
  @Property({ type: 'text', length: 255 })
  parameter_name!: string

  /** Unidad de medida del parámetro: %, °C, g, mm, pH */
  @Property({ type: 'text', length: 30 })
  parameter_unit!: string

  /** Instrumento de medición: Higrómetro, pHmetro, Báscula de precisión, Vernier */
  @Property({ type: 'text', length: 100, nullable: true })
  instrument?: string | null

  /** Lower Specification Limit — límite inferior de especificación del producto */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  lsl?: string | null

  /** Upper Specification Limit — límite superior de especificación */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  usl?: string | null

  /** Lower Control Limit — calculado estadísticamente (X̄ - 3σ) */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  lcl?: string | null

  /** Upper Control Limit — calculado estadísticamente (X̄ + 3σ) */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  ucl?: string | null

  /** Valor nominal ideal del parámetro */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  target?: string | null

  /** Frecuencia de muestreo: "cada 2 horas", "cada 500 unidades", "cada lote" */
  @Property({ type: 'text', length: 50 })
  sampling_frequency: string = 'per_batch'

  /** Tamaño del subgrupo para SPC (n) — típicamente 4 o 5 */
  @Property({ type: 'int' })
  sample_size: number = 5

  /**
   * true = este es un Punto Crítico de Control (PCC) en el plan HACCP.
   * Una desviación genera NC automática con severidad 'critical'.
   */
  @Property({ type: 'boolean', default: false })
  is_critical_control_point: boolean = false

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

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
// MfgQualityInspection — Resultado de Inspección Individual
// =============================================================================

/**
 * Cada medición individual tomada durante el proceso de calidad.
 * Múltiples MfgQualityInspection con el mismo subgroup_id forman
 * el subgrupo para cálculo del X̄ y R en cartas de control SPC.
 *
 * is_in_spec: la medición está dentro de LSL y USL (especificación del producto)
 * is_in_control: la medición está dentro de LCL y UCL (proceso estadísticamente bajo control)
 *
 * Un proceso puede estar en control estadístico pero producir fuera de especificación
 * (proceso bien centrado pero con variabilidad excesiva), o estar dentro de especificación
 * pero fuera de control (señal de causa asignable que si no se corrige saldrá de spec).
 */
@Entity({ tableName: 'mfg_quality_inspections' })
export class MfgQualityInspectionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  plan_id!: string

  @Property({ type: 'uuid', nullable: true })
  lot_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  order_id?: string | null

  /** Número de muestra dentro del subgrupo (1, 2, 3, 4, 5) */
  @Property({ type: 'int' })
  sample_number: number = 1

  /** Identificador del subgrupo al que pertenece esta muestra (para cálculos SPC) */
  @Property({ type: 'text', length: 50, nullable: true })
  subgroup_id?: string | null

  @Property({ type: 'decimal', precision: 14, scale: 6 })
  measured_value!: string

  /** true = valor entre LSL y USL (dentro de especificación del producto) */
  @Property({ type: 'boolean', default: true })
  is_in_spec: boolean = true

  /** true = valor entre LCL y UCL (proceso estadísticamente estable) */
  @Property({ type: 'boolean', default: true })
  is_in_control: boolean = true

  @Property({ type: 'uuid', nullable: true })
  inspector_id?: string | null

  @Property({ type: 'timestamptz' })
  inspection_timestamp: Date = new Date()

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

// =============================================================================
// MfgNonconformanceEntity — No-Conformidad
// =============================================================================

/**
 * Registro formal de una desviación de los estándares de calidad.
 * Puede originarse en:
 *   receiving      = inspección de recepción de MP/empaque
 *   in_process     = detección durante el proceso productivo
 *   finished_goods = en inspección de producto terminado
 *   customer_return = reclamo o devolución del cliente
 *   audit          = auditoría interna o externa
 *
 * El ciclo de vida es:
 *   open → under_review → pending_disposition → resolved → closed
 *
 * Al cerrar, se documenta:
 *   - root_cause = causa raíz identificada (por qué pasó)
 *   - disposition = qué hacer con el material afectado
 *   - corrective_action = para corregir el problema actual
 *   - preventive_action = para evitar recurrencia
 *
 * Para manufactura de alimentos, la disposición 'use_as_is' requiere
 * documentación obligatoria de la desviación aprobada.
 *
 * cost_nc_usd permite calcular el costo real de la no calidad y
 * justificar inversiones en prevención.
 */
@Entity({ tableName: 'mfg_nonconformances' })
export class MfgNonconformanceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** NC-2026-001 — número secuencial único */
  @Property({ type: 'text', length: 50 })
  nc_number!: string

  @Property({ type: 'text', length: 30 })
  source!: string

  @Property({ type: 'uuid', nullable: true })
  lot_id?: string | null

  @Property({ type: 'text', length: 50, nullable: true })
  lot_number?: string | null

  @Property({ type: 'uuid', nullable: true })
  order_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  product_id?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  product_code?: string | null

  /** Inspección de calidad que detectó y generó esta NC */
  @Property({ type: 'uuid', nullable: true })
  inspection_id?: string | null

  @Property({ type: 'text' })
  description!: string

  /** critical = riesgo de inocuidad/seguridad, major = incumple spec, minor = cosmético */
  @Property({ type: 'text', length: 20 })
  severity: string = 'major'

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  quantity_affected?: string | null

  @Property({ type: 'text', length: 20, nullable: true })
  uom?: string | null

  /**
   * open              = recién creada, asignada a responsable
   * under_review      = en investigación de causa raíz
   * pending_disposition = causa identificada, esperando decisión de disposición
   * resolved          = disposición ejecutada, acciones correctivas en marcha
   * closed            = todas las acciones completadas, NC archivada
   */
  @Property({ type: 'text', length: 25 })
  status: string = 'open'

  @Property({ type: 'text', nullable: true })
  root_cause?: string | null

  /**
   * rework            = retrabajo / reproceso
   * scrap             = destrucción / baja
   * use_as_is         = uso condicionado con desviación documentada
   * return_to_supplier = devolución al proveedor (para MP rechazada)
   * downgrade         = reclasificación a calidad inferior
   */
  @Property({ type: 'text', length: 30, nullable: true })
  disposition?: string | null

  @Property({ type: 'text', nullable: true })
  corrective_action?: string | null

  @Property({ type: 'text', nullable: true })
  preventive_action?: string | null

  /** Costo real de esta NC: material perdido + mano de obra de reproceso + lucro cesante */
  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost_nc_usd?: string | null

  @Property({ type: 'uuid', nullable: true })
  opened_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  closed_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  closed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgSpcChart — Datos para Carta de Control SPC
// =============================================================================

/**
 * Datos agregados por subgrupo para la carta de control X̄-R (o X̄-S).
 * Se calculan automáticamente cuando se completa un subgrupo de inspecciones.
 *
 * X̄-R: media y rango del subgrupo — para subgrupos n ≤ 9
 * X̄-S: media y desviación estándar — para subgrupos n > 9
 *
 * is_out_of_control = true cuando se viola alguna de las reglas Western Electric:
 *   Regla 1: 1 punto fuera de ±3σ
 *   Regla 2: 2 de 3 puntos consecutivos fuera de ±2σ (mismo lado)
 *   Regla 3: 4 de 5 puntos consecutivos fuera de ±1σ (mismo lado)
 *   Regla 4: 8 puntos consecutivos del mismo lado de la línea central
 *
 * Cuando is_out_of_control = true, el sistema emite alerta para que el
 * operador identifique y elimine la causa asignable antes de continuar producción.
 */
@Entity({ tableName: 'mfg_spc_charts' })
export class MfgSpcChartEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  plan_id!: string

  @Property({ type: 'text', length: 50 })
  subgroup_id!: string

  @Property({ type: 'date' })
  subgroup_date!: Date

  @Property({ type: 'int' })
  sample_count!: number

  /** X̄ — media del subgrupo */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  subgroup_mean!: string

  /** R — rango del subgrupo (máximo - mínimo) */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  subgroup_range!: string

  /** S — desviación estándar del subgrupo (para n > 9) */
  @Property({ type: 'decimal', precision: 14, scale: 6, nullable: true })
  subgroup_std?: string | null

  /** true = se violó al menos una regla de Western Electric en este subgrupo */
  @Property({ type: 'boolean', default: false })
  is_out_of_control: boolean = false

  /** Descripción de la regla violada si is_out_of_control = true */
  @Property({ type: 'text', length: 100, nullable: true })
  rule_violated?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
