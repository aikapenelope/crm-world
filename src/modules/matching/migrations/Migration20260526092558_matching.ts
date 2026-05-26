import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092558_matching extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "contact_preferences" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "contact_id" uuid not null, "preferred_type" text null, "preferred_operation" text null, "preferred_city" text null, "max_budget" numeric(18,2) null, "budget_currency" text not null default 'USD', "min_area_m2" numeric(10,2) null, "min_bedrooms" smallint null, "min_bathrooms" smallint null, "min_parking" smallint null, "notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "contact_preferences" add constraint "contact_preferences_preferred_type_check" check ("preferred_type" in ('apartamento', 'casa', 'terreno', 'comercial', 'oficina', 'galpon', 'otro'));`);
    this.addSql(`alter table "contact_preferences" add constraint "contact_preferences_preferred_operation_check" check ("preferred_operation" in ('venta', 'alquiler', 'venta_alquiler'));`);

    this.addSql(`create table "match_results" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "contact_id" uuid not null, "property_id" uuid not null, "score" smallint not null, "criteria_matched" jsonb null, "is_notified" boolean not null default false, "is_dismissed" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
