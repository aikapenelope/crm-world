import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriSlaughterBatch — Lote de Beneficio Animal
// =============================================================================

/**
 * Registra el proceso completo de beneficio para un lote de aves.
 * Nodo central de trazabilidad: conecta el flock de origen con los lotes
 * de producto terminado.
 *
 * Flujo: receiving → processing → chilling → pending_qc → approved → dispatched
 *
 * Antes de crear un SlaughterBatch, el API verifica que el flock NO tenga
 * agri_vet_medication_records con withdrawal_end_date > today.
 * Si los hay → 409 Conflict con el medicamento y la fecha de retiro.
 *
 * El despacho requiere aprobación del jefe de calidad (Workflow JSON:
 * despacho_sanitario_v1). dispatch_approved_by + dispatch_approved_at
 * son la evidencia firmada del workflow.
 */
@Entity({ tableName: 'agri_slaughter_batches' })
export class AgriSlaughterBatchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** BENEF-2026-001 */
  @Property({ type: 'text', length: 50 })
  batch_number!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  @Property({ type: 'uuid', nullable: true })
  farm_unit_id?: string | null

  @Property({ type: 'date' })
  slaughter_date!: Date

  @Property({ type: 'int' })
  birds_in!: number

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  live_weight_kg!: string

  @Property({ type: 'int' })
  birds_processed!: number

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  carcass_weight_hot_kg?: string | null

  /** Pesaje después del chiller — base del rendimiento final */
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  carcass_weight_cold_kg?: string | null

  /** Rendimiento (%) = carcass_cold / live_weight × 100. Ross 308 → 73-75% */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  yield_pct?: string | null

  @Property({ type: 'int' })
  condemned_count: number = 0

  @Property({ type: 'text', nullable: true })
  condemned_reason?: string | null

  /** pending | approved | rejected */
  @Property({ type: 'text', length: 20 })
  microbiological_result: string = 'pending'

  @Property({ type: 'text', nullable: true })
  microbiological_notes?: string | null

  /**
   * receiving | processing | chilling | pending_qc | approved | dispatched
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'receiving'

  @Property({ type: 'uuid', nullable: true })
  dispatch_approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  dispatch_approved_at?: Date | null

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
// AgriProcessingFormula — Fórmula de Procesamiento
// =============================================================================

/**
 * Define cómo se transforma un canal en un producto terminado.
 *
 * parts_used JSON: [{ "part": "breast", "percentage": 100, "include": true }]
 * additives JSON:  [{ "name": "Sal", "percentage": 1.5 }]
 */
@Entity({ tableName: 'agri_processing_formulas' })
export class AgriProcessingFormulaEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** whole_carcass | cuts | processed | embutido */
  @Property({ type: 'text', length: 20 })
  product_type: string = 'cuts'

  @Property({ type: 'json' })
  parts_used: object[] = []

  @Property({ type: 'json', nullable: true })
  additives?: object[] | null

  @Property({ type: 'decimal', precision: 5, scale: 2 })
  expected_yield_pct!: string

  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  processing_cost_per_kg_usd?: string | null

  @Property({ type: 'int', nullable: true })
  shelf_life_days?: number | null

  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  storage_temp_min?: string | null

  @Property({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  storage_temp_max?: string | null

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
// AgriProcessingLot — Lote de Producto Terminado
// =============================================================================

/**
 * Unidad de trazabilidad comercial: el número de lote impreso en la etiqueta
 * que llega al supermercado. Conecta el producto con su SlaughterBatch de
 * origen y por ende con el flock, sus alimentos y medicamentos.
 */
@Entity({ tableName: 'agri_processing_lots' })
export class AgriProcessingLotEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** PROD-2026-001 — código de lote impreso en etiqueta */
  @Property({ type: 'text', length: 50 })
  lot_number!: string

  @Property({ type: 'uuid' })
  slaughter_batch_id!: string

  @Property({ type: 'uuid' })
  formula_id!: string

  @Property({ type: 'date' })
  processing_date!: Date

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity_kg!: string

  @Property({ type: 'int', nullable: true })
  unit_count?: number | null

  @Property({ type: 'int', nullable: true })
  package_weight_g?: number | null

  @Property({ type: 'text', length: 100, nullable: true })
  barcode?: string | null

  @Property({ type: 'date', nullable: true })
  expiry_date?: Date | null

  /** in_stock | partially_dispatched | fully_dispatched | recalled */
  @Property({ type: 'text', length: 25 })
  status: string = 'in_stock'

  @Property({ type: 'uuid', nullable: true })
  cold_storage_unit_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
