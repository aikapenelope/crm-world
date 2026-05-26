import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092556_dist_price_lists extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_customer_price_lists" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_id" uuid not null, "price_list_id" uuid not null, "priority" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "dist_price_lists" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "type" text not null default 'standard', "currency" text not null default 'USD', "is_default" boolean not null default false, "valid_from" date null, "valid_until" date null, "is_active" boolean not null default true, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "dist_price_lists" add constraint "dist_price_lists_type_check" check ("type" in ('standard', 'promotional', 'volume'));`);

    this.addSql(`create table "dist_price_list_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "price_list_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "unit_price" numeric(18,4) not null, "min_quantity" int not null default 1, "currency" text not null default 'USD', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
