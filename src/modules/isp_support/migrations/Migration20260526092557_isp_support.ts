import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_support extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_outages" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "node_id" uuid not null, "outage_number" text not null, "cause" text not null, "status" text not null default 'active', "affected_subscribers" int not null default 0, "started_at" timestamptz not null, "resolved_at" timestamptz null, "resolution_notes" text null, "notified_subscribers" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_support_tickets" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "ticket_number" text not null, "subscriber_id" uuid null, "node_id" uuid null, "outage_id" uuid null, "type" text not null, "origin" text not null default 'manual', "status" text not null default 'open', "priority" text not null default 'normal', "subject" text not null, "description" text null, "solution" text null, "assigned_to" uuid null, "assigned_at" timestamptz null, "resolved_at" timestamptz null, "closed_at" timestamptz null, "sla_hours" smallint null, "sla_breached" boolean not null default false, "escalated_to" uuid null, "escalated_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_ticket_comments" ("id" uuid not null, "tenant_id" text not null, "ticket_id" uuid not null, "author_id" uuid not null, "comment" text not null, "is_internal" boolean not null default true, "created_at" timestamptz not null, primary key ("id"));`);
  }

}
