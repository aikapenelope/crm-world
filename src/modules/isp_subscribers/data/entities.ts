import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Abonado del ISP. Corazón del sistema.
 * El ciclo de vida del servicio (service_status) determina qué acciones
 * están disponibles y qué eventos se emiten.
 *
 * Lifecycle:
 *   pending_installation → active ↔ suspended_overdue
 *                                 ↔ suspended_voluntary
 *                                 → pending_change_plan
 *   any → cancelled
 */
@Entity({ tableName: 'isp_subscribers' })
export class IspSubscriberEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** FK → customer_entities (person/company) — vinculación con el CRM */
  @Property({ type: 'uuid', nullable: true })
  customer_entity_id?: string | null

  /** Número de cuenta único del ISP, ej: NETBQ-00001 */
  @Property({ type: 'text', length: 20 })
  account_number!: string

  /** residential / pyme / corporate / wholesale */
  @Property({ type: 'text', length: 20 })
  subscriber_type: string = 'residential'

  /**
   * Estado del servicio.
   * pending_installation → active → suspended_overdue | suspended_voluntary | cancelled
   */
  @Property({ type: 'text', length: 30 })
  service_status: string = 'pending_installation'

  /** FK → isp_service_plans */
  @Property({ type: 'uuid', nullable: true })
  plan_id?: string | null

  /** FK → isp_network_nodes */
  @Property({ type: 'uuid', nullable: true })
  node_id?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monthly_price_usd!: string

  @Property({ type: 'text' })
  installation_address!: string

  @Property({ type: 'text', length: 100 })
  installation_city!: string

  @Property({ type: 'text', length: 100, nullable: true })
  installation_state?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lat?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lng?: string | null

  /** Referencia de ubicación: "Casa blanca, portón azul, frente al semáforo" */
  @Property({ type: 'text', nullable: true })
  reference_description?: string | null

  /** FK → isp_cpe_deployments (equipo CPE activo) */
  @Property({ type: 'uuid', nullable: true })
  cpe_deployment_id?: string | null

  @Property({ type: 'text', length: 45, nullable: true })
  ip_address?: string | null

  @Property({ type: 'text', length: 17, nullable: true })
  mac_address?: string | null

  /** Usuario PPPoE para autenticación Radius */
  @Property({ type: 'text', length: 100, nullable: true })
  pppoe_username?: string | null

  /** Día del mes en que vence la factura (1-28) */
  @Property({ type: 'smallint' })
  billing_cycle_day: number = 1

  /**
   * Días de gracia antes del corte automático.
   * Residencial=7, PYME=10, Corporativo=15.
   */
  @Property({ type: 'smallint' })
  cut_policy_days: number = 7

  @Property({ type: 'date', nullable: true })
  activation_date?: Date | null

  @Property({ type: 'date', nullable: true })
  last_payment_date?: Date | null

  /** FK → staff (agente comercial que captó al cliente) */
  @Property({ type: 'uuid', nullable: true })
  assigned_agent_id?: string | null

  /** Para clientes corporativos: nombre del contacto técnico */
  @Property({ type: 'text', length: 255, nullable: true })
  technical_contact_name?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  technical_contact_phone?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

/**
 * Contrato de servicio del abonado.
 * Puede ser mensual (renovación automática) o anual (con penalidad).
 */
@Entity({ tableName: 'isp_subscriber_contracts' })
export class IspSubscriberContractEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  subscriber_id!: string

  @Property({ type: 'text', length: 30 })
  contract_number!: string

  /** monthly / annual / special */
  @Property({ type: 'text', length: 20 })
  contract_type: string = 'monthly'

  @Property({ type: 'date' })
  start_date!: Date

  @Property({ type: 'date', nullable: true })
  end_date?: Date | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monthly_price_usd!: string

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  installation_fee_usd: string = '0.00'

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  deposit_usd: string = '0.00'

  @Property({ type: 'text', nullable: true })
  penalty_clause?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  signed_at?: Date | null

  @Property({ type: 'text', nullable: true })
  document_url?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
