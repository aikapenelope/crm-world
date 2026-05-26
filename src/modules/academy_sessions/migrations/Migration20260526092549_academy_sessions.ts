import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092549_academy_sessions extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_sessions" ("id" uuid not null, "group_id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "session_number" int not null, "session_date" date not null, "start_time" text not null, "end_time" text not null, "topic" text null, "session_type" text not null default 'theory', "status" text not null default 'scheduled', "instructor_notes" text null, "attendance_count" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "academy_sessions" add constraint "academy_sessions_session_type_check" check ("session_type" in ('theory', 'practice', 'exam', 'orientation', 'makeup'));`);
    this.addSql(`alter table "academy_sessions" add constraint "academy_sessions_status_check" check ("status" in ('scheduled', 'completed', 'cancelled'));`);
  }

}
