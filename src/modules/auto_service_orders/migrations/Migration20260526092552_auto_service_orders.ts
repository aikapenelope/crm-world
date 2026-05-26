import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092552_auto_service_orders extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "auto_service_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_number" text not null, "vehicle_id" uuid not null, "customer_id" uuid not null, "status" text not null default 'received', "received_at" timestamptz not null, "km_at_entry" int not null default 0, "customer_complaint" text null, "diagnosis_notes" text null, "assigned_technician_id" uuid null, "estimated_completion" timestamptz null, "actual_completion" timestamptz null, "priority" text not null default 'normal', "total_labor" numeric(18,2) not null default '0.00', "total_parts" numeric(18,2) not null default '0.00', "total_amount" numeric(18,2) not null default '0.00', "currency" text not null default 'USD', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "auto_service_orders" add constraint "auto_service_orders_status_check" check ("status" in ('received', 'diagnosis', 'estimate_sent', 'approved', 'in_repair', 'quality_check', 'ready', 'delivered', 'cancelled'));`);
    this.addSql(`alter table "auto_service_orders" add constraint "auto_service_orders_priority_check" check ("priority" in ('low', 'normal', 'high', 'urgent'));`);

    this.addSql(`create table "auto_service_order_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "service_order_id" uuid not null, "type" text not null, "description" text not null, "quantity" int not null default 1, "unit_price" numeric(18,2) not null, "total_price" numeric(18,2) not null, "part_id" uuid null, "is_approved" boolean not null default true, "technician_notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_service_order_items" add constraint "auto_service_order_items_type_check" check ("type" in ('labor', 'part'));`);
  }

}
