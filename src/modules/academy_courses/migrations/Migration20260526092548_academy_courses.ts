import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092548_academy_courses extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "academy_courses" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "description" text null, "category" text not null, "level" text not null, "duration_hours" numeric(6,1) not null, "price_usd" numeric(18,2) not null, "currency" text not null default 'USD', "modality" text not null, "max_students" int not null default 20, "prerequisites" text null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "academy_courses" add constraint "academy_courses_modality_check" check ("modality" in ('in_person', 'online', 'hybrid'));`);
  }

}
