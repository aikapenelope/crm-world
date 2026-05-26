import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092604_school_docs extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "document_templates" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "template_type" text not null, "title" text not null, "body_template" text not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "document_templates" add constraint "document_templates_template_type_check" check ("template_type" in ('constancia_estudio', 'constancia_inscripcion', 'constancia_notas', 'constancia_conducta', 'carta_recomendacion'));`);

    this.addSql(`create table "generated_documents" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "template_id" uuid not null, "student_id" uuid not null, "requested_by" uuid null, "pdf_attachment_id" uuid null, "status" text not null default 'pending', "generated_at" timestamptz null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "generated_documents" add constraint "generated_documents_status_check" check ("status" in ('pending', 'generated', 'delivered'));`);
  }

}
