import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_attendance extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_attendance" ("id" uuid not null, "session_id" uuid not null, "enrollment_id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "status" text not null default 'present', "notes" text null, "recorded_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "academy_attendance" add constraint "academy_attendance_status_check" check ("status" in ('present', 'absent', 'late', 'excused'));`);
  }

}
