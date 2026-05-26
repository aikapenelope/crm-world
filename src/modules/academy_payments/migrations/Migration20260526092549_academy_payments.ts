import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092549_academy_payments extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_payments" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "payment_number" text not null, "enrollment_id" uuid not null, "amount" numeric(18,2) not null, "currency" text not null default 'USD', "exchange_rate" numeric(18,4) null, "amount_ves" numeric(18,2) null, "payment_method" text not null, "reference" text null, "payment_date" date not null, "status" text not null default 'confirmed', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "academy_payments" add constraint "academy_payments_status_check" check ("status" in ('pending', 'confirmed', 'cancelled'));`);
  }

}
