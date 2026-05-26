import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092556_dist_routes extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_routes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "code" text not null, "zone" text null, "day_of_week" smallint null, "assigned_seller_id" uuid null, "assigned_driver_id" uuid null, "vehicle_plate" text null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "dist_route_stops" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "route_id" uuid not null, "customer_id" uuid not null, "sequence_order" int not null default 0, "address" text null, "contact_phone" text null, "delivery_notes" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "dist_route_visits" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "route_id" uuid not null, "stop_id" uuid not null, "visit_date" date not null, "status" text not null default 'planned', "order_id" uuid null, "notes" text null, "visited_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "dist_route_visits" add constraint "dist_route_visits_status_check" check ("status" in ('planned', 'visited', 'skipped', 'order_taken', 'no_order'));`);
  }

}
