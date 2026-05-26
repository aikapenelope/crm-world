import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092556_isp_billing extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_billing_cycles" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "billing_day" smallint not null, "segment" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_invoices" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "subscriber_id" uuid not null, "invoice_number" text not null, "control_number" text null, "period_month" text not null, "issue_date" date not null, "due_date" date not null, "status" text not null default 'pending', "base_amount_usd" numeric(10,2) not null, "addons_amount_usd" numeric(10,2) not null default '0.00', "discount_amount_usd" numeric(10,2) not null default '0.00', "subtotal_usd" numeric(10,2) not null, "iva_rate" numeric(5,2) not null default '16.00', "iva_amount_ves" numeric(18,2) null, "bcv_rate" numeric(18,4) null, "total_usd" numeric(10,2) not null, "total_ves" numeric(18,2) null, "paid_amount_usd" numeric(10,2) not null default '0.00', "balance_usd" numeric(10,2) not null, "paid_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "isp_payments" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "invoice_id" uuid not null, "subscriber_id" uuid not null, "payment_date" date not null, "amount_usd" numeric(10,2) not null, "currency" text not null default 'USD', "payment_method" text not null, "reference_number" text null, "igtf_applies" boolean not null default false, "igtf_amount_usd" numeric(10,2) not null default '0.00', "bcv_rate_at_payment" numeric(18,4) null, "amount_ves" numeric(18,2) null, "confirmed_by" uuid null, "confirmed_at" timestamptz null, "photo_receipt_url" text null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
