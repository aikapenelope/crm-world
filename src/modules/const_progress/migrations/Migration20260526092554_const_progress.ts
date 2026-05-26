import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092554_const_progress extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_valuations" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "valuation_number" text not null, "period_from" date not null, "period_to" date not null, "status" text not null, "total_contract" numeric(18,2) not null, "previous_billed" numeric(18,2) not null default '0.00', "current_period" numeric(18,2) not null default '0.00', "retention_amount" numeric(18,2) not null default '0.00', "advance_deduction" numeric(18,2) not null default '0.00', "net_payable" numeric(18,2) not null default '0.00', "exchange_rate" numeric(18,4) null, "amount_ves" numeric(18,2) null, "currency" text not null default 'USD', "submitted_at" timestamptz null, "approved_at" timestamptz null, "approved_by" text null, "invoice_number" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_valuations" add constraint "const_valuations_status_check" check ("status" in ('draft', 'submitted', 'approved', 'invoiced', 'paid', 'rejected'));`);

    this.addSql(`create table "const_valuation_lines" ("id" uuid not null, "valuation_id" uuid not null, "budget_item_id" uuid not null, "item_number" text not null, "item_name" text not null, "unit" text null, "contracted_quantity" numeric(14,4) not null, "unit_price" numeric(18,4) not null, "previous_quantity" numeric(14,4) not null default '0.0000', "current_quantity" numeric(14,4) not null default '0.0000', "current_amount" numeric(18,2) not null default '0.00', "accumulated_percent" numeric(5,2) not null default '0.00', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
