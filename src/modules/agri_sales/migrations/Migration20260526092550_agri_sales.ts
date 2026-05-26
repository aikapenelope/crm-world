import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092550_agri_sales extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_sale_dispatches" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "dispatch_number" text not null, "sale_order_id" uuid not null, "dispatch_date" date not null, "vehicle_plate" text null, "driver_name" text null, "loading_temp_c" numeric(5,1) null, "delivery_temp_c" numeric(5,1) null, "items" jsonb not null, "total_weight_kg" numeric(10,2) not null, "status" text not null default 'pending', "client_received" boolean not null default false, "delivered_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_sale_invoices" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "invoice_number" text not null, "control_number" text null, "sale_order_id" uuid not null, "customer_id" uuid not null, "issue_date" date not null, "due_date" date not null, "subtotal_usd" numeric(12,2) not null, "iva_rate" numeric(5,2) not null default '16.00', "iva_amount_ves" numeric(18,2) null, "bcv_rate" numeric(18,4) null, "total_usd" numeric(12,2) not null, "igtf_amount_usd" numeric(10,2) not null default '0.00', "paid_amount_usd" numeric(12,2) not null default '0.00', "status" text not null default 'pending', "paid_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_sale_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_number" text not null, "customer_id" uuid not null, "order_date" date not null, "requested_delivery_date" date null, "items" jsonb not null, "subtotal_usd" numeric(12,2) not null, "discount_usd" numeric(12,2) not null default '0.00', "iva_rate" numeric(5,2) not null default '16.00', "iva_amount_ves" numeric(18,2) null, "bcv_rate" numeric(18,4) null, "total_usd" numeric(12,2) not null, "total_ves" numeric(18,2) null, "status" text not null default 'draft', "payment_terms" text null, "required_transport_temp" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
