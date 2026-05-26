import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092601_mfg_subcontract extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_subcontract_materials" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "subcontract_order_id" uuid not null, "material_id" uuid not null, "material_code" text not null, "material_name" text not null, "quantity_sent" numeric(14,4) not null, "uom" text not null, "unit_cost_usd" numeric(12,6) null, "quantity_expected_back" numeric(14,4) null, "quantity_returned" numeric(14,4) not null default '0.0000', "lot_id" uuid null, "lot_number" text null, "sent_date" date null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_subcontract_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_number" text not null, "subcontractor_id" uuid null, "subcontractor_name" text not null, "product_id" uuid not null, "product_code" text not null, "product_name" text not null, "quantity_ordered" numeric(12,4) not null, "quantity_received" numeric(12,4) not null default '0.0000', "uom" text not null, "price_per_unit_usd" numeric(12,6) not null, "total_maquila_fee_usd" numeric(14,2) not null default '0.00', "status" text not null default 'draft', "scheduled_delivery" date null, "actual_delivery" date null, "standard_scrap_pct" numeric(5,2) not null default '0.00', "actual_scrap_pct" numeric(5,2) null, "scrap_exceeded" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
