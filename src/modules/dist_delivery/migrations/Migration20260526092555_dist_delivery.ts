import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092555_dist_delivery extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_delivery_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "delivery_order_id" uuid not null, "sales_order_id" uuid not null, "customer_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "quantity_dispatched" int not null, "quantity_delivered" int not null default 0, "quantity_returned" int not null default 0, "status" text not null default 'pending', "delivery_notes" text null, "confirmed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "dist_delivery_items" add constraint "dist_delivery_items_status_check" check ("status" in ('pending', 'delivered', 'partial', 'returned', 'rejected'));`);

    this.addSql(`create table "dist_delivery_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "route_id" uuid null, "driver_id" uuid null, "vehicle_plate" text null, "dispatch_date" date not null, "status" text not null default 'preparing', "total_items" int not null default 0, "delivered_items" int not null default 0, "returned_items" int not null default 0, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "dist_delivery_orders" add constraint "dist_delivery_orders_status_check" check ("status" in ('preparing', 'dispatched', 'in_transit', 'completed', 'partial'));`);
  }

}
