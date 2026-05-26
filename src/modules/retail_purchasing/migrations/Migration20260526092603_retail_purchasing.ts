import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092603_retail_purchasing extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_accounts_payable" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "supplier_id" uuid not null, "document_number" text null, "purchase_order_id" uuid null, "amount" numeric(18,2) not null, "amount_paid" numeric(18,2) not null default '0.00', "balance" numeric(18,2) not null, "currency" text not null default 'USD', "status" text not null default 'pending', "due_date" date not null, "paid_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_accounts_payable" add constraint "retail_accounts_payable_status_check" check ("status" in ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled'));`);

    this.addSql(`create table "retail_purchase_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_number" text not null, "supplier_id" uuid not null, "status" text not null default 'draft', "origin" text not null default 'manual', "currency" text not null default 'USD', "exchange_rate" numeric(18,4) null, "subtotal" numeric(18,2) not null default '0.00', "tax_amount" numeric(18,2) not null default '0.00', "total" numeric(18,2) not null default '0.00', "expected_delivery_date" date null, "sent_at" timestamptz null, "received_at" timestamptz null, "branch_id" uuid null, "notes" text null, "created_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_purchase_orders" add constraint "retail_purchase_orders_status_check" check ("status" in ('draft', 'sent', 'partially_received', 'received', 'cancelled'));`);
    this.addSql(`alter table "retail_purchase_orders" add constraint "retail_purchase_orders_origin_check" check ("origin" in ('manual', 'auto_reorder'));`);

    this.addSql(`create table "retail_purchase_order_lines" ("id" uuid not null, "order_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "quantity_ordered" int not null, "quantity_received" int not null default 0, "unit_cost" numeric(18,4) not null, "line_total" numeric(18,2) not null, "notes" text null, primary key ("id"));`);

    this.addSql(`create table "retail_suppliers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "rif" text null, "contact_name" text null, "phone" text null, "email" text null, "address" text null, "default_payment_days" smallint not null default 30, "currency" text not null default 'USD', "category_ids" jsonb null, "notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "retail_supplier_notes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "note_number" text not null, "supplier_id" uuid not null, "type" text not null, "amount" numeric(18,2) not null, "currency" text not null default 'USD', "reason" text null, "purchase_order_id" uuid null, "payable_id" uuid null, "is_applied" boolean not null default false, "applied_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_supplier_notes" add constraint "retail_supplier_notes_type_check" check ("type" in ('debit', 'credit'));`);
  }

}
