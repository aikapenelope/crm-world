import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092552_bank_reconciliation extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "bank_statements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "bank_code" text not null, "bank_name" text not null, "account_number" text null, "filename" text not null, "period_month" text not null, "total_transactions" int not null default 0, "matched_count" int not null default 0, "unmatched_count" int not null default 0, "uploaded_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "bank_transactions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "statement_id" uuid not null, "transaction_date" date not null, "description" text null, "reference" text null, "direction" text not null, "amount" numeric(18,2) not null, "currency" text not null default 'VES', "balance" numeric(18,2) null, "reconciliation_status" text not null default 'pending', "matched_payment_id" uuid null, "match_notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "bank_transactions" add constraint "bank_transactions_direction_check" check ("direction" in ('credit', 'debit'));`);
    this.addSql(`alter table "bank_transactions" add constraint "bank_transactions_reconciliation_status_check" check ("reconciliation_status" in ('pending', 'matched', 'unmatched', 'ignored'));`);
  }

}
