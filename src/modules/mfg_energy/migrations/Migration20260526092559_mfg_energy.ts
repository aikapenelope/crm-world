import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092559_mfg_energy extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_energy_consumption" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "work_center_id" uuid null, "work_center_code" text not null, "work_center_name" text not null, "production_order_id" uuid null, "record_date" date not null, "shift_type" text not null, "kwh_consumed" numeric(12,4) not null, "kwh_planned" numeric(12,4) null, "duration_hrs" numeric(6,2) not null default '8.00', "cost_per_kwh_usd" numeric(8,6) null, "total_energy_cost_usd" numeric(12,4) null, "energy_source" text not null default 'grid', "generator_hrs" numeric(6,2) not null default '0.00', "generator_fuel_cost_usd" numeric(10,2) null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_energy_costs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "production_order_id" uuid not null, "order_number" text not null, "product_code" text not null, "actual_quantity" numeric(12,4) not null, "uom" text not null, "total_kwh" numeric(12,4) not null default '0.0000', "grid_kwh" numeric(12,4) not null default '0.0000', "generator_kwh" numeric(12,4) not null default '0.0000', "total_energy_cost_usd" numeric(12,4) not null default '0.0000', "energy_cost_per_unit_usd" numeric(12,8) not null default '0.00000000', "grid_cost_usd" numeric(12,4) not null default '0.0000', "generator_cost_usd" numeric(12,4) not null default '0.0000', "generator_premium_usd" numeric(12,4) not null default '0.0000', "period_start" date not null, "period_end" date not null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_power_outages" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "started_at" timestamptz not null, "ended_at" timestamptz null, "duration_hrs" numeric(8,4) null, "outage_type" text not null default 'unscheduled_cut', "zone" text null, "reported_by" uuid null, "impact_production_hrs_lost" numeric(8,4) null, "products_affected" text null, "used_generator" boolean not null default false, "generator_fuel_liters" numeric(8,2) null, "fuel_cost_usd" numeric(10,2) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
