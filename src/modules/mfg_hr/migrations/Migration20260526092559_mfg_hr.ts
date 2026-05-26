import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092559_mfg_hr extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "mfg_labor_tracking" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "worker_id" uuid not null, "worker_name" text not null, "production_order_id" uuid not null, "order_number" text not null, "operation_id" uuid null, "operation_name" text null, "work_date" date not null, "shift_type" text not null, "hours_worked" numeric(6,2) not null, "is_overtime" boolean not null default false, "is_night_shift" boolean not null default false, "hourly_rate_bs" numeric(14,2) null, "total_wages_bs" numeric(14,2) null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_production_bonuses" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "bonus_number" text not null, "production_order_id" uuid null, "order_number" text null, "work_center_id" uuid null, "work_center_name" text null, "period_start" date not null, "period_end" date not null, "shift_type" text null, "planned_quantity" numeric(12,4) not null, "actual_quantity" numeric(12,4) not null, "uom" text null, "achievement_pct" numeric(5,2) not null, "bonus_amount_bs" numeric(14,2) not null, "workers_count" int not null default 1, "bonus_per_worker_bs" numeric(14,2) not null, "status" text not null default 'calculated', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_shifts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "shift_date" date not null, "shift_type" text not null, "work_center_id" uuid null, "work_center_name" text null, "workers_count" int not null default 0, "planned_production" numeric(12,4) null, "actual_production" numeric(12,4) null, "production_uom" text null, "status" text not null default 'planned', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "mfg_workers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "employee_code" text not null, "full_name" text not null, "cedula" text null, "work_center_id" uuid null, "work_center_name" text null, "shift_type" text not null default 'morning', "qualified_operations" jsonb null, "is_active" boolean not null default true, "hire_date" date null, "hourly_rate_bs" numeric(14,2) null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
