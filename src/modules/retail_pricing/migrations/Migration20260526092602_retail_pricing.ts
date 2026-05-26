import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092602_retail_pricing extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_bulk_price_updates" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "update_type" text not null, "old_exchange_rate" numeric(18,4) null, "new_exchange_rate" numeric(18,4) null, "percentage_change" numeric(5,2) null, "category_id" uuid null, "channel" text null, "products_affected" int not null default 0, "executed_by" uuid null, "executed_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_bulk_price_updates" add constraint "retail_bulk_price_updates_channel_check" check ("channel" in ('store', 'online', 'wholesale'));`);

    this.addSql(`create table "retail_channel_prices" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "variant_id" uuid null, "channel" text not null, "price" numeric(18,4) not null, "currency" text not null default 'USD', "cost" numeric(18,4) null, "actual_margin_percent" numeric(5,2) null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_channel_prices" add constraint "retail_channel_prices_channel_check" check ("channel" in ('store', 'online', 'wholesale'));`);

    this.addSql(`create table "retail_price_alerts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "variant_id" uuid null, "alert_type" text not null, "status" text not null default 'active', "current_price" numeric(18,4) null, "cost" numeric(18,4) null, "current_margin" numeric(5,2) null, "min_margin_required" numeric(5,2) null, "message" text null, "acknowledged_by" uuid null, "acknowledged_at" timestamptz null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_price_alerts" add constraint "retail_price_alerts_alert_type_check" check ("alert_type" in ('below_cost', 'below_margin', 'above_regulated', 'exchange_rate_drift'));`);
    this.addSql(`alter table "retail_price_alerts" add constraint "retail_price_alerts_status_check" check ("status" in ('active', 'acknowledged', 'resolved'));`);

    this.addSql(`create table "retail_pricing_rules" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "category_id" uuid null, "min_margin_percent" numeric(5,2) not null, "target_margin_percent" numeric(5,2) null, "channel" text null, "max_regulated_price" numeric(18,2) null, "currency" text not null default 'USD', "is_active" boolean not null default true, "priority" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_pricing_rules" add constraint "retail_pricing_rules_channel_check" check ("channel" in ('store', 'online', 'wholesale'));`);
  }

}
