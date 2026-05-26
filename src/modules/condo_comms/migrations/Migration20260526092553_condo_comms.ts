import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092553_condo_comms extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "condo_assemblies" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "assembly_number" text not null, "assembly_type" text not null, "title" text not null, "date" date not null, "start_time" text null, "end_time" text null, "location" text null, "quorum_present" numeric(5,2) null, "attendees_count" int not null default 0, "agenda" jsonb null, "minutes" text null, "decisions" jsonb null, "status" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_assemblies" add constraint "condo_assemblies_assembly_type_check" check ("assembly_type" in ('ordinary', 'extraordinary'));`);
    this.addSql(`alter table "condo_assemblies" add constraint "condo_assemblies_status_check" check ("status" in ('scheduled', 'in_progress', 'completed', 'cancelled'));`);

    this.addSql(`create table "condo_circulars" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "circular_number" text not null, "title" text not null, "content" text not null, "category" text not null, "priority" text not null, "published_at" timestamptz null, "expires_at" timestamptz null, "send_whatsapp" boolean not null default false, "total_recipients" int not null default 0, "total_read" int not null default 0, "created_by" uuid null, "status" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_circulars" add constraint "condo_circulars_category_check" check ("category" in ('general', 'maintenance', 'security', 'assembly', 'payment', 'rules', 'emergency'));`);
    this.addSql(`alter table "condo_circulars" add constraint "condo_circulars_priority_check" check ("priority" in ('normal', 'important', 'urgent'));`);
    this.addSql(`alter table "condo_circulars" add constraint "condo_circulars_status_check" check ("status" in ('draft', 'published', 'expired'));`);

    this.addSql(`create table "condo_vote_casts" ("id" uuid not null, "vote_id" uuid not null, "unit_id" uuid not null, "choice" text not null, "aliquot_weight" numeric(8,5) not null, "cast_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "condo_votes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "building_id" uuid not null, "title" text not null, "description" text not null, "vote_type" text not null, "options" jsonb not null, "requires_quorum" boolean not null default true, "quorum_percent" numeric(5,2) not null default '50.00', "status" text not null, "opens_at" timestamptz not null, "closes_at" timestamptz not null, "results" jsonb null, "total_votes" int not null default 0, "total_aliquot_voted" numeric(8,5) not null default '0.00000', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "condo_votes" add constraint "condo_votes_vote_type_check" check ("vote_type" in ('yes_no', 'multiple_choice', 'ranking'));`);
    this.addSql(`alter table "condo_votes" add constraint "condo_votes_status_check" check ("status" in ('draft', 'open', 'closed', 'cancelled'));`);
  }

}
