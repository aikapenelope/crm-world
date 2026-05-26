import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092558_mfg_bom extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_bom_alternatives" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "bom_line_id" uuid not null, "alt_material_id" uuid not null, "alt_material_code" text not null, "alt_material_name" text not null, "conversion_factor" numeric(8,4) not null default '1.0000', "usage_condition" text not null default 'shortage_only', "quality_impact_notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_bom_headers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "product_code" text not null, "product_name" text not null, "version" text not null default '1.0', "status" text not null default 'draft', "bom_type" text not null default 'discrete', "base_quantity" numeric(12,4) not null default '1.0000', "base_uom" text not null default 'units', "expected_yield_pct" numeric(5,2) null, "approved_by" text null, "approved_at" timestamptz null, "change_reason" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "mfg_bom_lines" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "bom_id" uuid not null, "line_number" smallint not null, "component_id" uuid not null, "component_code" text not null, "component_name" text not null, "component_type" text not null default 'raw_material', "quantity" numeric(14,6) not null, "uom" text not null, "scrap_pct" numeric(5,2) not null default '0.00', "is_critical" boolean not null default true, "is_phantom" boolean not null default false, "lead_offset_days" int not null default 0, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_mfg_bom_lines_bom" on "mfg_bom_lines" ("tenant_id", "bom_id");`);

    this.addSql(`create table "mfg_bom_versions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "product_code" text not null, "from_version" text not null, "to_version" text not null, "change_type" text not null, "change_summary" text not null, "changed_by" uuid null, "changed_at" timestamptz not null, "approved_by" uuid null, "approved_at" timestamptz null, primary key ("id"));`);
  }

}
