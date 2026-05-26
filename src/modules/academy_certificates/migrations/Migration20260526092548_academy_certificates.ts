import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_certificates extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_certificates" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "certificate_number" text not null, "enrollment_id" uuid not null, "course_name" text not null, "group_code" text not null, "instructor_name" text not null, "student_name" text not null, "issued_at" timestamptz null, "final_grade" text null, "attendance_percent" numeric(5,1) null, "template_type" text not null default 'standard', "status" text not null default 'pending', "issued_by" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "academy_certificates" add constraint "academy_certificates_status_check" check ("status" in ('pending', 'issued', 'revoked'));`);
  }

}
