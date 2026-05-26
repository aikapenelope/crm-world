import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092603_school_calendar extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "school_events" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "title" text not null, "description" text null, "event_type" text not null, "start_date" date not null, "end_date" date not null, "applies_to_grades" jsonb null, "is_all_day" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "school_events" add constraint "school_events_event_type_check" check ("event_type" in ('class_day', 'holiday', 'exam_period', 'meeting', 'event', 'administrative', 'graduation'));`);
  }

}
