import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092555_dist_credit extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_credit_limits" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_id" uuid not null, "credit_limit" numeric(18,2) not null, "currency" text not null default 'USD', "payment_terms_days" smallint not null default 30, "status" text not null default 'active', "approved_by" uuid null, "approved_at" timestamptz null, "current_balance" numeric(18,2) not null default '0.00', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "dist_credit_limits" add constraint "dist_credit_limits_status_check" check ("status" in ('active', 'suspended', 'blocked'));`);

    this.addSql(`create table "dist_credit_transactions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_id" uuid not null, "type" text not null, "reference_type" text not null, "reference_id" uuid null, "amount" numeric(18,2) not null, "currency" text not null default 'USD', "exchange_rate" numeric(18,8) null, "balance_after" numeric(18,2) not null, "due_date" date null, "description" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "dist_credit_transactions" add constraint "dist_credit_transactions_type_check" check ("type" in ('invoice', 'payment', 'credit_note', 'adjustment'));`);
    this.addSql(`alter table "dist_credit_transactions" add constraint "dist_credit_transactions_reference_type_check" check ("reference_type" in ('sales_invoice', 'sales_payment', 'sales_credit_memo', 'manual'));`);
  }

}
