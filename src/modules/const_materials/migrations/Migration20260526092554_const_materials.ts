import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092554_const_materials extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_material_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "order_number" text not null, "supplier_name" text not null, "supplier_rif" text null, "status" text not null, "order_date" date not null, "expected_delivery" date null, "total_amount" numeric(18,2) not null default '0.00', "currency" text not null default 'USD', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_material_orders" add constraint "const_material_orders_status_check" check ("status" in ('draft', 'sent', 'confirmed', 'partial_received', 'received', 'cancelled'));`);

    this.addSql(`create table "const_material_order_lines" ("id" uuid not null, "order_id" uuid not null, "budget_item_id" uuid null, "material_name" text not null, "unit" text not null, "ordered_quantity" numeric(14,4) not null, "received_quantity" numeric(14,4) not null default '0.0000', "unit_price" numeric(18,4) not null, "total_price" numeric(18,2) not null, primary key ("id"));`);

    this.addSql(`create table "const_material_stock" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "material_name" text not null, "unit" text not null, "budget_quantity" numeric(14,4) not null default '0.0000', "ordered_quantity" numeric(14,4) not null default '0.0000', "received_quantity" numeric(14,4) not null default '0.0000', "consumed_quantity" numeric(14,4) not null default '0.0000', "unit_cost" numeric(18,4) not null default '0.0000', "currency" text not null default 'USD', "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
