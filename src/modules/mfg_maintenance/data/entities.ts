import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgEquipment — Equipo / Activo de Planta
// =============================================================================

/**
 * Registro maestro de cada máquina, equipo o instalación de la planta.
 *
 * Particularidad venezolana: el campo replacement_cost_usd es crítico porque
 * reponer un equipo en Venezuela puede tomar 12-24 meses (divisa, importación,
 * instalación). Esto justifica invertir en mantenimiento preventivo agresivo.
 *
 * criticality define la urgencia de atención:
 *   critical = sin este equipo la planta para completa (cuello de botella)
 *   high     = afecta capacidad >50% de la planta
 *   medium   = afecta una línea
 *   low      = equipo auxiliar o de soporte
 *
 * El campo criticality también determina el stock mínimo de repuestos críticos
 * que el módulo mantiene automáticamente.
 */
@Entity({ tableName: 'mfg_equipment' })
export class MfgEquipmentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** EQ-001, EXT-L1, COMP-AIR-02 */
  @Property({ type: 'text', length: 30 })
  equipment_code!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  brand?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  model?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  serial_number?: string | null

  @Property({ type: 'smallint', nullable: true })
  manufacture_year?: number | null

  @Property({ type: 'uuid', nullable: true })
  work_center_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  work_center_name?: string | null

  /**
   * operational       = operativo
   * under_maintenance = en mantenimiento planificado (parado)
   * breakdown         = avería — paro no planificado
   * retired           = retirado de servicio
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'operational'

  @Property({ type: 'date', nullable: true })
  last_overhaul_date?: Date | null

  /** Próxima fecha de mantenimiento (calculada por el worker check-maintenance-due) */
  @Property({ type: 'date', nullable: true })
  next_maintenance_date?: Date | null

  /**
   * Costo de reposición en USD.
   * En Venezuela, justifica el ROI del mantenimiento preventivo.
   * Ejemplo: compresor $85,000 USD → cambiar aceite cada 250h = $120 USD.
   */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  replacement_cost_usd?: string | null

  /** Representante local o proveedor de repuestos */
  @Property({ type: 'text', length: 255, nullable: true })
  supplier_contact?: string | null

  /** URL al manual técnico digital */
  @Property({ type: 'text', nullable: true })
  manual_document_url?: string | null

  /** critical | high | medium | low */
  @Property({ type: 'text', length: 20 })
  criticality: string = 'medium'

  /** Horas-máquina acumuladas (medidor) — para planes por horas */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  accumulated_hours: string = '0.00'

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
// MfgMaintenancePlan — Plan de Mantenimiento Preventivo
// =============================================================================

/**
 * Define la tarea de mantenimiento preventivo y su frecuencia.
 * Ejemplos:
 *   "Cambio de aceite hidráulico" — cada 500 horas de operación
 *   "Revisión de correas" — cada 30 días calendario
 *   "Limpieza general" — cada 2000 ciclos de producción
 *   "Overhaul mayor" — cada 12 meses
 *
 * El worker check-maintenance-due evalúa cada plan diariamente y genera
 * MfgWorkOrderMaint automáticamente cuando se acerca la fecha/hora de vencimiento.
 *
 * requires_shutdown = true significa que el equipo debe parar para esta tarea,
 * lo que implica pérdida de producción. El sistema avisa con anticipación
 * (7 días para críticos, 14 para no críticos) para que el planificador
 * incluya el paro en el MPS.
 */
@Entity({ tableName: 'mfg_maintenance_plans' })
export class MfgMaintenancePlanEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  equipment_id!: string

  @Property({ type: 'text', length: 30 })
  equipment_code!: string

  @Property({ type: 'text', length: 255 })
  plan_name!: string

  /**
   * hours    = cada N horas de operación del equipo (medidor)
   * days     = cada N días calendario
   * cycles   = cada N ciclos de producción
   * calendar = fecha fija (ej: primer lunes de cada mes)
   */
  @Property({ type: 'text', length: 20 })
  trigger_type: string = 'days'

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  trigger_interval!: string

  @Property({ type: 'date', nullable: true })
  last_performed_date?: Date | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  last_performed_hours?: string | null

  @Property({ type: 'date', nullable: true })
  next_due_date?: Date | null

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  next_due_hours?: string | null

  @Property({ type: 'decimal', precision: 6, scale: 2 })
  estimated_duration_hrs: string = '2.00'

  /** true = el equipo debe parar para este mantenimiento (afecta producción) */
  @Property({ type: 'boolean', default: false })
  requires_shutdown: boolean = false

  /**
   * Lista de repuestos requeridos para esta tarea.
   * Formato: [{ spare_part_id: uuid, part_code: string, part_name: string, quantity: number }]
   * El worker verifica stock disponible antes de generar la WO.
   */
  @Property({ type: 'jsonb', nullable: true })
  required_spare_parts?: Array<{ spare_part_id: string; part_code: string; part_name: string; quantity: number }> | null

  @Property({ type: 'text', length: 100, nullable: true })
  required_technician_skill?: string | null

  /** active | overdue | paused */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgWorkOrderMaint — Orden de Trabajo de Mantenimiento
// =============================================================================

