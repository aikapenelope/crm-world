import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092603_school_comms extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "announcement_reads" ("id" uuid not null, "tenant_id" text not null, "announcement_id" uuid not null, "contact_id" uuid not null, "read_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "school_announcements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "title" text not null, "body" text not null, "announcement_type" text not null, "target_audience" text not null default 'all', "target_grades" jsonb null, "target_sections" jsonb null, "published_at" timestamptz null, "expires_at" timestamptz null, "created_by" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "school_announcements" add constraint "school_announcements_announcement_type_check" check ("announcement_type" in ('circular', 'notice', 'reminder', 'emergency'));`);
    this.addSql(`alter table "school_announcements" add constraint "school_announcements_target_audience_check" check ("target_audience" in ('all', 'grade_specific', 'section_specific'));`);
  }

}
