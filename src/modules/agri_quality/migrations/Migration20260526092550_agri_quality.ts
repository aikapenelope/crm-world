import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092550_agri_quality extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_bpm_checklists" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "checklist_type" text not null, "area" text not null, "check_date" date not null, "shift" text null, "items" jsonb not null, "completed_by" uuid null, "verified_by" uuid null, "overall_result" text not null default 'pass', "findings" text null, "corrective_actions" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_ccp_monitoring_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "haccp_plan_id" uuid not null, "ccp_id" text not null, "ccp_name" text not null, "monitoring_date" date not null, "monitoring_time" text null, "measured_value" numeric(10,3) not null, "unit" text not null default '°C', "limit_min" numeric(10,3) null, "limit_max" numeric(10,3) null, "is_deviation" boolean not null default false, "corrective_action_taken" text null, "verified_by" uuid null, "non_conformity_id" uuid null, "processing_lot_id" uuid null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_haccp_plans" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "process" text not null, "version" text not null default 'v1.0', "approved_by" text null, "approved_date" date null, "status" text not null default 'draft', "critical_control_points" jsonb not null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_non_conformities" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "nc_number" text not null, "source" text not null, "severity" text not null default 'major', "description" text not null, "affected_lot_id" uuid null, "detected_by" uuid null, "detection_date" date not null, "status" text not null default 'open', "root_cause" text null, "decision" text null, "decision_by" uuid null, "decision_date" date null, "corrective_action" text null, "preventive_action" text null, "closed_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
