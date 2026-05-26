import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092604_ve_fiscal extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "ve_fiscal_configs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "rif" text not null, "business_name" text not null, "fiscal_address" text not null, "is_special_taxpayer" boolean not null default false, "iva_rate" numeric(5,2) not null default '16.00', "applies_igtf" boolean not null default true, "igtf_rate" numeric(5,2) not null default '3.00', "is_iva_withholding_agent" boolean not null default false, "iva_withholding_percentage" numeric(5,2) not null default '75.00', "is_islr_withholding_agent" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "ve_fiscal_identities" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_entity_id" uuid not null, "fiscal_id" text not null, "fiscal_id_type" text not null, "fiscal_name" text null, "fiscal_address" text null, "is_special_taxpayer" boolean not null default false, "is_iva_withholding_agent" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
