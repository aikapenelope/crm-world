import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

/**
 * Registra la vertical de negocio asignada a cada tenant.
 * Un tenant puede tener a lo sumo una vertical activa.
 *
 * La vertical determina:
 *  - Qué datos semilla se aplican (via seedDefaults en el módulo vertical_presets)
 *  - Cómo se agrupa el sidebar por el admin (pageGroupKey unificado por vertical)
 *  - Qué módulos son relevantes en el contexto del tenant
 *
 * Nota: no es un hard constraint — todos los módulos siguen accesibles si el
 * admin tiene los permisos correctos. La vertical es una guía de UX, no un gate.
 */
@Entity({ tableName: 'tenant_verticals' })
export class TenantVerticalEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** Key de la vertical asignada — debe ser un valor válido de VERTICAL_KEYS */
  @Property({ type: 'text', length: 50 })
  vertical_key!: string

  /** UUID del usuario que hizo la asignación (superadmin) */
  @Property({ type: 'uuid', nullable: true })
  set_by?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
