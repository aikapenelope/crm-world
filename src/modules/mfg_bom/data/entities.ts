import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// MfgBomHeader — Cabecera del Bill of Materials
// =============================================================================

/**
 * Define la estructura de materiales para producir un producto.
 * Cada versión activa de un BOM reemplaza (supersedes) la anterior.
 * 
 * Dos tipos principales:
 *   process  = manufactura por procesos (alimentos, pinturas, químicos)
 *              BOM = receta con rendimiento: entran X kg, salen Y kg.
 *              expected_yield_pct = Y/X × 100. Merma = 100 - yield_pct.
 * 
 *   discrete = manufactura discreta (metalmecánica, ensamblaje, textil)
 *              BOM = lista de componentes para 1 unidad de producto.
 *              Puede ser multinivel: subconjuntos que tienen su propio BOM.
 * 
 * Particularidad venezolana: los BOMs tienen materiales alternativos
 * definidos para gestionar escasez. El sistema los propone automáticamente
 * cuando el material principal está bajo stock.
 */
@Entity({ tableName: 'mfg_bom_headers' })
export class MfgBomHeaderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** ID del producto terminado o semielaborado que produce este BOM */
  @Property({ type: 'uuid' })
  product_id!: string

  /** Código del producto (redundante para queries sin join) */
  @Property({ type: 'text', length: 100 })
  product_code!: string

  /** Nombre del producto (cached para display) */
  @Property({ type: 'text', length: 255 })
  product_name!: string

  /** Versión del BOM: "1.0", "1.1", "2.0". Incrementa en cada cambio aprobado. */
  @Property({ type: 'text', length: 10 })
  version: string = '1.0'

  /**
   * draft      = en elaboración, no disponible para producción
   * active     = versión oficial para nuevas órdenes de producción
   * superseded = reemplazada por versión más nueva (se mantiene para trazabilidad histórica)
   * archived   = fuera de uso, no disponible en búsquedas
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  /**
   * process  = manufactura por procesos (receta con rendimiento)
   * discrete = manufactura discreta (lista de componentes multinivel)
   */
  @Property({ type: 'text', length: 20 })
  bom_type: string = 'discrete'

  /** Cantidad base que produce este BOM. Ej: 1000 (kg de producto) o 1 (unidad) */
  @Property({ type: 'decimal', precision: 12, scale: 4 })
  base_quantity: string = '1.0000'

  /** Unidad de medida del producto terminado: kg, units, liters, meters, etc. */
  @Property({ type: 'text', length: 20 })
  base_uom: string = 'units'

  /**
   * Solo para bom_type='process': rendimiento esperado en %.
   * 85.00 significa que por cada 100 kg de insumos se obtienen 85 kg de PT.
   * Null para manufactura discreta.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  expected_yield_pct?: string | null

  /** Quién aprobó la activación de esta versión */
  @Property({ type: 'text', length: 255, nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  /** Motivo del cambio con respecto a la versión anterior */
  @Property({ type: 'text', nullable: true })
  change_reason?: string | null

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
// MfgBomLine — Línea de componente del BOM
// =============================================================================

/**
 * Cada línea define UN componente del BOM con su cantidad por unidad de producto.
 * 
 * Para BOM tipo 'discrete': quantity es la cantidad exacta del componente
 * por 1 unidad (o base_quantity) del producto terminado.
 * 
 * Para BOM tipo 'process': quantity es la cantidad del insumo que entra
 * al proceso para obtener base_quantity de producto terminado.
 * 
 * El campo scrap_pct indica la merma adicional de este componente
 * (pérdida por el proceso de transformación, no el componente defectuoso).
 * La cantidad a solicitar = quantity × (1 + scrap_pct/100).
 * 
 * is_critical = true indica que la producción NO puede iniciarse sin
 * disponibilidad de este componente. Para componentes no críticos,
 * la orden puede abrirse con stock parcial.
 */
@Index({ name: 'idx_mfg_bom_lines_bom', properties: ['tenant_id', 'bom_id'] })
@Entity({ tableName: 'mfg_bom_lines' })
export class MfgBomLineEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  bom_id!: string

  /** Número de secuencia dentro del BOM (para ordenar la lista) */
  @Property({ type: 'smallint' })
  line_number!: number

  @Property({ type: 'uuid' })
  component_id!: string

  @Property({ type: 'text', length: 100 })
  component_code!: string

  @Property({ type: 'text', length: 255 })
  component_name!: string

  /**
   * raw_material = materia prima
   * packaging    = material de empaque (etiqueta, caja, bolsa, etc.)
   * subassembly  = subconjunto fabricado internamente (tiene su propio BOM)
   * consumable   = consumible de proceso (lubricante, limpieza, etc.)
   */
  @Property({ type: 'text', length: 20 })
  component_type: string = 'raw_material'

  /** Cantidad del componente por base_quantity del producto terminado */
  @Property({ type: 'decimal', precision: 14, scale: 6 })
  quantity!: string

  @Property({ type: 'text', length: 20 })
  uom!: string

  /**
   * Merma esperada del proceso en %. Se aplica sobre la cantidad.
   * Cantidad a solicitar = quantity × (1 + scrap_pct / 100).
   * Default 0 = sin merma.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  scrap_pct: string = '0.00'

  /**
   * true = la producción NO puede iniciarse sin este componente disponible.
   * El MRP genera alertas con mayor urgencia para componentes críticos.
   */
  @Property({ type: 'boolean', default: true })
  is_critical: boolean = true

  /**
   * true = BOM fantasma: el subconjunto NO tiene stock propio,
   * sus componentes se consolidan directamente en el BOM padre.
   * Útil para subconjuntos que se fabrican en el mismo turno sin pasar por almacén.
   */
  @Property({ type: 'boolean', default: false })
  is_phantom: boolean = false

  /**
   * Días de anticipación para solicitar este material antes del inicio de producción.
   * 0 = mismo día. 2 = solicitar 2 días antes. Alimenta el MRP.
   */
  @Property({ type: 'int' })
  lead_offset_days: number = 0

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgBomAlternative — Material alternativo para gestión de escasez
// =============================================================================

/**
 * Define un material que puede sustituir al componente original de una línea de BOM.
 * Crítico para la realidad venezolana donde la escasez de insumos específicos
 * obliga a reformular sin detener la producción.
 * 
 * El sistema propone automáticamente el alternativo cuando el stock del
 * material original cae por debajo del requerimiento de la orden.
 * 
 * conversion_factor: cuánto del alternativo se necesita por cada unidad del original.
 * Ejemplo: si el original es "aceite de soya A" y el alternativo es "aceite de soya B"
 * con menor índice de yodo, conversion_factor = 1.03 (usar 3% más para igual resultado).
 */
@Entity({ tableName: 'mfg_bom_alternatives' })
export class MfgBomAlternativeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  bom_line_id!: string

  @Property({ type: 'uuid' })
  alt_material_id!: string

  @Property({ type: 'text', length: 100 })
  alt_material_code!: string

  @Property({ type: 'text', length: 255 })
  alt_material_name!: string

  /**
   * Factor de conversión vs. material original.
   * 1.00 = misma cantidad. 1.05 = usar 5% más. 0.95 = usar 5% menos.
   */
  @Property({ type: 'decimal', precision: 8, scale: 4 })
  conversion_factor: string = '1.0000'

  /**
   * shortage_only        = usar solo cuando el original no esté disponible
   * approved_equivalent  = equivalente técnico aprobado, puede usarse sin aviso especial
   * cost_reduction       = alternativo más económico aprobado para uso regular
   */
  @Property({ type: 'text', length: 25 })
  usage_condition: string = 'shortage_only'

  /** Notas sobre el impacto técnico o de calidad de usar este alternativo */
  @Property({ type: 'text', nullable: true })
  quality_impact_notes?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MfgBomVersion — Historial de versiones del BOM
// =============================================================================

/**
 * Registro de cada cambio de versión en el BOM de un producto.
 * Provee trazabilidad histórica: qué cambió, por qué, quién lo aprobó.
 * Requerido para industrias reguladas (farmacéutica, alimentos).
 */
@Entity({ tableName: 'mfg_bom_versions' })
export class MfgBomVersionEntity {
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

  @Property({ type: 'text', length: 10 })
  from_version!: string

  @Property({ type: 'text', length: 10 })
  to_version!: string

  /**
   * component_change = cambio en los componentes (adición, eliminación, sustitución)
   * quantity_change  = cambio en cantidades o unidades
   * yield_change     = cambio en el rendimiento del proceso
   * new_alternative  = se agregó un material alternativo
   * process_change   = cambio en parámetros de proceso (sin cambio de componentes)
   */
  @Property({ type: 'text', length: 25 })
  change_type!: string

  @Property({ type: 'text' })
  change_summary!: string

  @Property({ type: 'uuid', nullable: true })
  changed_by?: string | null

  @Property({ type: 'timestamptz' })
  changed_at: Date = new Date()

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null
}
