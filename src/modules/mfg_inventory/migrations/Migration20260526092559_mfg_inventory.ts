import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092559_mfg_inventory extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_cycle_counts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "count_number" text not null, "location_id" uuid null, "material_type_filter" text null, "scheduled_date" date not null, "completed_date" date null, "status" text not null default 'planned', "counted_by" uuid null, "approved_by" uuid null, "total_discrepancies" int not null default 0, "total_discrepancy_value_usd" numeric(12,2) not null default '0.00', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_stock_lots" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "material_id" uuid not null, "material_code" text not null, "material_name" text not null, "material_type" text not null default 'raw_material', "lot_number" text not null, "supplier_lot_number" text null, "location_id" uuid null, "quantity" numeric(14,4) not null default '0.0000', "uom" text not null, "unit_cost_usd" numeric(14,6) null, "status" text not null default 'quarantine', "expiry_date" date null, "entry_date" date not null, "qc_inspection_id" uuid null, "production_order_id" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_mfg_stock_lots_material_status" on "mfg_stock_lots" ("tenant_id", "material_id", "status");`);

    this.addSql(`create table "mfg_stock_movements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "lot_id" uuid not null, "movement_type" text not null, "quantity" numeric(14,4) not null, "from_location_id" uuid null, "to_location_id" uuid null, "reference_type" text null, "reference_id" uuid null, "reason" text null, "performed_by" uuid null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_warehouse_locations" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "code" text not null, "name" text not null, "warehouse_type" text not null default 'raw_material', "storage_conditions" text not null default 'ambient', "capacity_kg" numeric(10,2) null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
