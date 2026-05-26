import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092602_retail_inventory extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_stock_counts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "branch_id" uuid not null, "count_number" text not null, "status" text not null default 'planned', "count_type" text not null default 'full', "planned_date" date not null, "started_at" timestamptz null, "completed_at" timestamptz null, "performed_by" uuid null, "approved_by" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_stock_counts" add constraint "retail_stock_counts_status_check" check ("status" in ('planned', 'in_progress', 'completed', 'cancelled'));`);
    this.addSql(`alter table "retail_stock_counts" add constraint "retail_stock_counts_count_type_check" check ("count_type" in ('full', 'partial', 'spot_check'));`);

    this.addSql(`create table "retail_stock_count_lines" ("id" uuid not null, "count_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "system_quantity" int not null, "counted_quantity" int null, "difference" int null, "status" text not null default 'pending', "notes" text null, primary key ("id"));`);
    this.addSql(`alter table "retail_stock_count_lines" add constraint "retail_stock_count_lines_status_check" check ("status" in ('pending', 'counted', 'verified'));`);

    this.addSql(`create table "retail_stock_rotation" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "branch_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "period_month" text not null, "opening_stock" int not null default 0, "closing_stock" int not null default 0, "total_sold" int not null default 0, "total_received" int not null default 0, "rotation_index" numeric(10,2) not null default '0.00', "days_of_stock" int not null default 0, "is_dead_stock" boolean not null default false, "last_movement_at" timestamptz null, "calculated_at" timestamptz not null, primary key ("id"));`);
  }

}
