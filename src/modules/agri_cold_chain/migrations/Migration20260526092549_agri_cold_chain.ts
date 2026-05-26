import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092549_agri_cold_chain extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_cold_storage_units" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "unit_type" text not null default 'chill_room', "target_temp_min" numeric(5,1) not null, "target_temp_max" numeric(5,1) not null, "capacity_tons" numeric(8,2) null, "sensor_id" text null, "min_alert_minutes" smallint not null default 15, "alert_contact_id" uuid null, "alert_phone" text null, "status" text not null default 'active', "location_description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_storage_lot_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "processing_lot_id" uuid not null, "cold_storage_unit_id" uuid not null, "entered_at" timestamptz not null, "exited_at" timestamptz null, "entry_temp_c" numeric(6,2) null, "exit_temp_c" numeric(6,2) null, "non_conformity_id" uuid null, "status" text not null default 'active', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_temperature_logs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "cold_storage_unit_id" uuid not null, "temperature_c" numeric(6,2) not null, "humidity_pct" numeric(5,1) null, "recorded_at" timestamptz not null, "is_excursion" boolean not null default false, "source" text not null default 'sensor_push', "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_agri_temp_logs_unit_time" on "agri_temperature_logs" ("tenant_id", "cold_storage_unit_id", "recorded_at");`);
  }

}
