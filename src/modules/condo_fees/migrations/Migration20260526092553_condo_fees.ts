import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_condo_fees extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_fee_configs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "name" text not null, "fee_type" text not null, "period_month" text not null, "base_amount" numeric(18,2) not null, "currency" text not null default 'USD', "distribution_method" text not null, "due_date" date not null, "late_fee_percent" numeric(5,2) not null default '0.00', "late_fee_days" int not null default 15, "approved_in_assembly" boolean not null default false, "assembly_date" date null, "notes" text null, "status" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_fee_configs" add constraint "condo_fee_configs_fee_type_check" check ("fee_type" in ('ordinary', 'extraordinary', 'special'));`);
    this.addSql(`alter table "condo_fee_configs" add constraint "condo_fee_configs_distribution_method_check" check ("distribution_method" in ('aliquot', 'equal', 'custom'));`);
    this.addSql(`alter table "condo_fee_configs" add constraint "condo_fee_configs_status_check" check ("status" in ('draft', 'approved', 'generated', 'closed'));`);

    this.addSql(`create table "condo_receipts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "fee_config_id" uuid not null, "building_id" uuid not null, "unit_id" uuid not null, "receipt_number" text not null, "period_month" text not null, "owner_name" text not null, "unit_number" text not null, "aliquot_percent" numeric(8,5) not null, "amount_usd" numeric(18,2) not null, "amount_ves" numeric(18,2) null, "exchange_rate" numeric(18,4) null, "late_fee_amount" numeric(18,2) not null default '0.00', "total_amount" numeric(18,2) not null, "status" text not null, "paid_amount" numeric(18,2) not null default '0.00', "paid_at" timestamptz null, "payment_method" text null, "payment_reference" text null, "due_date" date not null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_receipts" add constraint "condo_receipts_status_check" check ("status" in ('pending', 'partial', 'paid', 'overdue', 'cancelled'));`);

    this.addSql(`create table "condo_receipt_lines" ("id" uuid not null, "receipt_id" uuid not null, "concept" text not null, "amount" numeric(18,2) not null, "is_common_expense" boolean not null default true, primary key ("id"));`);
  }

}
