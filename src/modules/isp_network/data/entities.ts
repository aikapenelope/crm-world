import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Nodo de red del ISP (POP principal, nodo de distribución, nodo de acceso).
 * Referencia: .ai/specs/2026-05-26-isp-telecom-vertical.md §Módulo 2
 */
@Entity({ tableName: 'isp_network_nodes' })
export class IspNetworkNodeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 100 })
  name!: string

  /** pop_principal / nodo_distribucion / nodo_acceso / repetidora */
  @Property({ type: 'text', length: 30 })
  node_type!: string

  /** active / degraded / offline / maintenance */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'text', length: 100 })
  city!: string

  @Property({ type: 'text', nullable: true })
  address?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lat?: string | null

  @Property({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  coordinates_lng?: string | null

  @Property({ type: 'int', nullable: true })
  total_capacity_mbps?: number | null

  @Property({ type: 'int', nullable: true })
  used_capacity_mbps?: number | null

  @Property({ type: 'smallint', nullable: true })
  total_ports?: number | null

  @Property({ type: 'smallint', nullable: true })
  used_ports?: number | null

  @Property({ type: 'text', length: 100, nullable: true })
  equipment_model?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  equipment_serial?: string | null

  /** Fuente de energía: "CORPOELEC", "Planta propia", "UPS 8h + planta" */
  @Property({ type: 'text', length: 100, nullable: true })
  power_provider?: string | null

  @Property({ type: 'boolean', default: false })
  has_generator: boolean = false

  @Property({ type: 'smallint', nullable: true })
  battery_hours?: number | null

  @Property({ type: 'uuid', nullable: true })
  parent_node_id?: string | null

  /** Host configurado en Zabbix/PRTG para correlación de alertas */
  @Property({ type: 'text', length: 200, nullable: true })
  monitoring_host?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  last_outage_at?: Date | null

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
 * Tramo físico entre dos nodos (fibra tendida, enlace inalámbrico, coaxial).
 */
@Entity({ tableName: 'isp_network_segments' })
export class IspNetworkSegmentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  node_from_id!: string

  @Property({ type: 'uuid' })
  node_to_id!: string

  /** fiber / wireless / coax */
  @Property({ type: 'text', length: 20 })
  segment_type!: string

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distance_km?: string | null

  @Property({ type: 'int', nullable: true })
  capacity_mbps?: number | null

  /** active / degraded / offline */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'date', nullable: true })
  installation_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

/**
 * Inventario central de equipos CPE del ISP (routers, ONTs, antenas).
 * Cada equipo tiene número de serie único y estado de ciclo de vida.
 */
@Entity({ tableName: 'isp_cpe_inventory' })
export class IspCpeInventoryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** router / ont / antenna / switch / other */
  @Property({ type: 'text', length: 20 })
  cpe_type!: string

  @Property({ type: 'text', length: 50 })
  brand!: string

  @Property({ type: 'text', length: 100 })
  model!: string

  @Property({ type: 'text', length: 100 })
  serial_number!: string

  @Property({ type: 'text', length: 17, nullable: true })
  mac_address?: string | null

  /** in_stock / deployed / in_repair / written_off */
  @Property({ type: 'text', length: 20 })
  status: string = 'in_stock'

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchase_price_usd?: string | null

  @Property({ type: 'date', nullable: true })
  purchase_date?: Date | null

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
 * Registro de qué CPE está instalado en qué abonado.
 * null en uninstalled_at = sigue instalado.
 */
@Entity({ tableName: 'isp_cpe_deployments' })
export class IspCpeDeploymentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'uuid' })
  cpe_id!: string

  @Property({ type: 'uuid' })
  subscriber_id!: string

  @Property({ type: 'timestamptz' })
  installed_at: Date = new Date()

  @Property({ type: 'uuid', nullable: true })
  installed_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  uninstalled_at?: Date | null

  /** good / damaged / stolen — solo si fue retirado */
  @Property({ type: 'text', length: 20, nullable: true })
  uninstall_condition?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
