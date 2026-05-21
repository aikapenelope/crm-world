import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export type PlanTechnology = 'fiber' | 'wireless' | 'cable' | 'dedicated'
export type PlanSegment = 'residential' | 'pyme' | 'corporate' | 'wholesale'

@Entity({ tableName: 'isp_service_plans' })
export class IspServicePlanEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'text', length: 20 })
  technology: string = 'wireless'

  @Property({ type: 'int' })
  download_mbps!: number

  @Property({ type: 'int' })
  upload_mbps!: number

  @Property({ type: 'boolean', default: false })
  is_symmetric: boolean = false

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monthly_price_usd!: string

  @Property({ type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  installation_fee_usd: string = '0.00'

  @Property({ type: 'text', length: 20 })
  target_segment: string = 'residential'

  @Property({ type: 'text', length: 100, nullable: true })
  radius_profile?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  olt_profile?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'boolean', default: false })
  is_promotional: boolean = false

  @Property({ type: 'date', nullable: true })
  promotional_until?: Date | null

  @Property({ type: 'smallint', default: 0 })
  sort_order: number = 0

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

@Entity({ tableName: 'isp_plan_addons' })
export class IspPlanAddonEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monthly_price_usd!: string

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
