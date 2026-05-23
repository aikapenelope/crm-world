import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriRecall — Gestión de Retiro de Mercado (Recall)
// =============================================================================

/**
 * Un recall es el retiro del mercado de uno o más lotes de producto
 * terminado debido a un peligro para el consumidor.
 *
 * El recall se inicia en agri_traceability, que:
 * 1. Identifica el processing_lot afectado
 * 2. Consulta agri_sale_dispatches (Sprint C) para encontrar qué clientes
 *    recibieron el lote y en qué cantidades
 * 3. Genera automáticamente `affected_clients` como JSON
 * 4. Activa el workflow de aprobación del GM
 *
 * Clasificación FDA/Codex Alimentarius:
 *   Clase I  = peligro real para la salud (microbiológico, químico grave)
 *   Clase II = posible peligro o baja probabilidad
 *   Clase III = sin riesgo, cumplimiento regulatorio
 *
 * COVENIN Venezuela: el recall debe notificarse al INSAI dentro de las
 * 24 horas de su detección en recalls Clase I.
 */
@Entity({ tableName: 'agri_recalls' })
export class AgriRecallEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** RECALL-2026-001 */
  @Property({ type: 'text', length: 50 })
  recall_number!: string

  /** ID del lote de producto terminado afectado (agri_processing_lots) */
  @Property({ type: 'uuid' })
  processing_lot_id!: string

  /** Número de lote del producto (para referencia rápida sin join) */
  @Property({ type: 'text', length: 50 })
  lot_number!: string

  @Property({ type: 'text' })
  reason!: string

  /** I | II | III — clasificación según FDA/Codex Alimentarius */
  @Property({ type: 'text', length: 5 })
  recall_class: string = 'II'

  /**
   * customer_complaint | insai_alert | internal_analysis |
   * supplier_notification | regulatory_audit
   */
  @Property({ type: 'text', length: 30 })
  detection_source!: string

  @Property({ type: 'date' })
  initiated_date!: Date

  /**
   * investigating = investigando el alcance del problema
   * executing     = recall en ejecución (clientes notificados, recogiendo productos)
   * completed     = todos los productos recogidos o accounted for
   * closed        = caso cerrado con informe final
   */
  @Property({ type: 'text', length: 20 })
  status: string = 'investigating'

  /**
   * Lista auto-generada de clientes afectados.
   * Se llena al iniciar el recall desde el trace API.
   * [{ "client_id": "...", "client_name": "Farmatodo", "quantity_kg": 450, "notified_at": null }]
   */
  @Property({ type: 'json' })
  affected_clients: object[] = []

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity_recalled_kg?: string | null

  /** Si se requiere anuncio público en medios (Clase I casi siempre) */
  @Property({ type: 'boolean', default: false })
  public_announcement: boolean = false

  /** Usuario que aprobó y autorizó el recall (GM) */
  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  @Property({ type: 'date', nullable: true })
  completed_date?: Date | null

  @Property({ type: 'text', nullable: true })
  corrective_action?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
