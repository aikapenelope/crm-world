import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_plans extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_plan_addons" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "description" text null, "monthly_price_usd" numeric(10,2) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_service_plans" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "description" text null, "technology" text not null default 'wireless', "download_mbps" int not null, "upload_mbps" int not null, "is_symmetric" boolean not null default false, "monthly_price_usd" numeric(10,2) not null, "installation_fee_usd" numeric(10,2) not null default '0.00', "target_segment" text not null default 'residential', "radius_profile" text null, "olt_profile" text null, "is_active" boolean not null default true, "is_promotional" boolean not null default false, "promotional_until" date null, "sort_order" smallint not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
