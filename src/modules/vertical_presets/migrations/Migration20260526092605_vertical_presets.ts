import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092605_vertical_presets extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "tenant_verticals" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "vertical_key" text not null, "set_by" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
