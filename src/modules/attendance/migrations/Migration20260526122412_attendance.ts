import { Migration } from '@mikro-orm/migrations';

export class Migration20260526122412_attendance extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "attendance_records" add "deleted_at" timestamptz null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "attendance_records" drop column "deleted_at";`);
  }

}
