import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092556_grades extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "grade_periods" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "school_year" text not null, "period_number" smallint not null, "name" text not null, "start_date" date not null, "end_date" date not null, "is_active" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "report_cards" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "period_id" uuid not null, "average_score" numeric(5,2) null, "general_observations" text null, "teacher_name" text null, "pdf_attachment_id" uuid null, "status" text not null default 'draft', "generated_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "report_cards" add constraint "report_cards_status_check" check ("status" in ('draft', 'published', 'delivered'));`);

    this.addSql(`create table "student_grades" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "subject_id" uuid not null, "period_id" uuid not null, "score" numeric(5,2) null, "qualitative_score" text null, "observations" text null, "recorded_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "subjects" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "grade_levels" jsonb null, "is_qualitative" boolean not null default false, "sort_order" smallint not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
