import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092554_const_rfis extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_rfis" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "rfi_number" text not null, "subject" text not null, "description" text not null, "discipline" text not null, "priority" text not null, "status" text not null, "submitted_by" text not null, "assigned_to" text null, "due_date" date null, "answered_at" timestamptz null, "answer" text null, "cost_impact" numeric(18,2) null, "schedule_impact_days" int null, "linked_drawing" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_rfis" add constraint "const_rfis_discipline_check" check ("discipline" in ('civil', 'architectural', 'structural', 'electrical', 'mechanical', 'plumbing', 'other'));`);
    this.addSql(`alter table "const_rfis" add constraint "const_rfis_priority_check" check ("priority" in ('low', 'normal', 'high', 'urgent'));`);
    this.addSql(`alter table "const_rfis" add constraint "const_rfis_status_check" check ("status" in ('open', 'pending_response', 'answered', 'closed', 'void'));`);

    this.addSql(`create table "const_submittals" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "submittal_number" text not null, "title" text not null, "spec_section" text null, "submittal_type" text not null, "status" text not null, "submitted_by" text not null, "reviewer" text null, "submitted_at" date null, "due_date" date null, "reviewed_at" date null, "review_notes" text null, "revision_number" int not null default 1, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_submittals" add constraint "const_submittals_submittal_type_check" check ("submittal_type" in ('shop_drawing', 'product_data', 'sample', 'calculation', 'certificate', 'test_report'));`);
    this.addSql(`alter table "const_submittals" add constraint "const_submittals_status_check" check ("status" in ('draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected'));`);
  }

}
