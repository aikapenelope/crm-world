import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_instructors extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_instructors" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "email" text null, "phone" text null, "specialty" text null, "bio" text null, "hourly_rate_usd" numeric(10,2) null, "modalities" jsonb null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
