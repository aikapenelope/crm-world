import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092549_agri_field extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_crop_activities" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "crop_cycle_id" uuid not null, "activity_type" text not null, "activity_date" date not null, "inputs_used" jsonb null, "equipment_used" text null, "labor_hours" numeric(8,2) null, "labor_cost_usd" numeric(10,2) null, "inputs_cost_usd" numeric(10,2) null, "total_cost_usd" numeric(10,2) null, "performed_by" uuid null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_crop_cycles" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "field_plot_id" uuid not null, "crop_type" text not null, "crop_variety" text null, "planting_density" numeric(10,2) null, "planting_date" date not null, "expected_harvest_date" date null, "actual_harvest_date" date null, "status" text not null default 'planned', "expected_yield_tons_ha" numeric(6,3) null, "actual_yield_tons_ha" numeric(6,3) null, "actual_yield_tons" numeric(10,3) null, "cost_per_ton_usd" numeric(10,4) null, "destination" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_field_plots" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "area_hectares" numeric(10,4) not null, "soil_type" text null, "irrigation_system" text null, "location_gps" text null, "farm_unit_id" uuid null, "status" text not null default 'active', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
