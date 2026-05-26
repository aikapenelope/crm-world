import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092601_properties extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "properties" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "title" text not null, "description" text null, "property_type" text not null, "operation" text not null, "status" text not null default 'draft', "price" numeric(18,2) not null, "currency" text not null default 'USD', "area_m2" numeric(10,2) null, "bedrooms" smallint null, "bathrooms" smallint null, "parking" smallint null, "address_line" text null, "city" text not null, "state" text null, "zip" text null, "country" text not null default 'VE', "latitude" numeric(10,7) null, "longitude" numeric(10,7) null, "commission_rate" numeric(5,2) not null default '5.00', "contact_id" uuid null, "assigned_to" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "properties" add constraint "properties_property_type_check" check ("property_type" in ('apartamento', 'casa', 'terreno', 'comercial', 'oficina', 'galpon', 'otro'));`);
    this.addSql(`alter table "properties" add constraint "properties_operation_check" check ("operation" in ('venta', 'alquiler', 'venta_alquiler'));`);
    this.addSql(`alter table "properties" add constraint "properties_status_check" check ("status" in ('draft', 'active', 'reserved', 'sold', 'rented', 'inactive'));`);

    this.addSql(`create table "property_images" ("id" uuid not null, "tenant_id" text not null, "property_id" uuid not null, "attachment_id" uuid not null, "sort_order" smallint not null default 0, "is_cover" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "property_links" ("id" uuid not null, "tenant_id" text not null, "property_id" uuid not null, "platform" text not null, "url" text not null, "label" text null, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
