import { Migration } from '@mikro-orm/migrations';

export class Migration20260526122416_vertical_presets extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "tenant_verticals" add "deleted_at" timestamptz null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "tenant_verticals" drop column "deleted_at";`);
  }

}
