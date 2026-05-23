import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriInputItem — Ítem de Inventario de Insumos Agropecuarios
// =============================================================================

/**
 * Registra todos los insumos necesarios para la producción animal:
 * medicamentos, vacunas, alimento balanceado, agroquímicos y materiales.
 *
 * Particularidades venezolanas:
 * - Los medicamentos e insumos importados requieren número de registro INSAI
 * - Las vacunas necesitan almacenamiento en frío (storage_temp_min/max)
 * - El lote del fabricante (lot_number) es obligatorio para trazabilidad
 *   ante inspecciones del INSAI y para la cadena de trazabilidad completa
 *
 * La alerta de stock mínimo se emite cuando quantity_available < min_stock.
 * La alerta de vencimiento se emite cuando expiry_date ≤ hoy + 30 días.
 */
@Entity({ tableName: 'agri_input_items' })
export class AgriInputItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /**
   * medication    = medicamento veterinario
   * vaccine       = vacuna (requiere cadena de frío)
   * feed          = alimento balanceado
   * agrochemical  = agroquímico (fertilizante, herbicida, plaguicida)
   * material      = material de granja (yacija, bebederos, comederos, etc.)
   */
  @Property({ type: 'text', length: 20 })
  input_type!: string

  /** Subcategoría libre: "Antibiótico", "Vitamina", "Vacuna viral", "Fertilizante N", etc. */
  @Property({ type: 'text', length: 100, nullable: true })
  category?: string | null

  /**
   * Unidad de medida del inventario.
   * doses = dosis  · ml = mililitros  · liters = litros
   * kg = kilogramos · g = gramos · units = unidades
   */
  @Property({ type: 'text', length: 20 })
  unit: string = 'units'

  /**
   * Número de registro en INSAI (Instituto Nacional de Salud Agrícola Integral).
   * Obligatorio para medicamentos e insumos veterinarios en Venezuela.
   */
  @Property({ type: 'text', length: 100, nullable: true })
  insai_registry?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  active_ingredient?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  manufacturer?: string | null

  /** Número de lote del fabricante — conecta con trazabilidad */
  @Property({ type: 'text', length: 100, nullable: true })
  lot_number?: string | null

  @Property({ type: 'date', nullable: true })
  expiry_date?: Date | null

  /** Temperatura mínima de almacenamiento (°C) — crítico para vacunas (2-8°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  storage_temp_min?: string | null

  /** Temperatura máxima de almacenamiento (°C) */
  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  storage_temp_max?: string | null

  /** Stock disponible (unidades según `unit`) */
  @Property({ type: 'decimal', precision: 12, scale: 3 })
  quantity_available: string = '0.000'

  /** Stock mínimo de seguridad — debajo de este nivel se genera alerta */
  @Property({ type: 'decimal', precision: 12, scale: 3 })
  min_stock: string = '0.000'

  /** Cantidad a pedir en la próxima orden de reposición */
  @Property({ type: 'decimal', precision: 12, scale: 3 })
  reorder_quantity: string = '0.000'

  /** Costo unitario en USD */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unit_cost_usd?: string | null

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
// AgriInputMovement — Movimiento de Stock de Insumos
// =============================================================================

/**
 * Cada entrada o salida de inventario genera un movimiento.
 * Los consumos se generan automáticamente cuando:
 * - Se aplica una vacunación en agri_vet (via event subscriber)
 * - Se aplica un tratamiento medicamentoso en agri_vet (via event subscriber)
 *
 * La quantity puede ser positiva (entradas) o negativa (salidas/consumos).
 * Este registro es la fuente de verdad para el historial de stock y
 * es requerido para auditorías del INSAI.
 */
@Entity({ tableName: 'agri_input_movements' })
export class AgriInputMovementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  input_item_id!: string

  /**
   * purchase_in      = entrada por compra
   * consumption      = consumo (vacunación, medicación, uso en campo)
   * adjustment       = ajuste manual de inventario
   * expiry_write_off = baja por vencimiento
   * transfer         = transferencia entre almacenes
   */
  @Property({ type: 'text', length: 25 })
  movement_type!: string

  /**
   * Positivo = entrada al inventario.
   * Negativo = salida/consumo del inventario.
   */
  @Property({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: string

  /** vaccination_record | medication_record | purchase_order | manual */
  @Property({ type: 'text', length: 30, nullable: true })
  reference_type?: string | null

  /** ID del registro que originó el movimiento */
  @Property({ type: 'uuid', nullable: true })
  reference_id?: string | null

  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unit_cost_usd?: string | null

  @Property({ type: 'uuid', nullable: true })
  performed_by?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
