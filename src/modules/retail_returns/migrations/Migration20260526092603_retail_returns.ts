import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092603_retail_returns extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_credit_notes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "credit_note_number" text not null, "customer_id" uuid not null, "return_id" uuid null, "amount" numeric(18,2) not null, "balance" numeric(18,2) not null, "currency" text not null default 'USD', "status" text not null default 'active', "expires_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_credit_notes" add constraint "retail_credit_notes_status_check" check ("status" in ('active', 'partially_used', 'fully_used', 'expired', 'cancelled'));`);

    this.addSql(`create table "retail_returns" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "return_number" text not null, "branch_id" uuid not null, "customer_id" uuid null, "original_order_id" uuid null, "status" text not null default 'requested', "reason" text not null, "reason_detail" text null, "refund_method" text not null default 'credit_note', "subtotal" numeric(18,2) not null, "restocking_fee" numeric(18,2) not null default '0.00', "refund_amount" numeric(18,2) not null, "currency" text not null default 'USD', "processed_by" uuid null, "processed_at" timestamptz null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_returns" add constraint "retail_returns_status_check" check ("status" in ('requested', 'approved', 'inspecting', 'completed', 'rejected', 'cancelled'));`);
    this.addSql(`alter table "retail_returns" add constraint "retail_returns_reason_check" check ("reason" in ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other'));`);
    this.addSql(`alter table "retail_returns" add constraint "retail_returns_refund_method_check" check ("refund_method" in ('original', 'credit_note', 'store_credit', 'cash'));`);

    this.addSql(`create table "retail_return_lines" ("id" uuid not null, "return_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "quantity" int not null, "unit_price" numeric(18,2) not null, "condition" text not null default 'good', "restock" boolean not null default true, "notes" text null, primary key ("id"));`);
    this.addSql(`alter table "retail_return_lines" add constraint "retail_return_lines_condition_check" check ("condition" in ('new', 'good', 'damaged', 'defective', 'unsellable'));`);

    this.addSql(`create table "retail_return_policies" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "category_ids" jsonb null, "max_days" int not null default 30, "requires_receipt" boolean not null default true, "requires_original_packaging" boolean not null default false, "refund_method" text not null default 'credit_note', "restocking_fee_percent" numeric(5,2) not null default '0.00', "conditions" jsonb null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_return_policies" add constraint "retail_return_policies_refund_method_check" check ("refund_method" in ('original', 'credit_note', 'store_credit', 'cash'));`);
  }

}
