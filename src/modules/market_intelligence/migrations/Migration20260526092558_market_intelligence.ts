import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092558_market_intelligence extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "market_valuations" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "property_type" text not null, "operation" text not null, "city" text not null, "zone" text null, "area_m2" numeric(10,2) null, "bedrooms" smallint null, "reference_price" numeric(18,2) null, "sample_size" int not null, "avg_price" numeric(18,2) null, "median_price" numeric(18,2) null, "min_price" numeric(18,2) null, "max_price" numeric(18,2) null, "p25_price" numeric(18,2) null, "p75_price" numeric(18,2) null, "avg_price_per_m2" numeric(18,2) null, "price_position" text null, "percentile_rank" smallint null, "comparable_ids" jsonb null, "property_id" uuid null, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
