import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092604_students extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "students" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "first_name" text not null, "last_name" text not null, "cedula" text null, "birth_date" date null, "gender" text null, "blood_type" text null, "photo_attachment_id" uuid null, "grade_level" text not null, "section" text not null default 'A', "enrollment_status" text not null default 'active', "enrollment_date" date null, "previous_school" text null, "medical_notes" text null, "allergies" text null, "emergency_contact_name" text null, "emergency_contact_phone" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "students" add constraint "students_gender_check" check ("gender" in ('masculino', 'femenino'));`);
    this.addSql(`alter table "students" add constraint "students_grade_level_check" check ("grade_level" in ('maternal', 'preescolar_1', 'preescolar_2', 'preescolar_3', 'primaria_1', 'primaria_2', 'primaria_3', 'primaria_4', 'primaria_5', 'primaria_6', 'bachillerato_1', 'bachillerato_2', 'bachillerato_3', 'bachillerato_4', 'bachillerato_5'));`);
    this.addSql(`alter table "students" add constraint "students_enrollment_status_check" check ("enrollment_status" in ('active', 'graduated', 'withdrawn', 'suspended', 'transferred'));`);

    this.addSql(`create table "student_representatives" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "student_id" uuid not null, "contact_id" uuid not null, "relationship" text not null, "is_primary" boolean not null default false, "is_authorized_pickup" boolean not null default true, "created_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "student_representatives" add constraint "student_representatives_relationship_check" check ("relationship" in ('padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'tutor_legal', 'otro'));`);
  }

}
