import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092602_retail_loyalty extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_campaigns" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "type" text not null, "status" text not null default 'draft', "target_segment" text not null default 'all', "target_tier_id" uuid null, "target_days_inactive" int null, "config" jsonb null, "starts_at" timestamptz not null, "ends_at" timestamptz null, "total_recipients" int not null default 0, "total_redeemed" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_campaigns" add constraint "retail_campaigns_type_check" check ("type" in ('points_multiplier', 'bonus_points', 'discount', 'whatsapp_blast'));`);
    this.addSql(`alter table "retail_campaigns" add constraint "retail_campaigns_status_check" check ("status" in ('draft', 'scheduled', 'active', 'completed', 'cancelled'));`);
    this.addSql(`alter table "retail_campaigns" add constraint "retail_campaigns_target_segment_check" check ("target_segment" in ('all', 'tier', 'inactive', 'birthday', 'custom'));`);

    this.addSql(`create table "retail_loyalty_accounts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_id" uuid not null, "program_id" uuid not null, "current_points" int not null default 0, "lifetime_points" int not null default 0, "tier_id" uuid null, "last_activity_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "retail_loyalty_programs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "is_active" boolean not null default true, "points_per_usd" numeric(10,2) not null default '10.00', "points_currency" text not null default 'USD', "min_redemption_points" int not null default 100, "point_value_usd" numeric(10,4) not null default '0.0100', "expiration_days" int null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "retail_loyalty_tiers" ("id" uuid not null, "program_id" uuid not null, "name" text not null, "min_points_lifetime" int not null, "discount_percent" numeric(5,2) not null default '0.00', "multiplier" numeric(4,2) not null default '1.00', "benefits" jsonb null, "sort_order" int not null default 0, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "retail_loyalty_transactions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "account_id" uuid not null, "type" text not null, "points" int not null, "balance_after" int not null, "reference_type" text not null default 'manual', "reference_id" uuid null, "description" text null, "expires_at" timestamptz null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_loyalty_transactions" add constraint "retail_loyalty_transactions_type_check" check ("type" in ('earn', 'redeem', 'expire', 'adjust', 'bonus'));`);
    this.addSql(`alter table "retail_loyalty_transactions" add constraint "retail_loyalty_transactions_reference_type_check" check ("reference_type" in ('sale', 'return', 'manual', 'campaign', 'expiration'));`);
  }

}
