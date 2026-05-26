import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_const_daily extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_daily_activities" ("id" uuid not null, "report_id" uuid not null, "task_id" uuid null, "area" text not null, "description" text not null, "quantity" numeric(12,4) null, "unit" text null, "percent_complete" numeric(5,2) null, primary key ("id"));`);

    this.addSql(`create table "const_daily_labor" ("id" uuid not null, "report_id" uuid not null, "trade" text not null, "headcount" int not null, "hours_worked" numeric(5,1) not null, "contractor_name" text null, "notes" text null, primary key ("id"));`);

    this.addSql(`create table "const_daily_reports" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "report_number" text not null, "report_date" date not null, "weather" text not null, "temperature_high" int null, "temperature_low" int null, "work_hours" numeric(4,1) not null default '8.0', "status" text not null, "overall_notes" text null, "safety_incidents" int not null default 0, "safety_notes" text null, "submitted_by" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_daily_reports" add constraint "const_daily_reports_weather_check" check ("weather" in ('sunny', 'cloudy', 'rainy', 'windy', 'foggy'));`);
    this.addSql(`alter table "const_daily_reports" add constraint "const_daily_reports_status_check" check ("status" in ('draft', 'submitted', 'approved'));`);
  }

}
