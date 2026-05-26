import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092554_const_schedule extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_milestones" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "name" text not null, "milestone_type" text not null, "planned_date" date not null, "actual_date" date null, "status" text not null, "linked_valuation" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_milestones" add constraint "const_milestones_milestone_type_check" check ("milestone_type" in ('start', 'delivery', 'payment', 'inspection', 'permit', 'other'));`);
    this.addSql(`alter table "const_milestones" add constraint "const_milestones_status_check" check ("status" in ('upcoming', 'at_risk', 'achieved', 'delayed'));`);

    this.addSql(`create table "const_tasks" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "parent_id" uuid null, "task_number" text not null, "name" text not null, "level" int not null default 0, "status" text not null, "planned_start" date not null, "planned_end" date not null, "actual_start" date null, "actual_end" date null, "duration_days" int not null default 1, "progress_percent" numeric(5,2) not null default '0.00', "assigned_to" text null, "is_milestone" boolean not null default false, "is_critical" boolean not null default false, "predecessor_ids" jsonb null, "budget_item_id" uuid null, "notes" text null, "sort_order" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_tasks" add constraint "const_tasks_status_check" check ("status" in ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'));`);
  }

}
