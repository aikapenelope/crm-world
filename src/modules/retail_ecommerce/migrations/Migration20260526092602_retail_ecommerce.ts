import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092602_retail_ecommerce extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "retail_online_orders" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "order_number" text not null, "sales_order_id" uuid null, "customer_id" uuid null, "guest_name" text null, "guest_phone" text null, "guest_email" text null, "status" text not null default 'pending', "delivery_type" text not null default 'delivery', "delivery_address" jsonb null, "delivery_fee" numeric(18,2) not null default '0.00', "subtotal" numeric(18,2) not null, "tax_amount" numeric(18,2) not null default '0.00', "total" numeric(18,2) not null, "currency" text not null default 'USD', "payment_method" text null, "payment_reference" text null, "payment_status" text not null default 'pending', "estimated_delivery_at" timestamptz null, "delivered_at" timestamptz null, "notes" text null, "source" text not null default 'web', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_online_orders" add constraint "retail_online_orders_status_check" check ("status" in ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'));`);
    this.addSql(`alter table "retail_online_orders" add constraint "retail_online_orders_delivery_type_check" check ("delivery_type" in ('pickup', 'delivery'));`);
    this.addSql(`alter table "retail_online_orders" add constraint "retail_online_orders_payment_status_check" check ("payment_status" in ('pending', 'confirmed', 'failed'));`);
    this.addSql(`alter table "retail_online_orders" add constraint "retail_online_orders_source_check" check ("source" in ('web', 'whatsapp', 'instagram'));`);

    this.addSql(`create table "retail_online_order_lines" ("id" uuid not null, "order_id" uuid not null, "product_id" uuid not null, "variant_id" uuid null, "product_title" text not null, "quantity" int not null, "unit_price" numeric(18,2) not null, "total" numeric(18,2) not null, primary key ("id"));`);

    this.addSql(`create table "retail_social_publishes" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "product_id" uuid not null, "platform" text not null, "content" text not null, "hashtags" text null, "image_urls" jsonb null, "published_at" timestamptz null, "status" text not null default 'draft', "created_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "retail_social_publishes" add constraint "retail_social_publishes_platform_check" check ("platform" in ('instagram', 'whatsapp', 'tiktok', 'facebook'));`);
    this.addSql(`alter table "retail_social_publishes" add constraint "retail_social_publishes_status_check" check ("status" in ('draft', 'ready', 'published'));`);

    this.addSql(`create table "retail_storefronts" ("id" uuid not null, "tenant_id" text not null, "organization_id" text not null, "name" text not null, "slug" text not null, "is_active" boolean not null default true, "config" jsonb null, "branding" jsonb null, "payment_methods" jsonb null, "delivery_zones" jsonb null, "social_links" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
  }

}
