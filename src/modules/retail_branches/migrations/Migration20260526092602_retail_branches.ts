import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092602_retail_branches extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_branches" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "branch_type" text not null default 'store', "sales_channel_id" uuid null, "address_line1" text null, "address_line2" text null, "city" text null, "state" text null, "postal_code" text null, "latitude" numeric(10,6) null, "longitude" numeric(10,6) null, "phone" text null, "email" text null, "manager_user_id" uuid null, "is_active" boolean not null default true, "operating_hours" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "retail_branches" add constraint "retail_branches_branch_type_check" check ("branch_type" in ('store', 'warehouse', 'kiosk', 'popup'));`);

    this.addSql(`create table "retail_branch_staff" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "branch_id" uuid not null, "user_id" uuid not null, "role" text not null, "is_primary" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_branch_staff" add constraint "retail_branch_staff_role_check" check ("role" in ('manager', 'cashier', 'stock_clerk', 'sales_rep'));`);

    this.addSql(`create table "retail_transfers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "transfer_number" text not null, "from_branch_id" uuid not null, "to_branch_id" uuid not null, "status" text not null default 'draft', "requested_by" uuid not null, "approved_by" uuid null, "approved_at" timestamptz null, "shipped_at" timestamptz null, "received_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_transfers" add constraint "retail_transfers_status_check" check ("status" in ('draft', 'pending_approval', 'approved', 'in_transit', 'received', 'cancelled'));`);

    this.addSql(`create table "retail_transfer_lines" ("id" uuid not null, "transfer_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "quantity_requested" int not null, "quantity_shipped" int not null default 0, "quantity_received" int not null default 0, "notes" text null, primary key ("id"));`);
  }

}
