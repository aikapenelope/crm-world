import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092551_agri_vet extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "agri_vet_medication_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_id" uuid not null, "diagnosis" text not null, "medication_name" text not null, "active_ingredient" text null, "manufacturer" text null, "administration_route" text not null default 'drinking_water', "dose_description" text null, "treatment_start_date" date not null, "treatment_duration_days" int not null, "treatment_end_date" date not null, "veterinarian_name" text null, "veterinarian_id" uuid null, "medication_lot_number" text null, "medication_expiry_date" date null, "withdrawal_days" int not null default 0, "withdrawal_end_date" date not null, "resolved" boolean not null default false, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "idx_agri_medication_flock_withdrawal" on "agri_vet_medication_records" ("tenant_id", "flock_id", "withdrawal_end_date");`);

    this.addSql(`create table "agri_vet_mortality_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_id" uuid not null, "record_date" date not null, "count" int not null, "cause" text not null default 'other', "cause_detail" text null, "notes" text null, "created_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "agri_vet_vaccination_programs" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "species" text not null default 'broiler', "vaccinations" jsonb not null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "agri_vet_vaccination_records" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "flock_id" uuid not null, "program_id" uuid null, "vaccine_name" text not null, "active_ingredient" text null, "manufacturer" text null, "administration_route" text not null default 'drinking_water', "scheduled_date" date not null, "applied_date" date null, "status" text not null default 'scheduled', "birds_treated" int null, "dose_applied" numeric(8,3) null, "dose_unit" text null, "vaccine_lot_number" text null, "vaccine_expiry_date" date null, "withdrawal_days" int not null default 0, "withdrawal_end_date" date null, "operator_id" uuid null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
