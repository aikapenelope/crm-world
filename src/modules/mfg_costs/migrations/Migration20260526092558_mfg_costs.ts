import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092558_mfg_costs extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_cost_centers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "code" text not null, "name" text not null, "type" text not null default 'production', "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "mfg_cost_variances" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_id" uuid not null, "order_number" text not null, "product_code" text not null, "product_name" text not null, "planned_quantity" numeric(12,4) not null, "actual_quantity" numeric(12,4) not null default '0.0000', "uom" text not null, "standard_cost_usd" numeric(14,4) not null default '0.0000', "actual_cost_usd" numeric(14,4) not null default '0.0000', "total_variance_usd" numeric(14,4) not null default '0.0000', "price_variance_usd" numeric(14,4) not null default '0.0000', "quantity_variance_usd" numeric(14,4) not null default '0.0000', "labor_variance_usd" numeric(14,4) not null default '0.0000', "status" text not null default 'pending', "calculated_at" timestamptz null, "bcv_rate_used" numeric(12,4) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_standard_costs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "product_code" text not null, "product_name" text not null, "uom" text not null, "valid_from" date not null, "valid_until" date null, "status" text not null default 'draft', "raw_material_cost_usd" numeric(14,6) not null default '0.000000', "local_material_cost_usd" numeric(14,6) not null default '0.000000', "labor_cost_usd" numeric(14,6) not null default '0.000000', "overhead_cost_usd" numeric(14,6) not null default '0.000000', "total_standard_cost_usd" numeric(14,6) not null default '0.000000', "bcv_rate_used" numeric(12,4) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
