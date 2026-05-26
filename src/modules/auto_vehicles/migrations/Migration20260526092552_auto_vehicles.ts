import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092552_auto_vehicles extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "auto_vehicles" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_id" uuid not null, "plate" text not null, "brand" text not null, "model" text not null, "year" smallint not null, "color" text null, "vin" text null, "engine_type" text not null default 'gasoline', "transmission" text not null default 'manual', "current_km" int not null default 0, "notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "auto_vehicles" add constraint "auto_vehicles_engine_type_check" check ("engine_type" in ('gasoline', 'diesel', 'hybrid', 'electric', 'gas'));`);
    this.addSql(`alter table "auto_vehicles" add constraint "auto_vehicles_transmission_check" check ("transmission" in ('manual', 'automatic'));`);

    this.addSql(`create table "auto_vehicle_photos" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "vehicle_id" uuid not null, "photo_url" text not null, "photo_type" text not null default 'other', "caption" text null, "taken_at" timestamptz not null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_vehicle_photos" add constraint "auto_vehicle_photos_photo_type_check" check ("photo_type" in ('front', 'rear', 'left', 'right', 'interior', 'engine', 'damage', 'other'));`);
  }

}
