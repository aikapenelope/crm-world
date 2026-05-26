import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092604_transactions extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "property_transactions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "property_id" uuid not null, "contact_id" uuid null, "transaction_type" text not null, "status" text not null default 'pending', "closing_date" timestamptz null, "sale_price" numeric(18,2) not null, "currency" text not null default 'USD', "sale_price_ves" numeric(18,2) null, "exchange_rate" numeric(18,8) null, "commission_rate" numeric(5,2) not null default '5.00', "commission_amount" numeric(18,2) null, "commission_currency" text null, "payment_method_code" text null, "payment_record_id" uuid null, "monthly_rent" numeric(18,2) null, "lease_start" timestamptz null, "lease_end" timestamptz null, "lease_months" smallint null, "listing_agent_id" uuid null, "buyer_agent_id" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "property_transactions" add constraint "property_transactions_transaction_type_check" check ("transaction_type" in ('sale', 'lease'));`);
    this.addSql(`alter table "property_transactions" add constraint "property_transactions_status_check" check ("status" in ('pending', 'completed', 'cancelled'));`);
  }

}
