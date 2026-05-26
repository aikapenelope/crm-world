import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092549_agri_feed extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_feed_allocations" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_id" uuid not null, "feed_batch_id" uuid not null, "allocated_date" date not null, "quantity_kg" numeric(10,2) not null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_feed_batches" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "batch_number" text not null, "formula_id" uuid not null, "batch_date" date not null, "quantity_tons" numeric(10,3) not null, "source_type" text not null default 'purchased', "supplier_id" uuid null, "supplier_invoice" text null, "supplier_lot_number" text null, "ingredients_used" jsonb null, "protein_result_pct" numeric(5,2) null, "moisture_result_pct" numeric(5,2) null, "aflatoxin_ppb" numeric(8,2) null, "status" text not null default 'pending_analysis', "cost_per_ton_usd" numeric(12,4) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_feed_formulas" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "formula_type" text not null, "species" text not null default 'broiler', "ingredients" jsonb not null, "protein_pct" numeric(5,2) null, "energy_kcal_kg" int null, "lysine_pct" numeric(5,3) null, "moisture_pct" numeric(5,2) null, "cost_per_ton_usd" numeric(12,4) not null default '0.0000', "last_bcv_rate" numeric(18,4) null, "last_cost_update" timestamptz null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
