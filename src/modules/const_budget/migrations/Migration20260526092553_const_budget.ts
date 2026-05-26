import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_const_budget extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "const_budget_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "project_id" uuid not null, "parent_id" uuid null, "item_number" text not null, "level" int not null default 0, "name" text not null, "unit" text null, "quantity" numeric(14,4) not null default '0.0000', "unit_cost" numeric(18,4) not null default '0.0000', "total_cost" numeric(18,2) not null default '0.00', "currency" text not null default 'USD', "category" text not null, "sort_order" int not null default 0, "is_chapter" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "const_budget_items" add constraint "const_budget_items_category_check" check ("category" in ('civil', 'electrical', 'mechanical', 'architectural', 'special', 'general'));`);

    this.addSql(`create table "const_budget_resources" ("id" uuid not null, "budget_item_id" uuid not null, "resource_type" text not null, "name" text not null, "unit" text not null, "quantity" numeric(14,4) not null, "unit_price" numeric(18,4) not null, "total" numeric(18,2) not null, "currency" text not null default 'USD', "sort_order" int not null default 0, primary key ("id"));`);
    this.addSql(`alter table "const_budget_resources" add constraint "const_budget_resources_resource_type_check" check ("resource_type" in ('material', 'labor', 'equipment', 'subcontract', 'overhead'));`);
  }

}
