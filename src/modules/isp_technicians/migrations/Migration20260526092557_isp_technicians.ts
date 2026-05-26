import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_technicians extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_field_technicians" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "staff_id" uuid null, "name" text not null, "phone" text not null, "status" text not null default 'available', "coverage_zone" text null, "vehicle_plate" text null, "fuel_allowance_usd" numeric(8,2) null, "commission_per_install" numeric(8,2) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "isp_work_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "work_order_number" text not null, "type" text not null, "status" text not null default 'pending', "priority" text not null default 'normal', "subscriber_id" uuid null, "ticket_id" uuid null, "technician_id" uuid null, "scheduled_date" date null, "scheduled_time" text null, "address" text not null, "coordinates_lat" numeric(10,7) null, "coordinates_lng" numeric(10,7) null, "instructions" text null, "cpe_to_install_id" uuid null, "cpe_installed_id" uuid null, "completion_notes" text null, "completed_at" timestamptz null, "km_traveled" numeric(8,2) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
