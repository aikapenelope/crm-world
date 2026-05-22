import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Ticket de soporte técnico.
 * Cubre averías individuales, consultas, cambios de plan y mudanzas.
 * Se integra con isp_network via node_id para correlacionar con averías masivas.
 */
@Entity({ tableName: 'isp_support_tickets' })
export class IspSupportTicketEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** TKT-202605-00001 */
  @Property({ type: 'text', length: 20 })
  ticket_number!: string

  @Property({ type: 'uuid', nullable: true })
  subscriber_id?: string | null

  /** FK → isp_network_nodes (correlación de avería) */
  @Property({ type: 'uuid', nullable: true })
  node_id?: string | null

  /** FK → isp_outages (si es parte de una avería masiva) */
  @Property({ type: 'uuid', nullable: true })
  outage_id?: string | null

  /** fault / inquiry / plan_change / move / new_service / complaint */
  @Property({ type: 'text', length: 30 })
  type!: string

  /** manual / whatsapp / phone / portal / automatic_monitoring */
  @Property({ type: 'text', length: 30 })
  origin: string = 'manual'

  /** open / assigned / in_progress / pending_client / resolved / closed */
  @Property({ type: 'text', length: 20 })
  status: string = 'open'

  /** low / normal / high / critical */
  @Property({ type: 'text', length: 10 })
  priority: string = 'normal'

  @Property({ type: 'text', length: 255 })
  subject!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', nullable: true })
  solution?: string | null

  @Property({ type: 'uuid', nullable: true })
  assigned_to?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  assigned_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  resolved_at?: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  closed_at?: Date | null

  @Property({ type: 'smallint', nullable: true })
  sla_hours?: number | null

  @Property({ type: 'boolean', default: false })
  sla_breached: boolean = false

  @Property({ type: 'uuid', nullable: true })
  escalated_to?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  escalated_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

/**
 * Comentario en un ticket. Internal=true = solo visible para staff.
 */
@Entity({ tableName: 'isp_ticket_comments' })
export class IspTicketCommentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  ticket_id!: string

  @Property({ type: 'uuid' })
  author_id!: string

  @Property({ type: 'text' })
  comment!: string

  @Property({ type: 'boolean', default: true })
  is_internal: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}

/**
 * Avería masiva que agrupa múltiples tickets afectados por el mismo nodo caído.
 * La causa en Venezuela más común: power_outage (CORPOELEC).
 */
@Entity({ tableName: 'isp_outages' })
export class IspOutageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  node_id!: string

  /** AVR-202605-0001 */
  @Property({ type: 'text', length: 20 })
  outage_number!: string

  /**
   * Causas más frecuentes en Venezuela:
   * power_outage → CORPOELEC (más común)
   * fiber_cut → robo de cable
   * equipment_failure → fallo de switch/OLT
   * weather → lluvia que daña equipo externo
   */
  @Property({ type: 'text', length: 30 })
  cause!: string

  /** active / investigating / resolved */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'int' })
  affected_subscribers: number = 0

  @Property({ type: 'timestamptz' })
  started_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  resolved_at?: Date | null

  @Property({ type: 'text', nullable: true })
  resolution_notes?: string | null

  @Property({ type: 'boolean', default: false })
  notified_subscribers: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
