import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092555_dist_inventory extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_inventory_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "variant_id" uuid null, "warehouse_code" text not null default 'main', "quantity_available" int not null default 0, "quantity_committed" int not null default 0, "quantity_in_transit" int not null default 0, "reorder_point" int not null default 0, "reorder_quantity" int not null default 0, "unit_cost" numeric(18,4) not null default '0.0000', "currency" text not null default 'USD', "last_count_date" date null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "dist_inventory_movements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "variant_id" uuid null, "warehouse_code" text not null default 'main', "type" text not null, "quantity" int not null, "reference_type" text not null default 'manual', "reference_id" uuid null, "unit_cost" numeric(18,4) null, "notes" text null, "performed_by" uuid null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "dist_inventory_movements" add constraint "dist_inventory_movements_type_check" check ("type" in ('purchase_in', 'sale_out', 'return_in', 'adjustment', 'transfer', 'count'));`);
    this.addSql(`alter table "dist_inventory_movements" add constraint "dist_inventory_movements_reference_type_check" check ("reference_type" in ('sales_order', 'purchase_order', 'return', 'manual'));`);
  }

}