/**
 * Instrucción formal de trabajo para una tarea de mantenimiento.
 * Puede ser preventiva (generada automáticamente por un plan) o
 * correctiva (creada manualmente cuando hay avería).
 *
 * Para mantenimiento correctivo, fault_description captura el síntoma
 * exacto reportado por el operador ("golpe extraño en el eje", "fuga de aceite
 * por junta del cárter", etc.). Esto alimenta el análisis de modos de falla.
 *
 * spare_parts_used registra exactamente qué piezas se consumieron,
 * lo que actualiza automáticamente el inventario de repuestos
 * y el cálculo de MTBF para ese tipo de falla.
 *
 * En Venezuela, documentar bien las WOs correctivas es crítico porque
 * el historial de fallas justifica la importación preventiva de repuestos
 * (argumento ante el gerente: "este motor falla cada 6 meses y el repuesto
 * tarda 3 meses → tenemos que tener stock permanente de 1 unidad").
 */
@Entity({ tableName: 'mfg_work_orders_maint' })
export class MfgWorkOrderMaintEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** WO-MAINT-2026-001 */
  @Property({ type: 'text', length: 50 })
  wo_number!: string

  @Property({ type: 'uuid' })
  equipment_id!: string

  @Property({ type: 'text', length: 30 })
  equipment_code!: string

  @Property({ type: 'text', length: 255 })
  equipment_name!: string

  @Property({ type: 'uuid', nullable: true })
  maintenance_plan_id?: string | null

  /** preventive | corrective | predictive */
  @Property({ type: 'text', length: 20 })
  work_type: string = 'preventive'

  /** critical | high | medium | low */
  @Property({ type: 'text', length: 20 })
  priority: string = 'medium'

  /** open | in_progress | completed | cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'open'

  @Property({ type: 'text' })
  description!: string

  @Property({ type: 'text', nullable: true })
  fault_description?: string | null

  @Property({ type: 'uuid', nullable: true })
  assigned_to?: string | null

  @Property({ type: 'date', nullable: true })
  scheduled_date?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  started_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null

  @Property({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  actual_duration_hrs?: string | null

  @Property({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  estimated_duration_hrs?: string | null

  /**
   * Repuestos realmente utilizados.
   * Formato: [{ spare_part_id, part_code, part_name, quantity, unit_cost_usd }]
   */
  @Property({ type: 'jsonb', nullable: true })
  spare_parts_used?: Array<{ spare_part_id: string; part_code: string; part_name: string; quantity: number; unit_cost_usd: number }> | null

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total_parts_cost_usd: string = '0.00'

  @Property({ type: 'text', nullable: true })
  work_performed?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgSparePart — Repuesto / Pieza de Mantenimiento
// =============================================================================

/**
 * Inventario de repuestos con cálculo automático de stock de seguridad
 * basado en el historial de fallas (MTBF) y el lead time de importación.
 *
 * Fórmula de stock de seguridad venezolana:
 *   safety_stock = ceil(lead_time_days / mtbf_days)
 *   Ejemplo: Motor se rompe cada 180 días, lead time 90 días → safety_stock = 1 unidad
 *
 * Esta lógica es diferente al cálculo estándar porque en Venezuela no se puede
 * "ordenar cuando se rompe" — hay que tener el repuesto ANTES de que falle.
 *
 * is_imported = true → alerta temprana cuando stock cae a safety_stock + 1
 * porque el proceso de compra requiere: cotización → aprobación divisas →
 * orden de compra → embarque → aduana → transporte interno (60-90 días total).
 *
 * El sistema genera PurchaseRequisition automática cuando:
 *   current_stock <= reorder_point
 */
@Entity({ tableName: 'mfg_spare_parts' })
export class MfgSparePartEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** SP-001, FILTER-HYD-10U */
  @Property({ type: 'text', length: 50 })
  part_code!: string

  @Property({ type: 'text', length: 255 })
  part_name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  /** IDs de equipos que usan este repuesto */
  @Property({ type: 'jsonb', nullable: true })
  equipment_ids?: string[] | null

  @Property({ type: 'decimal', precision: 12, scale: 4 })
  current_stock: string = '0.0000'

  @Property({ type: 'text', length: 20 })
  uom: string = 'units'

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unit_cost_usd?: string | null

  /**
   * Nivel de stock que dispara una orden de compra.
   * Para importados: debe considerar el lead time total venezolano.
   */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  reorder_point: string = '1.0000'

  /**
   * Stock mínimo calculado = ceil(lead_time_days / mtbf_days).
   * Nunca bajar de este nivel — si llega aquí ya hay emergencia.
   */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  safety_stock: string = '1.0000'

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  max_stock?: string | null

  @Property({ type: 'boolean', default: false })
  is_imported: boolean = false

  /** Lead time real en días (histórico, no el prometido por el proveedor) */
  @Property({ type: 'int' })
  lead_time_days: number = 15

  /** MTBF = días promedio entre fallos del componente (calculado del historial de WOs) */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  mtbf_days?: string | null

  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  supplier_name?: string | null

  /** Ubicación física en el almacén de repuestos */
  @Property({ type: 'text', length: 100, nullable: true })
  storage_location?: string | null

  @Property({ type: 'date', nullable: true })
  last_purchase_date?: Date | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  last_purchase_price_usd?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
