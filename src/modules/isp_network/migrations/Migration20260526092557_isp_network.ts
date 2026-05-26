import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_network extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_cpe_deployments" ("id" uuid not null, "tenant_id" text not null, "cpe_id" uuid not null, "subscriber_id" uuid not null, "installed_at" timestamptz not null, "installed_by" uuid null, "uninstalled_at" timestamptz null, "uninstall_condition" text null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_cpe_inventory" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "cpe_type" text not null, "brand" text not null, "model" text not null, "serial_number" text not null, "mac_address" text null, "status" text not null default 'in_stock', "purchase_price_usd" numeric(10,2) null, "purchase_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "isp_network_nodes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "node_type" text not null, "status" text not null default 'active', "city" text not null, "address" text null, "coordinates_lat" numeric(10,7) null, "coordinates_lng" numeric(10,7) null, "total_capacity_mbps" int null, "used_capacity_mbps" int null, "total_ports" smallint null, "used_ports" smallint null, "equipment_model" text null, "equipment_serial" text null, "power_provider" text null, "has_generator" boolean not null default false, "battery_hours" smallint null, "parent_node_id" uuid null, "monitoring_host" text null, "last_outage_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "isp_network_segments" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "node_from_id" uuid not null, "node_to_id" uuid not null, "segment_type" text not null, "distance_km" numeric(8,2) null, "capacity_mbps" int null, "status" text not null default 'active', "installation_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
