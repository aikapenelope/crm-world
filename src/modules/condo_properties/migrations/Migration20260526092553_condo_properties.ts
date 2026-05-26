import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_condo_properties extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_buildings" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "building_type" text not null, "address" text null, "city" text null, "state" text null, "total_units" int not null default 0, "total_floors" int null, "year_built" int null, "rif" text null, "admin_company" text null, "document_number" text null, "common_areas" jsonb null, "metadata" jsonb null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "condo_buildings" add constraint "condo_buildings_building_type_check" check ("building_type" in ('residential', 'commercial', 'mixed'));`);

    this.addSql(`create table "condo_common_areas" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "name" text not null, "area_type" text not null, "capacity" int null, "is_reservable" boolean not null default false, "reservation_fee" numeric(18,2) null, "rules" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_common_areas" add constraint "condo_common_areas_area_type_check" check ("area_type" in ('social', 'sports', 'parking', 'garden', 'other'));`);

    this.addSql(`create table "condo_units" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "unit_number" text not null, "unit_type" text not null, "floor" text null, "area_m2" numeric(10,2) null, "aliquot_percent" numeric(8,5) not null default '0.00000', "bedrooms" int null, "bathrooms" int null, "parking_spots" int not null default 0, "storage_units" int not null default 0, "status" text not null, "owner_id" uuid null, "resident_id" uuid null, "owner_name" text null, "owner_phone" text null, "owner_email" text null, "resident_name" text null, "resident_phone" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "condo_units" add constraint "condo_units_unit_type_check" check ("unit_type" in ('apartment', 'penthouse', 'local', 'office', 'parking', 'storage'));`);
    this.addSql(`alter table "condo_units" add constraint "condo_units_status_check" check ("status" in ('occupied', 'vacant', 'for_sale', 'for_rent'));`);
  }

}
