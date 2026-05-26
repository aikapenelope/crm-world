import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092550_agri_processing extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_processing_formulas" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "product_type" text not null default 'cuts', "parts_used" jsonb not null, "additives" jsonb null, "expected_yield_pct" numeric(5,2) not null, "processing_cost_per_kg_usd" numeric(8,4) null, "shelf_life_days" int null, "storage_temp_min" numeric(5,1) null, "storage_temp_max" numeric(5,1) null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_processing_lots" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "lot_number" text not null, "slaughter_batch_id" uuid not null, "formula_id" uuid not null, "processing_date" date not null, "quantity_kg" numeric(10,2) not null, "unit_count" int null, "package_weight_g" int null, "barcode" text null, "expiry_date" date null, "status" text not null default 'in_stock', "cold_storage_unit_id" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_slaughter_batches" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "batch_number" text not null, "flock_id" uuid not null, "farm_unit_id" uuid null, "slaughter_date" date not null, "birds_in" int not null, "live_weight_kg" numeric(10,2) not null, "birds_processed" int not null, "carcass_weight_hot_kg" numeric(10,2) null, "carcass_weight_cold_kg" numeric(10,2) null, "yield_pct" numeric(5,2) null, "condemned_count" int not null default 0, "condemned_reason" text null, "microbiological_result" text not null default 'pending', "microbiological_notes" text null, "status" text not null default 'receiving', "dispatch_approved_by" uuid null, "dispatch_approved_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
