import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092605_ve_withholdings extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "ve_withholding_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "type" text not null, "period_month" text not null, "fortnight" smallint not null default 1, "supplier_rif" text not null, "supplier_name" text not null, "invoice_number" text not null, "invoice_date" date not null, "invoice_amount" numeric(18,2) not null, "tax_amount" numeric(18,2) not null, "withholding_rate" numeric(5,2) not null, "withholding_amount" numeric(18,2) not null, "voucher_number" text null, "status" text not null default 'pending', "declared_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "ve_withholding_records" add constraint "ve_withholding_records_type_check" check ("type" in ('iva', 'islr'));`);
    this.addSql(`alter table "ve_withholding_records" add constraint "ve_withholding_records_status_check" check ("status" in ('pending', 'applied', 'declared'));`);
  }

}
