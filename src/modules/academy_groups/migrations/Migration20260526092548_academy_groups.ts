import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_groups extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_groups" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "group_code" text not null, "course_id" uuid not null, "instructor_id" uuid null, "start_date" date not null, "end_date" date not null, "schedule_days" jsonb not null, "schedule_time" text not null, "session_duration_minutes" int not null default 90, "location" text null, "online_link" text null, "status" text not null default 'scheduled', "max_students" int not null default 20, "enrolled_count" int not null default 0, "sessions_count" int not null default 0, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "academy_groups" add constraint "academy_groups_status_check" check ("status" in ('scheduled', 'in_progress', 'completed', 'cancelled'));`);
  }

}
