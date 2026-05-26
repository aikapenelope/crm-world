import { Migration } from '@mikro-orm/migrations';

export class Migration20260526120911_ve_fiscal extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "ve_fiscal_configs" add "deleted_at" timestamptz null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "ve_fiscal_configs" drop column "deleted_at";`);
  }

}
