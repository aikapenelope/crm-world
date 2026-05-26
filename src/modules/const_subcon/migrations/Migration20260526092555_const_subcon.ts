import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092555_const_subcon extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_subcontracts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "subcontractor_id" uuid not null, "subcontractor_name" text not null, "contract_number" text not null, "scope_description" text not null, "contract_amount" numeric(18,2) not null, "retention_percent" numeric(5,2) not null default '10.00', "currency" text not null default 'USD', "start_date" date null, "end_date" date null, "status" text not null, "amount_paid" numeric(18,2) not null default '0.00', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_subcontracts" add constraint "const_subcontracts_status_check" check ("status" in ('draft', 'active', 'completed', 'terminated'));`);

    this.addSql(`create table "const_subcontractors" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "rif" text null, "specialty" text not null, "contact_name" text null, "phone" text null, "email" text null, "rating" int null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_subcontractors" add constraint "const_subcontractors_specialty_check" check ("specialty" in ('excavation', 'concrete', 'steel', 'masonry', 'electrical', 'mechanical', 'plumbing', 'hvac', 'finishing', 'landscaping', 'other'));`);

    this.addSql(`create table "const_subcontract_payments" ("id" uuid not null, "subcontract_id" uuid not null, "payment_number" text not null, "period_description" text not null, "gross_amount" numeric(18,2) not null, "retention_amount" numeric(18,2) not null, "net_amount" numeric(18,2) not null, "status" text not null, "payment_date" date null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_subcontract_payments" add constraint "const_subcontract_payments_status_check" check ("status" in ('pending', 'approved', 'paid'));`);
  }

}
