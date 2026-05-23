import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgMasterSchedule — Plan Maestro de Producción (MPS)
// =============================================================================

/**
 * Define QUÉ producir, EN QUÉ línea, EN QUÉ semana y EN QUÉ cantidad.
 *
 * El MPS es el puente entre la demanda (pedidos + proyecciones) y las
 * órdenes de producción. Permite al planificador:
 *   1. Ver la semana completa de producción en un solo cuadro
 *   2. Detectar sobrecargas (más demanda que capacidad) antes de liberar órdenes
 *   3. Reordenar prioridades según urgencia o fecha de entrega
 *   4. Considerar las ventanas de energía eléctrica disponible por zona
 *
 * Cuando el MPS se confirma, se puede convertir en una ProductionOrder
 * con un solo clic (production_order_id se llena automáticamente).
 *
 * El campo priority (1-100) permite al scheduler manual reordenar
 * items en la misma línea y semana cuando hay conflictos de capacidad.
 */
@Entity({ tableName: 'mfg_master_schedule' })
export class MfgMasterScheduleEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** MPS-2026-W23 — identificador del ítem en el plan semanal */
  @Property({ type: 'text', length: 50 })
  schedule_number!: string

  /** Lunes de la semana planificada */
  @Property({ type: 'date' })
  week_start!: Date

  /** Domingo de la semana planificada */
  @Property({ type: 'date' })
  week_end!: Date

  @Property({ type: 'uuid' })
  product_id!: string

  @Property({ type: 'text', length: 100 })
  product_code!: string

  @Property({ type: 'text', length: 255 })
  product_name!: string

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  planned_quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  /** Timestamp de inicio planificado dentro de la semana */
  @Property({ type: 'timestamptz', nullable: true })
  planned_start?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  planned_end?: Date | null

  /**
   * planned   = en plan, no confirmado
   * confirmed = aprobado por el planificador, listo para convertir a OP
   * in_progress = ya se generó la OP y está en ejecución
   * completed = OP cerrada
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'planned'

  /** FK a la orden de producción generada desde este ítem MPS */
  @Property({ type: 'uuid', nullable: true })
  production_order_id?: string | null

  /** Prioridad 1-100. Mayor número = mayor prioridad. Default 50. */
  @Property({ type: 'int' })
  priority: number = 50

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
// MfgCapacityLoad — Carga de capacidad por centro de trabajo y semana
// =============================================================================

/**
 * Resume la carga planificada vs. disponible por centro de trabajo por semana.
 * Se recalcula automáticamente cada vez que se agrega o modifica un ítem MPS.
 *
 * overload_pct > 0: la línea está sobrecargada esta semana.
 *   Acción: mover algunos ítems a otra semana o línea, o agregar turno extra.
 *
 * overload_pct negativo grande: capacidad ociosa.
 *   Acción: oportunidad para producir stock de seguridad o avanzar órdenes futuras.
 *
 * El planificador ve este cuadro ANTES de confirmar el MPS para asegurarse
 * de que no está prometiendo entregas imposibles de cumplir.
 */
@Entity({ tableName: 'mfg_capacity_loads' })
export class MfgCapacityLoadEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  work_center_id!: string

  @Property({ type: 'text', length: 30 })
  work_center_code!: string

  @Property({ type: 'text', length: 255 })
  work_center_name!: string

  @Property({ type: 'date' })
  week_start!: Date

  /** Horas disponibles en la semana = capacidad_turno × eficiencia × 5 días */
  @Property({ type: 'decimal', precision: 8, scale: 4 })
  available_hrs!: string

  /** Horas planificadas en el MPS para esta semana */
  @Property({ type: 'decimal', precision: 8, scale: 4 })
  loaded_hrs: string = '0.0000'

  /** (loaded_hrs / available_hrs × 100) */
  @Property({ type: 'decimal', precision: 6, scale: 2 })
  utilization_pct: string = '0.00'

  /** true si loaded_hrs > available_hrs */
  @Property({ type: 'boolean', default: false })
  overloaded: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgEnergyWindow — Ventana de suministro eléctrico por zona
// =============================================================================

/**
 * Captura el patrón histórico de disponibilidad eléctrica por zona y horario.
 * Permite al planificador MPS alinear las operaciones de alta potencia
 * con las ventanas de mayor confiabilidad eléctrica.
 *
 * En Venezuela, muchas zonas industriales tienen cortes predecibles:
 * - Algunos municipios cortan los lunes de 8-12am
 * - Algunas zonas tienen restricciones rotativas por día de la semana
 * - Las horas de menor demanda (madrugada) suelen tener menos cortes
 *
 * La estrategia de planificación energética en manufactura venezolana:
 *   1. Registrar el patrón de cortes observados como EnergyWindow
 *   2. Al planificar el MPS, evitar programar operaciones de alta potencia
 *      en ventanas de tipo 'restriction' o 'unstable'
 *   3. Concentrar las operaciones críticas en ventanas 'reliable'
 *
 * El MPS muestra un heatmap semanal con las ventanas para que el planificador
 * tome decisiones visualmente.
 */
@Entity({ tableName: 'mfg_energy_windows' })
export class MfgEnergyWindowEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** Zona CORPOELEC o municipio: "Zona Industrial Tejerías", "Barquisimeto Norte" */
  @Property({ type: 'text', length: 100 })
  zone!: string

  /** 0=Lunes, 1=Martes, ..., 6=Domingo */
  @Property({ type: 'smallint' })
  day_of_week!: number

  @Property({ type: 'smallint' })
  hour_start!: number

  @Property({ type: 'smallint' })
  hour_end!: number

  /**
   * restriction = corte planificado o muy probable (basado en histórico)
   * reliable    = suministro confiable históricamente en este horario
   * unstable    = suministro inestable, cortes ocasionales
   */
  @Property({ type: 'text', length: 20 })
  restriction_type: string = 'restriction'

  /** % de veces que se cumplió el patrón histórico (0-100) */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  reliability_pct: string = '80.00'

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'date', nullable: true })
  valid_from?: Date | null

  @Property({ type: 'date', nullable: true })
  valid_until?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
