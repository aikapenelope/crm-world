import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092601_payment_methods extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "payment_methods" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "code" text not null, "name" text not null, "currency" text not null, "requires_reference" boolean not null default false, "reference_label" text null, "instructions" text null, "icon" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "payment_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "payment_method_code" text not null, "amount" numeric(18,4) not null, "currency" text not null, "amount_usd" numeric(18,4) null, "exchange_rate" numeric(18,8) null, "reference" text null, "notes" text null, "reference_type" text null, "reference_id" uuid null, "status" text not null default 'pending', "confirmed_by" uuid null, "confirmed_at" timestamptz null, "payment_date" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
