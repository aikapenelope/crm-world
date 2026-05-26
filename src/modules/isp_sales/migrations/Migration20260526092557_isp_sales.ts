import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_sales extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_commissions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "agent_id" uuid not null, "subscriber_id" uuid not null, "commission_type" text not null, "amount_usd" numeric(8,2) not null, "period_month" text null, "status" text not null default 'pending', "paid_at" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_coverage_zones" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "city" text not null, "node_id" uuid not null, "has_coverage" boolean not null default true, "technology_available" text not null default 'wireless', "max_speed_mbps" int null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_leads" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "phone" text not null, "email" text null, "address" text not null, "city" text not null, "source" text not null default 'whatsapp', "referral_subscriber_id" uuid null, "status" text not null default 'new', "coverage_status" text null, "coverage_zone_id" uuid null, "interested_plan_id" uuid null, "quote_sent_at" timestamptz null, "installation_date" date null, "assigned_agent_id" uuid null, "lost_reason" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
