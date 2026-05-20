import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum DocumentTemplateType {
  CONSTANCIA_ESTUDIO = 'constancia_estudio',
  CONSTANCIA_INSCRIPCION = 'constancia_inscripcion',
  CONSTANCIA_NOTAS = 'constancia_notas',
  CONSTANCIA_CONDUCTA = 'constancia_conducta',
  CARTA_RECOMENDACION = 'carta_recomendacion',
}

export enum GeneratedDocStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  DELIVERED = 'delivered',
}

@Entity({ tableName: 'document_templates' })
export class DocumentTemplateEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Enum({ items: () => DocumentTemplateType, type: 'string', length: 30 })
  template_type!: DocumentTemplateType

  @Property({ type: 'text', length: 200 })
  title!: string

  @Property({ type: 'text' })
  body_template!: string

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

@Entity({ tableName: 'generated_documents' })
export class GeneratedDocumentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  template_id!: string

  @Property({ type: 'uuid' })
  student_id!: string

  @Property({ type: 'uuid', nullable: true })
  requested_by?: string | null

  @Property({ type: 'uuid', nullable: true })
  pdf_attachment_id?: string | null

  @Enum({ items: () => GeneratedDocStatus, type: 'string', length: 15, default: GeneratedDocStatus.PENDING })
  status: GeneratedDocStatus = GeneratedDocStatus.PENDING

  @Property({ type: 'timestamptz', nullable: true })
  generated_at?: Date | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
