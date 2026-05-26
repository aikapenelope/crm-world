import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_attendance extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "attendance_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "date" date not null, "status" text not null, "excuse_reason" text null, "excuse_attachment_id" uuid null, "recorded_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "attendance_records" add constraint "attendance_records_status_check" check ("status" in ('present', 'absent', 'late', 'excused', 'half_day'));`);

    this.addSql(`create table "attendance_summary" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "month" text not null, "days_present" smallint not null default 0, "days_absent" smallint not null default 0, "days_late" smallint not null default 0, "days_excused" smallint not null default 0, "attendance_percentage" numeric(5,2) not null default '0.00', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
