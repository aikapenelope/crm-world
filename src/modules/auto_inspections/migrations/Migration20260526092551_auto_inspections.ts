import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_auto_inspections extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "auto_inspections" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "service_order_id" uuid not null, "vehicle_id" uuid not null, "type" text not null default 'intake', "inspector_id" uuid null, "status" text not null default 'in_progress', "overall_condition" text null, "notes" text null, "sent_to_customer_at" timestamptz null, "customer_viewed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_inspections" add constraint "auto_inspections_type_check" check ("type" in ('intake', 'diagnosis', 'progress', 'completion'));`);
    this.addSql(`alter table "auto_inspections" add constraint "auto_inspections_status_check" check ("status" in ('in_progress', 'completed', 'sent_to_customer'));`);
    this.addSql(`alter table "auto_inspections" add constraint "auto_inspections_overall_condition_check" check ("overall_condition" in ('good', 'fair', 'needs_attention', 'critical'));`);

    this.addSql(`create table "auto_inspection_items" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "inspection_id" uuid not null, "system_category" text not null, "item_name" text not null, "condition" text not null default 'not_inspected', "notes" text null, "recommended_action" text null, "urgency" text not null default 'none', "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_inspection_items" add constraint "auto_inspection_items_system_category_check" check ("system_category" in ('brakes', 'engine', 'suspension', 'electrical', 'tires', 'fluids', 'body', 'interior', 'exhaust', 'transmission', 'cooling', 'steering', 'other'));`);
    this.addSql(`alter table "auto_inspection_items" add constraint "auto_inspection_items_condition_check" check ("condition" in ('good', 'fair', 'needs_attention', 'critical', 'not_inspected'));`);
    this.addSql(`alter table "auto_inspection_items" add constraint "auto_inspection_items_urgency_check" check ("urgency" in ('none', 'soon', 'immediate'));`);

    this.addSql(`create table "auto_inspection_photos" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "inspection_id" uuid not null, "inspection_item_id" uuid null, "photo_url" text not null, "photo_type" text not null default 'finding', "caption" text null, "annotations_json" jsonb null, "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "auto_inspection_photos" add constraint "auto_inspection_photos_photo_type_check" check ("photo_type" in ('before', 'during', 'after', 'finding'));`);
  }

}
