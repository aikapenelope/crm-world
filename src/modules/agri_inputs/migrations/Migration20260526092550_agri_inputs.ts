import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092550_agri_inputs extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_input_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "input_type" text not null, "category" text null, "unit" text not null default 'units', "insai_registry" text null, "active_ingredient" text null, "manufacturer" text null, "lot_number" text null, "expiry_date" date null, "storage_temp_min" numeric(5,1) null, "storage_temp_max" numeric(5,1) null, "quantity_available" numeric(12,3) not null default '0.000', "min_stock" numeric(12,3) not null default '0.000', "reorder_quantity" numeric(12,3) not null default '0.000', "unit_cost_usd" numeric(12,4) null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_input_movements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "input_item_id" uuid not null, "movement_type" text not null, "quantity" numeric(12,3) not null, "reference_type" text null, "reference_id" uuid null, "unit_cost_usd" numeric(12,4) null, "performed_by" uuid null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
