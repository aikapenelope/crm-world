import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092550_agri_traceability extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_recalls" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "recall_number" text not null, "processing_lot_id" uuid not null, "lot_number" text not null, "reason" text not null, "recall_class" text not null default 'II', "detection_source" text not null, "initiated_date" date not null, "status" text not null default 'investigating', "affected_clients" jsonb not null, "quantity_recalled_kg" numeric(10,2) null, "public_announcement" boolean not null default false, "approved_by" uuid null, "approved_at" timestamptz null, "completed_date" date null, "corrective_action" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
