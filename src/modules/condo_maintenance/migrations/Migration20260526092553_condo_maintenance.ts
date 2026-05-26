import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_condo_maintenance extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_maintenance_requests" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "request_number" text not null, "requested_by_unit_id" uuid null, "requested_by_name" text not null, "requested_by_phone" text null, "category" text not null, "priority" text not null, "title" text not null, "description" text not null, "location" text null, "status" text not null, "assigned_to" text null, "supplier_id" uuid null, "estimated_cost" numeric(18,2) null, "actual_cost" numeric(18,2) null, "currency" text not null default 'USD', "completed_at" timestamptz null, "resolution_notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_maintenance_requests" add constraint "condo_maintenance_requests_category_check" check ("category" in ('plumbing', 'electrical', 'elevator', 'structural', 'cleaning', 'security', 'garden', 'pool', 'other'));`);
    this.addSql(`alter table "condo_maintenance_requests" add constraint "condo_maintenance_requests_priority_check" check ("priority" in ('low', 'medium', 'high', 'emergency'));`);
    this.addSql(`alter table "condo_maintenance_requests" add constraint "condo_maintenance_requests_status_check" check ("status" in ('open', 'assigned', 'in_progress', 'completed', 'cancelled'));`);

    this.addSql(`create table "condo_suppliers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "rif" text null, "specialty" text not null, "phone" text null, "email" text null, "address" text null, "rating" int null, "notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_suppliers" add constraint "condo_suppliers_specialty_check" check ("specialty" in ('plumbing', 'electrical', 'elevator', 'cleaning', 'security', 'garden', 'pool', 'general', 'other'));`);

    this.addSql(`create table "condo_work_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "order_number" text not null, "request_id" uuid null, "supplier_id" uuid null, "supplier_name" text not null, "description" text not null, "scheduled_date" date null, "status" text not null, "quoted_amount" numeric(18,2) null, "approved_amount" numeric(18,2) null, "final_amount" numeric(18,2) null, "currency" text not null default 'USD', "approved_by" uuid null, "completed_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_work_orders" add constraint "condo_work_orders_status_check" check ("status" in ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));`);
  }

}
