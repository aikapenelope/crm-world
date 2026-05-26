import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092600_mfg_planning extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_capacity_loads" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "work_center_id" uuid not null, "work_center_code" text not null, "work_center_name" text not null, "week_start" date not null, "available_hrs" numeric(8,4) not null, "loaded_hrs" numeric(8,4) not null default '0.0000', "utilization_pct" numeric(6,2) not null default '0.00', "overloaded" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_energy_windows" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "zone" text not null, "day_of_week" smallint not null, "hour_start" smallint not null, "hour_end" smallint not null, "restriction_type" text not null default 'restriction', "reliability_pct" numeric(5,2) not null default '80.00', "is_active" boolean not null default true, "valid_from" date null, "valid_until" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_master_schedule" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "schedule_number" text not null, "week_start" date not null, "week_end" date not null, "product_id" uuid not null, "product_code" text not null, "product_name" text not null, "work_center_id" uuid null, "work_center_name" text null, "planned_quantity" numeric(12,4) not null, "uom" text not null, "planned_start" timestamptz null, "planned_end" timestamptz null, "status" text not null default 'planned', "production_order_id" uuid null, "priority" int not null default 50, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
