import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092554_const_projects extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_projects" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "project_type" text not null, "status" text not null, "client_id" uuid null, "client_name" text not null, "client_type" text not null, "location" text null, "city" text null, "state" text null, "contract_number" text null, "contract_type" text not null, "contract_amount" numeric(18,2) not null, "currency" text not null default 'USD', "start_date" date null, "planned_end_date" date null, "actual_end_date" date null, "advance_percent" numeric(5,2) not null default '0.00', "retention_percent" numeric(5,2) not null default '10.00', "overall_progress" numeric(5,2) not null default '0.00', "project_manager" text null, "site_supervisor" text null, "description" text null, "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "const_projects" add constraint "const_projects_project_type_check" check ("project_type" in ('residential', 'commercial', 'infrastructure', 'industrial', 'renovation'));`);
    this.addSql(`alter table "const_projects" add constraint "const_projects_status_check" check ("status" in ('prospect', 'bidding', 'awarded', 'in_progress', 'on_hold', 'completed', 'cancelled'));`);
    this.addSql(`alter table "const_projects" add constraint "const_projects_client_type_check" check ("client_type" in ('private', 'public'));`);
    this.addSql(`alter table "const_projects" add constraint "const_projects_contract_type_check" check ("contract_type" in ('fixed_price', 'unit_price', 'cost_plus', 'design_build'));`);
  }

}
