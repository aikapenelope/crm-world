import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092558_mercadolibre_sync extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "market_listings" ("id" uuid not null, "ml_id" text not null, "title" text not null, "description" text null, "permalink" text null, "thumbnail" text null, "property_type" text not null, "operation" text not null, "category_id" text null, "price" numeric(18,2) null, "price_currency" text null, "price_usd" numeric(18,2) null, "city" text null, "state" text null, "neighborhood" text null, "latitude" numeric(10,7) null, "longitude" numeric(10,7) null, "area_m2" numeric(10,2) null, "bedrooms" smallint null, "bathrooms" smallint null, "parking" smallint null, "seller_nickname" text null, "seller_id" text null, "sync_status" text not null default 'active', "ml_published_at" timestamptz null, "synced_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "market_listings" add constraint "market_listings_ml_id_unique" unique ("ml_id");`);
    this.addSql(`create index "idx_ml_price" on "market_listings" ("price_usd");`);
    this.addSql(`create index "idx_ml_operation_status" on "market_listings" ("operation", "sync_status");`);
    this.addSql(`create index "idx_ml_city_type" on "market_listings" ("city", "property_type");`);
  }

}
