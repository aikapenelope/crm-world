import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092552_condo_collections extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_collection_actions" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "unit_id" uuid not null, "action_type" text not null, "action_date" timestamptz not null, "performed_by" uuid null, "result" text not null, "notes" text null, "next_action_date" date null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_collection_actions" add constraint "condo_collection_actions_action_type_check" check ("action_type" in ('whatsapp', 'call', 'visit', 'letter', 'legal_notice', 'assembly_report'));`);
    this.addSql(`alter table "condo_collection_actions" add constraint "condo_collection_actions_result_check" check ("result" in ('contacted', 'no_answer', 'promised_payment', 'refused', 'agreement_reached'));`);

    this.addSql(`create table "condo_debtors" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "unit_id" uuid not null, "owner_name" text not null, "owner_phone" text null, "total_debt" numeric(18,2) not null, "currency" text not null default 'USD', "months_overdue" int not null default 0, "oldest_pending_date" date not null, "last_payment_date" date null, "last_contact_date" date null, "contact_method" text null, "status" text not null, "notes" text null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_debtors" add constraint "condo_debtors_status_check" check ("status" in ('active', 'agreement', 'legal', 'resolved'));`);

    this.addSql(`create table "condo_payment_agreements" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "unit_id" uuid not null, "debtor_id" uuid null, "agreement_number" text not null, "total_debt" numeric(18,2) not null, "installments" int not null, "installment_amount" numeric(18,2) not null, "currency" text not null default 'USD', "start_date" date not null, "status" text not null, "paid_installments" int not null default 0, "next_due_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_payment_agreements" add constraint "condo_payment_agreements_status_check" check ("status" in ('active', 'completed', 'defaulted', 'cancelled'));`);
  }

}
