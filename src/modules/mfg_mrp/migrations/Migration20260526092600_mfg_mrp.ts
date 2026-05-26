import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092600_mfg_mrp extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_mrp_requirements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "plan_id" uuid not null, "material_id" uuid not null, "material_code" text not null, "material_name" text not null, "material_type" text not null default 'raw_material', "uom" text not null, "gross_requirement" numeric(14,4) not null, "stock_on_hand" numeric(14,4) not null default '0.0000', "stock_in_transit" numeric(14,4) not null default '0.0000', "net_requirement" numeric(14,4) not null default '0.0000', "required_by_date" date not null, "suggested_po_date" date not null, "lead_time_days" int not null default 30, "is_imported" boolean not null default false, "supplier_id" uuid null, "supplier_name" text null, "status" text not null default 'pending', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_mfg_mrp_requirements_plan" on "mfg_mrp_requirements" ("tenant_id", "plan_id");`);

    this.addSql(`create table "mfg_production_plans" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "plan_number" text not null, "period_start" date not null, "period_end" date not null, "status" text not null default 'draft', "last_run_at" timestamptz null, "last_run_summary" jsonb null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "mfg_purchase_requisitions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "requisition_number" text not null, "mrp_requirement_id" uuid null, "material_id" uuid not null, "material_code" text not null, "material_name" text not null, "quantity" numeric(14,4) not null, "uom" text not null, "required_by_date" date not null, "suggested_po_date" date not null, "unit_cost_usd" numeric(12,4) null, "total_cost_usd" numeric(14,2) null, "is_imported" boolean not null default false, "supplier_id" uuid null, "supplier_name" text null, "status" text not null default 'pending', "customs_days_estimate" int null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
