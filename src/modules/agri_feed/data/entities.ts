import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// FeedFormula — Fórmula de Alimento Balanceado
// =============================================================================

/**
 * Una fórmula describe la composición nutricional y los ingredientes de un
 * tipo de alimento (iniciador, engorde, finalizador). El campo `ingredients`
 * almacena un array JSON con la siguiente estructura por ingrediente:
 *
 * [
 *   {
 *     "name": "Maíz",
 *     "percentage": 65.0,        // % de inclusión
 *     "category": "grain",       // grain | protein | mineral | additive | other
 *     "price_usd_per_ton": null, // precio en USD (importados)
 *     "price_ves_per_ton": 750000 // precio en VES (locales)
 *   },
 *   ...
 * ]
 *
 * El campo `cost_per_ton_usd` se recalcula automáticamente cuando:
 * a) cambia el tipo de cambio BCV (via worker on-rate-changed.ts)
 * b) el usuario actualiza los precios de los ingredientes
 *
 * Fórmula: sum(% / 100 × (price_usd_per_ton ?? price_ves_per_ton / bcv_rate))
 */
@Entity({ tableName: 'agri_feed_formulas' })
export class AgriFeedFormulaEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /**
   * starter  = iniciador (0-14 días pollo engorde)
   * grower   = engorde (15-35 días)
   * finisher = finalizador (36+ días)
   * layer    = postura
   * breeding = reproductores
   * other    = otro uso
   */
  @Property({ type: 'text', length: 20 })
  formula_type!: string

  /** broiler | layer | turkey | swine | bovine | all */
  @Property({ type: 'text', length: 20 })
  species: string = 'broiler'

  /**
   * Array JSON de ingredientes con % de inclusión y precios.
   * Ver doc de la entidad para estructura completa.
   */
  @Property({ type: 'json' })
  ingredients: object[] = []

  /** Proteína cruda calculada (%) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  protein_pct?: string | null

  /** Energía metabolizable (kcal/kg) */
  @Property({ type: 'int', nullable: true })
  energy_kcal_kg?: number | null

  /** Lisina digestible (%) — aminoácido limitante clave en aves */
  @Property({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  lysine_pct?: string | null

  /** Humedad máxima especificada (%) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  moisture_pct?: string | null

  /**
   * Costo por tonelada en USD. Campo calculado — actualizado automáticamente
   * por el worker `on-rate-changed.ts` y manualmente por el usuario.
   */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  cost_per_ton_usd: string = '0.0000'

  /** Tasa BCV utilizada en el último cálculo de costo */
  @Property({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  last_bcv_rate?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  last_cost_update?: Date | null

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
// FeedBatch — Lote de Producción o Compra de Alimento
// =============================================================================

/**
 * Cada lote de alimento tiene un origen: producción propia (la empresa tiene
 * planta de alimento) o compra a terceros. En ambos casos se registran los
 * resultados del análisis de laboratorio (proteína, humedad, aflatoxinas).
 * Las aflatoxinas no deben superar 20 ppb según normativa venezolana (SENASAG).
 */
@Entity({ tableName: 'agri_feed_batches' })
export class AgriFeedBatchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** ALIM-2026-001 — número secuencial único del lote */
  @Property({ type: 'text', length: 50 })
  batch_number!: string

  @Property({ type: 'uuid' })
  formula_id!: string

  @Property({ type: 'date' })
  batch_date!: Date

  /** Cantidad producida o comprada en toneladas */
  @Property({ type: 'decimal', precision: 10, scale: 3 })
  quantity_tons!: string

  /** own_production | purchased */
  @Property({ type: 'text', length: 20 })
  source_type: string = 'purchased'

  /** Si es purchased — proveedor de alimento (FK a customers) */
  @Property({ type: 'uuid', nullable: true })
  supplier_id?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  supplier_invoice?: string | null

  /** Número de lote del proveedor — para trazabilidad hacia atrás */
  @Property({ type: 'text', length: 100, nullable: true })
  supplier_lot_number?: string | null

  /**
   * Para producción propia: lista de ingredientes consumidos con sus lotes.
   * [{ ingredient: "Maíz", lot_number: "MAIZ-001", quantity_kg: 6500, supplier: "GRAMIL" }]
   */
  @Property({ type: 'json', nullable: true })
  ingredients_used?: object[] | null

  /** Resultado de análisis de laboratorio — proteína real (%) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  protein_result_pct?: string | null

  /** Resultado de análisis — humedad (%) */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  moisture_result_pct?: string | null

  /**
   * Aflatoxinas en ppb. Límite venezolano: 20 ppb.
   * Si supera el límite → lote rechazado automáticamente.
   */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  aflatoxin_ppb?: string | null

  /** pending_analysis | approved | rejected | consumed */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending_analysis'

  /** Costo real del lote en USD (basado en factura de proveedor o costo de producción) */
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  cost_per_ton_usd?: string | null

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
// FeedAllocation — Asignación de lote de alimento a un flock (trazabilidad)
// =============================================================================

/**
 * Vincula un lote de alimento con el flock que lo consumió.
 * Este vínculo es crítico para la trazabilidad hacia atrás:
 * permite rastrear desde un producto terminado hasta los lotes de
 * alimento y sus ingredientes.
 */
@Entity({ tableName: 'agri_feed_allocations' })
export class AgriFeedAllocationEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  @Property({ type: 'uuid' })
  feed_batch_id!: string

  @Property({ type: 'date' })
  allocated_date!: Date

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity_kg!: string

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
