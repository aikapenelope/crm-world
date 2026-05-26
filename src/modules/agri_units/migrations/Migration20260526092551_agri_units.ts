import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_agri_units extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_farm_units" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "unit_type" text not null, "location_address" text null, "location_gps" text null, "area_value" numeric(12,4) null, "area_unit" text null, "ownership_type" text not null default 'own', "owner_producer_id" uuid null, "technical_manager" text null, "status" text not null default 'active', "capacity_heads" int null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_flocks" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_number" text not null, "farm_unit_id" uuid not null, "species" text not null, "genetic_line" text null, "start_date" date not null, "supplier_id" uuid null, "supplier_lot_number" text null, "initial_count" int not null, "initial_avg_weight_g" int null, "mortality_threshold_pct" numeric(5,2) not null default '0.20', "planned_end_date" date null, "actual_end_date" date null, "status" text not null default 'active', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_flock_weekly_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_id" uuid not null, "week_number" smallint not null, "record_date" date not null, "live_count" int not null, "weekly_mortality" int not null, "cumulative_mortality" int not null, "avg_body_weight_g" int not null, "weekly_feed_kg" numeric(10,2) not null, "cumulative_feed_kg" numeric(10,2) not null, "fca_accumulated" numeric(6,3) null, "iep" numeric(8,2) null, "house_temp_avg_c" numeric(5,1) null, "house_humidity_avg_pct" numeric(5,1) null, "water_consumption_liters" numeric(10,1) null, "health_observations" text null, "recorded_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_agri_weekly_flock" on "agri_flock_weekly_records" ("tenant_id", "flock_id");`);
  }

}
