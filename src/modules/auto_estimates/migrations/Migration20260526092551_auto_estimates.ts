import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_auto_estimates extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "auto_estimates" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "service_order_id" uuid not null, "vehicle_id" uuid not null, "customer_id" uuid not null, "estimate_number" text not null, "status" text not null default 'draft', "subtotal_labor" numeric(18,2) not null default '0.00', "subtotal_parts" numeric(18,2) not null default '0.00', "tax_amount" numeric(18,2) not null default '0.00', "total_amount" numeric(18,2) not null default '0.00', "currency" text not null default 'USD', "valid_until" date null, "sent_at" timestamptz null, "approved_at" timestamptz null, "customer_notes" text null, "public_link" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "auto_estimates" add constraint "auto_estimates_status_check" check ("status" in ('draft', 'sent', 'partially_approved', 'approved', 'rejected', 'expired'));`);

    this.addSql(`create table "auto_estimate_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "estimate_id" uuid not null, "type" text not null, "description" text not null, "quantity" int not null default 1, "unit_price" numeric(18,2) not null, "total_price" numeric(18,2) not null, "is_approved" boolean not null default false, "declined_reason" text null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_estimate_items" add constraint "auto_estimate_items_type_check" check ("type" in ('labor', 'part'));`);
  }

}
