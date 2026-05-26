import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092601_mfg_quality extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_nonconformances" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "nc_number" text not null, "source" text not null, "lot_id" uuid null, "lot_number" text null, "order_id" uuid null, "product_id" uuid null, "product_code" text null, "inspection_id" uuid null, "description" text not null, "severity" text not null default 'major', "quantity_affected" numeric(12,4) null, "uom" text null, "status" text not null default 'open', "root_cause" text null, "disposition" text null, "corrective_action" text null, "preventive_action" text null, "cost_nc_usd" numeric(12,2) null, "opened_by" uuid null, "closed_by" uuid null, "closed_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_quality_inspections" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "plan_id" uuid not null, "lot_id" uuid null, "order_id" uuid null, "sample_number" int not null default 1, "subgroup_id" text null, "measured_value" numeric(14,6) not null, "is_in_spec" boolean not null default true, "is_in_control" boolean not null default true, "inspector_id" uuid null, "inspection_timestamp" timestamptz not null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_quality_plans" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "product_code" text not null, "product_name" text not null, "control_point" text not null default 'in_process', "parameter_name" text not null, "parameter_unit" text not null, "instrument" text null, "lsl" numeric(12,4) null, "usl" numeric(12,4) null, "lcl" numeric(12,4) null, "ucl" numeric(12,4) null, "target" numeric(12,4) null, "sampling_frequency" text not null default 'per_batch', "sample_size" int not null default 5, "is_critical_control_point" boolean not null default false, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "mfg_spc_charts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "plan_id" uuid not null, "subgroup_id" text not null, "subgroup_date" date not null, "sample_count" int not null, "subgroup_mean" numeric(14,6) not null, "subgroup_range" numeric(14,6) not null, "subgroup_std" numeric(14,6) null, "is_out_of_control" boolean not null default false, "rule_violated" text null, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
