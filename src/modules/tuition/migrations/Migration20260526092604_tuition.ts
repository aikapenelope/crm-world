import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092604_tuition extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "tuition_charges" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "plan_id" uuid null, "period_month" text not null, "concept" text not null default 'mensualidad', "description" text null, "amount" numeric(10,2) not null, "currency" text not null default 'USD', "status" text not null default 'pending', "due_date" date not null, "paid_date" date null, "late_fee_applied" numeric(10,2) not null default '0.00', "amount_paid" numeric(10,2) not null default '0.00', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "tuition_charges" add constraint "tuition_charges_concept_check" check ("concept" in ('mensualidad', 'inscripcion', 'material', 'uniforme', 'transporte', 'evento', 'otro'));`);
    this.addSql(`alter table "tuition_charges" add constraint "tuition_charges_status_check" check ("status" in ('pending', 'partial', 'paid', 'overdue', 'waived', 'credited'));`);

    this.addSql(`create table "tuition_discounts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "discount_type" text not null, "percentage" numeric(5,2) null, "fixed_amount" numeric(10,2) null, "reason" text not null, "valid_from" date null, "valid_until" date null, "is_active" boolean not null default true, "created_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "tuition_discounts" add constraint "tuition_discounts_discount_type_check" check ("discount_type" in ('sibling', 'scholarship', 'employee', 'early_payment', 'other'));`);

    this.addSql(`create table "tuition_payments" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "charge_id" uuid not null, "student_id" uuid not null, "representative_contact_id" uuid null, "amount" numeric(10,2) not null, "currency" text not null, "exchange_rate" numeric(18,6) null, "payment_method_code" text null, "reference" text null, "payment_date" date not null, "recorded_by" uuid null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "tuition_plans" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "period_id" uuid null, "grade_level" text null, "name" text not null, "monthly_amount" numeric(10,2) not null, "currency" text not null default 'USD', "months" smallint not null default 10, "due_day" smallint not null default 5, "late_fee_percentage" numeric(5,2) not null default '5.00', "late_fee_after_days" smallint not null default 10, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
