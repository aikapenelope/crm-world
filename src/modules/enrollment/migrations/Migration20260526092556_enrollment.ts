import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092556_enrollment extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "enrollment_applications" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "period_id" uuid not null, "student_id" uuid null, "applicant_contact_id" uuid not null, "application_type" text not null, "requested_grade" text not null, "requested_section" text null, "status" text not null default 'pending', "notes" text null, "approved_by" uuid null, "approved_at" timestamptz null, "rejection_reason" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "enrollment_applications" add constraint "enrollment_applications_application_type_check" check ("application_type" in ('new', 'renewal', 'transfer'));`);
    this.addSql(`alter table "enrollment_applications" add constraint "enrollment_applications_status_check" check ("status" in ('pending', 'documents_pending', 'approved', 'rejected', 'cancelled'));`);

    this.addSql(`create table "enrollment_documents" ("id" uuid not null, "tenant_id" text not null, "application_id" uuid not null, "document_type" text not null, "attachment_id" uuid null, "status" text not null default 'pending', "rejection_reason" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "enrollment_documents" add constraint "enrollment_documents_status_check" check ("status" in ('pending', 'uploaded', 'approved', 'rejected'));`);

    this.addSql(`create table "enrollment_periods" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "school_year" text not null, "start_date" date not null, "end_date" date not null, "status" text not null default 'open', "enrollment_fee" numeric(10,2) null, "fee_currency" text not null default 'USD', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "enrollment_periods" add constraint "enrollment_periods_status_check" check ("status" in ('open', 'closed'));`);
  }

}
