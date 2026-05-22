import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'isp_coverage_zones' })
export class IspCoverageZoneEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', length: 100 })
  city!: string

  /** FK → isp_network_nodes (nodo que da servicio a esta zona) */
  @Property({ type: 'uuid' })
  node_id!: string

  @Property({ type: 'boolean', default: true })
  has_coverage: boolean = true

  /** fiber / wireless / both */
  @Property({ type: 'text', length: 20 })
  technology_available: string = 'wireless'

  @Property({ type: 'int', nullable: true })
  max_speed_mbps?: number | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

@Entity({ tableName: 'isp_leads' })
export class IspLeadEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 30 })
  phone!: string

  @Property({ type: 'text', length: 255, nullable: true })
  email?: string | null

  @Property({ type: 'text' })
  address!: string

  @Property({ type: 'text', length: 100 })
  city!: string

  /**
   * Fuentes más comunes en Venezuela:
   * whatsapp, instagram, referral (referido), website, cold_call, other
   */
  @Property({ type: 'text', length: 30 })
  source: string = 'whatsapp'

  @Property({ type: 'uuid', nullable: true })
  referral_subscriber_id?: string | null

  /** new / coverage_check / quoted / scheduled / installed / lost */
  @Property({ type: 'text', length: 20 })
  status: string = 'new'

  /** covered / not_covered / waitlist */
  @Property({ type: 'text', length: 20, nullable: true })
  coverage_status?: string | null

  @Property({ type: 'uuid', nullable: true })
  coverage_zone_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  interested_plan_id?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  quote_sent_at?: Date | null

  @Property({ type: 'date', nullable: true })
  installation_date?: Date | null

  @Property({ type: 'uuid', nullable: true })
  assigned_agent_id?: string | null

  /** price / no_coverage / chose_competitor / not_responsive / other */
  @Property({ type: 'text', length: 50, nullable: true })
  lost_reason?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

@Entity({ tableName: 'isp_commissions' })
export class IspCommissionEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  agent_id!: string

  @Property({ type: 'uuid' })
  subscriber_id!: string

  /** installation / retention_3m / retention_6m / upgrade */
  @Property({ type: 'text', length: 20 })
  commission_type!: string

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  amount_usd!: string

  @Property({ type: 'text', length: 7, nullable: true })
  period_month?: string | null

  /** pending / approved / paid / cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  @Property({ type: 'date', nullable: true })
  paid_at?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
