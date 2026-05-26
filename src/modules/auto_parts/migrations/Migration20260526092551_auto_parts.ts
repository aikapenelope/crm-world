import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_auto_parts extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "auto_parts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "code" text not null, "name" text not null, "brand" text null, "category" text not null default 'other', "compatible_brands" jsonb null, "unit" text not null default 'pieza', "cost_price" numeric(18,2) not null, "sell_price" numeric(18,2) not null, "currency" text not null default 'USD', "quantity_in_stock" int not null default 0, "reorder_point" int not null default 0, "location" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "auto_parts" add constraint "auto_parts_category_check" check ("category" in ('brakes', 'engine', 'electrical', 'suspension', 'filters', 'fluids', 'body', 'other'));`);
  }

}
