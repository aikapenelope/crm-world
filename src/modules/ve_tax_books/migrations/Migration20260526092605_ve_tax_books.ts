import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092605_ve_tax_books extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "ve_tax_book_entries" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "book_type" text not null, "period_month" text not null, "entry_date" date not null, "document_type" text not null, "document_number" text not null, "control_number" text null, "counterpart_rif" text not null, "counterpart_name" text not null, "is_exempt" boolean not null default false, "taxable_base" numeric(18,2) not null, "tax_rate" numeric(5,2) not null default '16.00', "tax_amount" numeric(18,2) not null default '0.00', "igtf_amount" numeric(18,2) not null default '0.00', "withholding_amount" numeric(18,2) not null default '0.00', "total_amount" numeric(18,2) not null, "currency" text not null default 'USD', "exchange_rate" numeric(18,8) null, "payment_method_code" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "ve_tax_book_entries" add constraint "ve_tax_book_entries_book_type_check" check ("book_type" in ('sales', 'purchases'));`);
    this.addSql(`alter table "ve_tax_book_entries" add constraint "ve_tax_book_entries_document_type_check" check ("document_type" in ('factura', 'nota_credito', 'nota_debito', 'comprobante_retencion'));`);
  }

}
