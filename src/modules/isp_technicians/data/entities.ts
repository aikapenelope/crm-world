import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'isp_field_technicians' })
export class IspFieldTechnicianEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid', nullable: true })
  staff_id?: string | null

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', length: 30 })
  phone!: string

  /** available / on_route / on_site / off_duty */
  @Property({ type: 'text', length: 20 })
  status: string = 'available'

  @Property({ type: 'text', length: 100, nullable: true })
  coverage_zone?: string | null

  @Property({ type: 'text', length: 10, nullable: true })
  vehicle_plate?: string | null

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  fuel_allowance_usd?: string | null

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  commission_per_install?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

@Entity({ tableName: 'isp_work_orders' })
export class IspWorkOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** OT-202605-00001 */
  @Property({ type: 'text', length: 20 })
  work_order_number!: string

  /** installation / repair / equipment_swap / uninstall / verification */
  @Property({ type: 'text', length: 30 })
  type!: string

  /** pending / scheduled / in_progress / completed / cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'pending'

  /** low / normal / high / urgent */
  @Property({ type: 'text', length: 10 })
  priority: string = 'normal'

  @Property({ type: 'uuid', nullable: true })
  subscriber_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  ticket_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  technician_id?: string | null

  @Property({ type: 'date', nullable: true })
  scheduled_date?: Date | null

  /** "08:00-10:00" ventana horaria */
  @Property({ type: 'text', length: 10, nullable: true })
  scheduled_time?: string | null

  @Property({ type: 'text' })
  address!: string

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lat?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lng?: string | null

  @Property({ type: 'text', nullable: true })
  instructions?: string | null

  @Property({ type: 'uuid', nullable: true })
  cpe_to_install_id?: string | null

  @Property({ type: 'uuid', nullable: true })
  cpe_installed_id?: string | null

  @Property({ type: 'text', nullable: true })
  completion_notes?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  km_traveled?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
