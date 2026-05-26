import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092555_dist_commissions extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "dist_commission_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "seller_id" uuid not null, "period_month" text not null, "type" text not null, "reference_type" text null, "reference_id" uuid null, "base_amount" numeric(18,2) not null, "rate_applied" numeric(5,2) not null, "commission_amount" numeric(18,2) not null, "status" text not null default 'pending', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "dist_commission_records" add constraint "dist_commission_records_type_check" check ("type" in ('sale', 'collection', 'goal_bonus'));`);
    this.addSql(`alter table "dist_commission_records" add constraint "dist_commission_records_status_check" check ("status" in ('pending', 'approved', 'paid'));`);

    this.addSql(`create table "dist_commission_rules" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "seller_id" uuid null, "type" text not null, "rate" numeric(5,2) not null, "min_amount" numeric(18,2) not null default '0.00', "goal_amount" numeric(18,2) null, "is_active" boolean not null default true, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "dist_commission_rules" add constraint "dist_commission_rules_type_check" check ("type" in ('sale', 'collection', 'goal_bonus'));`);
  }

}
