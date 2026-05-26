import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_enrollments extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_enrollments" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "enrollment_number" text not null, "group_id" uuid not null, "student_name" text not null, "student_email" text null, "student_phone" text null, "enrollment_date" date not null, "status" text not null default 'pending_payment', "completion_date" date null, "final_grade" text null, "certificate_id" uuid null, "price_agreed" numeric(18,2) not null, "currency" text not null default 'USD', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "academy_enrollments" add constraint "academy_enrollments_status_check" check ("status" in ('pending_payment', 'active', 'completed', 'withdrawn', 'failed'));`);
  }

}
