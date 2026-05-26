import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092552_condo_accounting extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_accounting_entries" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "entry_type" text not null, "category" text not null, "description" text not null, "amount" numeric(18,2) not null, "currency" text not null default 'USD', "exchange_rate" numeric(18,4) null, "reference_type" text null, "reference_id" uuid null, "entry_date" date not null, "period_month" text not null, "supplier_name" text null, "document_number" text null, "is_reserve_fund" boolean not null default false, "notes" text null, "recorded_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_accounting_entries" add constraint "condo_accounting_entries_entry_type_check" check ("entry_type" in ('income', 'expense'));`);
    this.addSql(`alter table "condo_accounting_entries" add constraint "condo_accounting_entries_category_check" check ("category" in ('condo_fee', 'extraordinary', 'reserve_fund', 'maintenance', 'utilities', 'payroll', 'insurance', 'legal', 'other'));`);

    this.addSql(`create table "condo_budgets" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "year" int not null, "status" text not null, "total_income" numeric(18,2) not null, "total_expenses" numeric(18,2) not null, "reserve_fund_percent" numeric(5,2) not null default '10.00', "currency" text not null default 'USD', "approved_in_assembly" boolean not null default false, "assembly_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_budgets" add constraint "condo_budgets_status_check" check ("status" in ('draft', 'approved', 'active', 'closed'));`);

    this.addSql(`create table "condo_reserve_fund" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "period_month" text not null, "opening_balance" numeric(18,2) not null, "contributions" numeric(18,2) not null default '0.00', "withdrawals" numeric(18,2) not null default '0.00', "closing_balance" numeric(18,2) not null, "currency" text not null default 'USD', "min_required" numeric(18,2) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
