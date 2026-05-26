import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092557_isp_subscribers extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "isp_subscriber_contracts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "subscriber_id" uuid not null, "contract_number" text not null, "contract_type" text not null default 'monthly', "start_date" date not null, "end_date" date null, "is_active" boolean not null default true, "monthly_price_usd" numeric(10,2) not null, "installation_fee_usd" numeric(10,2) not null default '0.00', "deposit_usd" numeric(10,2) not null default '0.00', "penalty_clause" text null, "signed_at" timestamptz null, "document_url" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);

    this.addSql(`create table "isp_subscribers" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "customer_entity_id" uuid null, "account_number" text not null, "subscriber_type" text not null default 'residential', "service_status" text not null default 'pending_installation', "plan_id" uuid null, "node_id" uuid null, "monthly_price_usd" numeric(10,2) not null, "installation_address" text not null, "installation_city" text not null, "installation_state" text null, "coordinates_lat" numeric(10,7) null, "coordinates_lng" numeric(10,7) null, "reference_description" text null, "cpe_deployment_id" uuid null, "ip_address" text null, "mac_address" text null, "pppoe_username" text null, "billing_cycle_day" smallint not null default 1, "cut_policy_days" smallint not null default 7, "activation_date" date null, "last_payment_date" date null, "assigned_agent_id" uuid null, "technical_contact_name" text null, "technical_contact_phone" text null, "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
  }

}
