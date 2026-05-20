# Plan de Vertical Retail/Comercio — Aika Platform

> **Objetivo**: Implementar 5 módulos custom para gestión de tiendas retail multi-sucursal en Venezuela.
> **Base**: Open Mercato v0.6.1 (catalog, sales, checkout, customers, payment_gateways)
> **Patrón**: Mismo que distribución/automotive — módulos `from: '@app'` en `src/modules/`

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    Open Mercato Core (ya existe)                  │
│  catalog · sales · checkout · customers · payment_gateways       │
│  SalesChannel (= sucursal) · SalesOrder · CatalogProduct         │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Kysely queries + event bus
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Módulos Retail Custom (@app)                   │
│                                                                   │
│  retail_branches     → Sucursales, transferencias, permisos       │
│  retail_inventory    → Stock multi-branch, rotación, conteo       │
│  retail_loyalty      → Puntos, niveles VIP, campañas              │
│  retail_returns      → Devoluciones, notas crédito, políticas     │
│  retail_ecommerce    → Storefront, delivery, publicación social   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Reutiliza
                              │
┌─────────────────────────────────────────────────────────────────┐
│              Módulos Transversales VE (ya existen)                │
│  ve_fiscal · ve_tax_books · ve_withholdings · ve_tax_reports     │
│  bank_reconciliation · venezuela_rates · payment_methods          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decisiones de Diseño

### SalesChannel como Sucursal
Open Mercato ya tiene `SalesChannel` con dirección, coordenadas, y relación con `SalesOrder`. Lo usamos como la entidad "sucursal" para ventas. Nuestro módulo `retail_branches` extiende esto con:
- Entidad `RetailBranch` que referencia al `SalesChannel` por ID
- Inventario segregado por branch (warehouse_code = branch_code)
- Permisos por branch (feature flags + branch_id en contexto)

### Inventario: Extensión, no duplicación
`dist_inventory` ya tiene la base (items, movements, warehouse_code). `retail_inventory` agrega:
- Rotación de inventario (cálculo automático)
- Dead stock detection
- Conteo cíclico con workflow
- Transferencias inter-branch con aprobación
- NO duplica entidades de dist_inventory — usa Kysely para leer/escribir las mismas tablas

### Comunicación entre módulos
Siguiendo el patrón del proyecto: Kysely queries + event bus. NO imports directos.

---

## Sprint 1: retail_branches — Multi-Sucursal Centralizado

### Entidades

```typescript
// RetailBranchEntity — Sucursal/Tienda
@Entity({ tableName: 'retail_branches' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Tienda Centro", "Sucursal Altamira"
- code (text, unique per org) — "CENTRO", "ALT01"
- branch_type: 'store' | 'warehouse' | 'kiosk' | 'popup'
- sales_channel_id (uuid, nullable) — referencia a SalesChannel de Open Mercato
- address_line1, address_line2, city, state, postal_code (text, nullable)
- latitude, longitude (decimal, nullable)
- phone, email (text, nullable)
- manager_user_id (uuid, nullable)
- is_active (boolean, default true)
- operating_hours (json, nullable) — { mon: { open: "08:00", close: "18:00" }, ... }
- metadata (json, nullable)
- created_at, updated_at, deleted_at

// RetailBranchStaffEntity — Asignación de personal a sucursal
@Entity({ tableName: 'retail_branch_staff' })
- id (uuid PK)
- tenant_id, organization_id
- branch_id (uuid) → retail_branches
- user_id (uuid)
- role: 'manager' | 'cashier' | 'stock_clerk' | 'sales_rep'
- is_primary (boolean, default false) — sucursal principal del empleado
- created_at

// RetailTransferEntity — Transferencia entre sucursales
@Entity({ tableName: 'retail_transfers' })
- id (uuid PK)
- tenant_id, organization_id
- transfer_number (text) — auto-generated "TRF-001"
- from_branch_id (uuid)
- to_branch_id (uuid)
- status: 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'received' | 'cancelled'
- requested_by (uuid)
- approved_by (uuid, nullable)
- approved_at (timestamptz, nullable)
- shipped_at (timestamptz, nullable)
- received_at (timestamptz, nullable)
- notes (text, nullable)
- created_at, updated_at

// RetailTransferLineEntity — Líneas de transferencia
@Entity({ tableName: 'retail_transfer_lines' })
- id (uuid PK)
- transfer_id (uuid)
- product_id (uuid)
- variant_id (uuid, nullable)
- quantity_requested (int)
- quantity_shipped (int, default 0)
- quantity_received (int, default 0)
- notes (text, nullable)
```

### API Routes
- `GET/POST /api/retail-branches/branches` — CRUD sucursales
- `PUT/DELETE /api/retail-branches/branches` — update/delete
- `GET/POST /api/retail-branches/staff` — asignación de personal
- `GET/POST /api/retail-branches/transfers` — transferencias
- `PUT /api/retail-branches/transfers` — cambiar estado (aprobar, enviar, recibir)

### UI (Backend Pages)
- `/backend/retail_branches/` — Lista de sucursales (DataTable)
- `/backend/retail_branches/create/` — Crear sucursal (CrudForm)
- `/backend/retail_branches/[id]/` — Detalle sucursal (tabs: info, staff, inventario, ventas)
- `/backend/retail_branches/transfers/` — Lista transferencias
- `/backend/retail_branches/transfers/create/` — Crear transferencia

### ACL Features
- `retail_branches.view` — Ver sucursales
- `retail_branches.manage` — Crear/editar sucursales
- `retail_branches.transfer` — Crear transferencias
- `retail_branches.transfer_approve` — Aprobar transferencias
- `retail_branches.staff_manage` — Asignar personal

---

## Sprint 2: retail_inventory — Inventario en Tiempo Real

### Entidades

```typescript
// RetailStockCountEntity — Conteo cíclico
@Entity({ tableName: 'retail_stock_counts' })
- id (uuid PK)
- tenant_id, organization_id
- branch_id (uuid) — sucursal donde se hace el conteo
- count_number (text) — "CNT-001"
- status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
- count_type: 'full' | 'partial' | 'spot_check'
- planned_date (date)
- started_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- performed_by (uuid, nullable)
- approved_by (uuid, nullable)
- notes (text, nullable)
- created_at, updated_at

// RetailStockCountLineEntity — Líneas del conteo
@Entity({ tableName: 'retail_stock_count_lines' })
- id (uuid PK)
- count_id (uuid)
- product_id (uuid)
- variant_id (uuid, nullable)
- system_quantity (int) — lo que dice el sistema
- counted_quantity (int, nullable) — lo que se contó
- difference (int, nullable) — counted - system
- status: 'pending' | 'counted' | 'verified'
- notes (text, nullable)

// RetailStockRotationEntity — Métricas de rotación (calculado por worker)
@Entity({ tableName: 'retail_stock_rotation' })
- id (uuid PK)
- tenant_id, organization_id
- branch_id (uuid)
- product_id (uuid)
- variant_id (uuid, nullable)
- period_month (text) — "2026-05"
- opening_stock (int)
- closing_stock (int)
- total_sold (int)
- total_received (int)
- rotation_index (decimal) — sold / avg_stock
- days_of_stock (int) — stock / daily_avg_sales
- is_dead_stock (boolean) — sin movimiento en 90+ días
- last_movement_at (timestamptz, nullable)
- calculated_at (timestamptz)
```

### API Routes
- `GET/POST /api/retail-inventory/counts` — CRUD conteos
- `PUT /api/retail-inventory/counts` — actualizar estado/líneas
- `GET /api/retail-inventory/rotation` — métricas de rotación
- `GET /api/retail-inventory/dead-stock` — productos sin movimiento
- `GET /api/retail-inventory/dashboard` — KPIs consolidados multi-branch

### UI (Backend Pages)
- `/backend/retail_inventory/` — Dashboard inventario multi-branch
- `/backend/retail_inventory/counts/` — Lista conteos cíclicos
- `/backend/retail_inventory/counts/create/` — Iniciar conteo
- `/backend/retail_inventory/counts/[id]/` — Ejecutar conteo (formulario línea por línea)
- `/backend/retail_inventory/rotation/` — Reporte de rotación
- `/backend/retail_inventory/dead-stock/` — Productos sin movimiento

### Workers
- `calculate-rotation` — Calcula rotación mensual por producto/branch (cron diario)

### ACL Features
- `retail_inventory.view` — Ver inventario
- `retail_inventory.count` — Ejecutar conteos
- `retail_inventory.count_approve` — Aprobar conteos y aplicar ajustes
- `retail_inventory.reports` — Ver reportes de rotación/dead stock

---

## Sprint 3: retail_loyalty — Fidelización de Clientes

### Entidades

```typescript
// RetailLoyaltyProgramEntity — Configuración del programa
@Entity({ tableName: 'retail_loyalty_programs' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Programa VIP"
- is_active (boolean, default true)
- points_per_usd (decimal) — puntos por cada USD gastado (ej: 10)
- points_currency (text, default 'USD') — moneda base para acumulación
- min_redemption_points (int) — mínimo para canjear (ej: 100)
- point_value_usd (decimal) — valor de cada punto en USD (ej: 0.01)
- expiration_days (int, nullable) — días para expirar puntos (null = no expiran)
- created_at, updated_at

// RetailLoyaltyTierEntity — Niveles VIP
@Entity({ tableName: 'retail_loyalty_tiers' })
- id (uuid PK)
- program_id (uuid)
- name (text) — "Bronce", "Plata", "Oro", "Platino"
- min_points_lifetime (int) — puntos acumulados para alcanzar nivel
- discount_percent (decimal) — descuento automático (ej: 5, 10, 15)
- multiplier (decimal, default 1.0) — multiplicador de puntos (1.5x, 2x)
- benefits (json, nullable) — beneficios adicionales
- sort_order (int)
- created_at

// RetailLoyaltyAccountEntity — Cuenta de puntos por cliente
@Entity({ tableName: 'retail_loyalty_accounts' })
- id (uuid PK)
- tenant_id, organization_id
- customer_id (uuid) — referencia a customers
- program_id (uuid)
- current_points (int, default 0)
- lifetime_points (int, default 0)
- tier_id (uuid, nullable) — nivel actual
- last_activity_at (timestamptz, nullable)
- created_at, updated_at

// RetailLoyaltyTransactionEntity — Movimientos de puntos
@Entity({ tableName: 'retail_loyalty_transactions' })
- id (uuid PK)
- tenant_id, organization_id
- account_id (uuid)
- type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus'
- points (int) — positivo = ganancia, negativo = gasto
- balance_after (int)
- reference_type: 'sale' | 'return' | 'manual' | 'campaign' | 'expiration'
- reference_id (uuid, nullable) — ID de la orden/devolución
- description (text, nullable)
- expires_at (timestamptz, nullable)
- created_at

// RetailCampaignEntity — Campañas de marketing
@Entity({ tableName: 'retail_campaigns' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Promo Navidad 2026"
- type: 'points_multiplier' | 'bonus_points' | 'discount' | 'whatsapp_blast'
- status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'
- target_segment: 'all' | 'tier' | 'inactive' | 'birthday' | 'custom'
- target_tier_id (uuid, nullable)
- target_days_inactive (int, nullable) — para segmento "inactive"
- config (json) — { multiplier: 2, bonus_points: 50, discount_percent: 20, message_template: "..." }
- starts_at (timestamptz)
- ends_at (timestamptz, nullable)
- total_recipients (int, default 0)
- total_redeemed (int, default 0)
- created_at, updated_at
```

### API Routes
- `GET/POST /api/retail-loyalty/programs` — CRUD programas
- `GET/POST /api/retail-loyalty/tiers` — CRUD niveles
- `GET /api/retail-loyalty/accounts` — Cuentas de clientes
- `GET /api/retail-loyalty/accounts/[customerId]` — Detalle cuenta
- `POST /api/retail-loyalty/accounts/earn` — Acumular puntos (post-venta)
- `POST /api/retail-loyalty/accounts/redeem` — Canjear puntos
- `GET/POST /api/retail-loyalty/campaigns` — CRUD campañas
- `POST /api/retail-loyalty/campaigns/send` — Ejecutar campaña WhatsApp

### UI (Backend Pages)
- `/backend/retail_loyalty/` — Dashboard programa (total miembros, puntos emitidos, canjes)
- `/backend/retail_loyalty/programs/` — Configuración del programa
- `/backend/retail_loyalty/tiers/` — Gestión de niveles
- `/backend/retail_loyalty/members/` — Lista de miembros con puntos/nivel
- `/backend/retail_loyalty/members/[id]/` — Detalle miembro (historial, nivel, ajustes)
- `/backend/retail_loyalty/campaigns/` — Lista campañas
- `/backend/retail_loyalty/campaigns/create/` — Crear campaña

### Workers
- `expire-points` — Expira puntos vencidos (cron diario)
- `recalculate-tiers` — Recalcula niveles por puntos lifetime (cron diario)

### ACL Features
- `retail_loyalty.view` — Ver programa y miembros
- `retail_loyalty.manage` — Configurar programa/niveles
- `retail_loyalty.adjust` — Ajustar puntos manualmente
- `retail_loyalty.campaigns` — Crear/ejecutar campañas

---

## Sprint 4: retail_returns — Devoluciones y Cambios

### Entidades

```typescript
// RetailReturnPolicyEntity — Política de devolución por categoría
@Entity({ tableName: 'retail_return_policies' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Electrónicos", "Ropa", "General"
- category_ids (json) — IDs de categorías del catálogo que aplican
- max_days (int) — días máximos para devolver (ej: 30)
- requires_receipt (boolean, default true)
- requires_original_packaging (boolean, default false)
- refund_method: 'original' | 'credit_note' | 'store_credit' | 'cash'
- restocking_fee_percent (decimal, default 0) — cargo por restock
- conditions (json, nullable) — condiciones adicionales
- is_active (boolean, default true)
- created_at, updated_at

// RetailReturnEntity — Solicitud de devolución
@Entity({ tableName: 'retail_returns' })
- id (uuid PK)
- tenant_id, organization_id
- return_number (text) — "DEV-001"
- branch_id (uuid) — sucursal donde se procesa
- customer_id (uuid, nullable)
- original_order_id (uuid, nullable) — referencia a SalesOrder
- status: 'requested' | 'approved' | 'inspecting' | 'completed' | 'rejected' | 'cancelled'
- reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'damaged_shipping' | 'other'
- reason_detail (text, nullable)
- refund_method: 'original' | 'credit_note' | 'store_credit' | 'cash'
- subtotal (decimal, precision 18, scale 2)
- restocking_fee (decimal, precision 18, scale 2, default 0)
- refund_amount (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- processed_by (uuid, nullable)
- processed_at (timestamptz, nullable)
- notes (text, nullable)
- created_at, updated_at

// RetailReturnLineEntity — Líneas de la devolución
@Entity({ tableName: 'retail_return_lines' })
- id (uuid PK)
- return_id (uuid)
- product_id (uuid)
- variant_id (uuid, nullable)
- quantity (int)
- unit_price (decimal, precision 18, scale 2)
- condition: 'new' | 'good' | 'damaged' | 'defective' | 'unsellable'
- restock (boolean, default true) — si se reingresa al inventario
- notes (text, nullable)

// RetailCreditNoteEntity — Nota de crédito retail
@Entity({ tableName: 'retail_credit_notes' })
- id (uuid PK)
- tenant_id, organization_id
- credit_note_number (text) — "NC-001"
- customer_id (uuid)
- return_id (uuid, nullable) — referencia a la devolución
- amount (decimal, precision 18, scale 2)
- balance (decimal, precision 18, scale 2) — saldo disponible
- currency (text, default 'USD')
- status: 'active' | 'partially_used' | 'fully_used' | 'expired' | 'cancelled'
- expires_at (timestamptz, nullable)
- created_at, updated_at
```

### API Routes
- `GET/POST /api/retail-returns/policies` — CRUD políticas
- `GET/POST /api/retail-returns/returns` — CRUD devoluciones
- `PUT /api/retail-returns/returns` — cambiar estado (aprobar, inspeccionar, completar)
- `GET /api/retail-returns/credit-notes` — Lista notas de crédito
- `POST /api/retail-returns/credit-notes/apply` — Aplicar NC a una compra

### UI (Backend Pages)
- `/backend/retail_returns/` — Lista devoluciones (DataTable con filtros por estado)
- `/backend/retail_returns/create/` — Crear devolución (buscar orden, seleccionar items)
- `/backend/retail_returns/[id]/` — Detalle devolución (inspección, aprobación)
- `/backend/retail_returns/policies/` — Gestión de políticas
- `/backend/retail_returns/credit-notes/` — Lista notas de crédito

### ACL Features
- `retail_returns.view` — Ver devoluciones
- `retail_returns.create` — Crear solicitudes
- `retail_returns.approve` — Aprobar/rechazar
- `retail_returns.inspect` — Inspeccionar condición
- `retail_returns.policies` — Gestionar políticas

---

## Sprint 5: retail_ecommerce — E-commerce Integrado

### Entidades

```typescript
// RetailStorefrontEntity — Configuración de tienda online
@Entity({ tableName: 'retail_storefronts' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Tienda Online"
- slug (text) — para URL: /tienda/[slug]
- is_active (boolean, default true)
- config (json) — { show_prices: true, allow_guest_checkout: false, min_order_usd: 10 }
- branding (json, nullable) — { logo_url, primary_color, banner_url }
- payment_methods (json) — ["pago_movil", "zelle", "binance", "efectivo"]
- delivery_zones (json, nullable) — zonas de delivery con tarifas
- social_links (json, nullable) — { instagram, whatsapp, tiktok }
- created_at, updated_at

// RetailOnlineOrderEntity — Pedido online (extiende concepto de SalesOrder)
@Entity({ tableName: 'retail_online_orders' })
- id (uuid PK)
- tenant_id, organization_id
- order_number (text) — "WEB-001"
- sales_order_id (uuid, nullable) — referencia a SalesOrder de Open Mercato
- customer_id (uuid, nullable)
- guest_name (text, nullable)
- guest_phone (text, nullable)
- guest_email (text, nullable)
- status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled'
- delivery_type: 'pickup' | 'delivery'
- delivery_address (json, nullable) — { line1, line2, city, state, reference }
- delivery_fee (decimal, precision 18, scale 2, default 0)
- subtotal (decimal, precision 18, scale 2)
- tax_amount (decimal, precision 18, scale 2, default 0)
- total (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- payment_method (text, nullable)
- payment_reference (text, nullable)
- payment_status: 'pending' | 'confirmed' | 'failed'
- estimated_delivery_at (timestamptz, nullable)
- delivered_at (timestamptz, nullable)
- notes (text, nullable)
- source: 'web' | 'whatsapp' | 'instagram'
- created_at, updated_at

// RetailOnlineOrderLineEntity — Líneas del pedido
@Entity({ tableName: 'retail_online_order_lines' })
- id (uuid PK)
- order_id (uuid)
- product_id (uuid)
- variant_id (uuid, nullable)
- product_title (text) — snapshot del nombre
- quantity (int)
- unit_price (decimal, precision 18, scale 2)
- total (decimal, precision 18, scale 2)

// RetailSocialPublishEntity — Publicaciones en redes
@Entity({ tableName: 'retail_social_publishes' })
- id (uuid PK)
- tenant_id, organization_id
- product_id (uuid)
- platform: 'instagram' | 'whatsapp' | 'tiktok' | 'facebook'
- content (text) — texto generado
- hashtags (text, nullable)
- image_urls (json, nullable)
- published_at (timestamptz, nullable)
- status: 'draft' | 'ready' | 'published'
- created_at
```

### API Routes
- `GET/POST /api/retail-ecommerce/storefronts` — CRUD storefronts
- `GET /api/retail-ecommerce/catalog` — Catálogo público (productos disponibles)
- `POST /api/retail-ecommerce/orders` — Crear pedido online
- `GET/PUT /api/retail-ecommerce/orders` — Lista/actualizar pedidos
- `POST /api/retail-ecommerce/publish` — Generar publicación social
- `GET /api/retail-ecommerce/dashboard` — KPIs e-commerce

### UI (Backend Pages)
- `/backend/retail_ecommerce/` — Dashboard e-commerce (pedidos hoy, pendientes, ingresos)
- `/backend/retail_ecommerce/orders/` — Lista pedidos online
- `/backend/retail_ecommerce/orders/[id]/` — Detalle pedido (cambiar estado, confirmar pago)
- `/backend/retail_ecommerce/storefront/` — Configuración tienda
- `/backend/retail_ecommerce/publish/` — Publicador social (generar texto + links)

### UI (Frontend/Público)
- `/(frontend)/tienda/[slug]/` — Catálogo público (grid de productos)
- `/(frontend)/tienda/[slug]/[productId]/` — Detalle producto
- `/(frontend)/tienda/[slug]/cart/` — Carrito + checkout
- `/(frontend)/tienda/[slug]/order/[token]/` — Tracking de pedido

### ACL Features
- `retail_ecommerce.view` — Ver pedidos
- `retail_ecommerce.manage` — Gestionar pedidos (confirmar, preparar, entregar)
- `retail_ecommerce.config` — Configurar storefront
- `retail_ecommerce.publish` — Publicar en redes

---

## Orden de Implementación por Sprint

| Sprint | Módulo | Archivos estimados | Dependencias |
|--------|--------|-------------------|--------------|
| 1 | `retail_branches` | ~18 archivos | Ninguna (base) |
| 2 | `retail_inventory` | ~16 archivos | retail_branches (branch_id) |
| 3 | `retail_loyalty` | ~18 archivos | customers (customer_id) |
| 4 | `retail_returns` | ~16 archivos | retail_branches, sales |
| 5 | `retail_ecommerce` | ~22 archivos | retail_branches, retail_inventory, catalog |

---

## Estructura de Archivos por Módulo (template)

```
src/modules/retail_<name>/
├── index.ts              — ModuleInfo (name, title, version, description)
├── acl.ts                — Feature definitions
├── setup.ts              — ModuleSetupConfig (defaultRoleFeatures)
├── di.ts                 — export function register(_: AppContainer) {}
├── events.ts             — createModuleEvents({ moduleId: ... })
├── data/
│   ├── entities.ts       — MikroORM entities (@Property con type: explícito)
│   └── validators.ts     — Zod schemas (create, update, list)
├── api/
│   ├── <resource>/route.ts  — makeCrudRoute con mapToEntity + applyToEntity
│   └── dashboard/route.ts   — KPIs endpoint
├── backend/
│   └── retail_<name>/
│       ├── page.meta.ts     — Nav entry (React.createElement SVG icon)
│       ├── page.tsx         — Lista principal (DataTable)
│       ├── create/
│       │   ├── page.meta.ts
│       │   └── page.tsx     — Formulario creación (CrudForm)
│       └── [id]/
│           ├── page.meta.ts
│           └── page.tsx     — Detalle/edición
├── i18n/
│   ├── es.json           — Traducciones español
│   └── en.json           — Traducciones inglés
└── workers/              — (solo si tiene workers)
    └── <worker-name>.ts
```

---

## Reglas de Implementación (Chainlock)

1. `@Property()` SIEMPRE con `type:` explícito
2. `di.ts` DEBE exportar `export function register(_: AppContainer) {}`
3. `makeCrudRoute` requiere `mapToEntity` + `applyToEntity`
4. `createModuleEvents` usa `moduleId:` (NO `module:`)
5. `em.create()` y `em.find()` en seeds usan `as any`
6. `(em as any).getKysely()` para queries cross-module
7. `page.meta.ts` usa `React.createElement('svg', ...)` para iconos (NO lucide imports)
8. Colores semánticos: `text-destructive`, `text-muted-foreground` (NO `text-red-500`)
9. Comunicación entre módulos: Kysely + event bus (NO imports directos)
10. i18n: `es.json` + `en.json` por módulo
11. API routes DEBEN exportar `metadata` con `requireAuth` y `requireFeatures`
12. Botones con `type="button"` explícito
13. Cada módulo se registra en `src/modules.ts` con `from: '@app'`

---

## Integración con Módulos Existentes

| Módulo Retail | Lee de... | Escribe en... |
|---|---|---|
| retail_branches | sales_channels (OM core) | retail_branches, retail_branch_staff, retail_transfers |
| retail_inventory | dist_inventory_items, dist_inventory_movements | retail_stock_counts, retail_stock_rotation |
| retail_loyalty | customers (OM core), sales_orders (OM core) | retail_loyalty_* |
| retail_returns | sales_orders (OM core), dist_inventory_items | retail_returns, retail_credit_notes |
| retail_ecommerce | catalog_products (OM core), dist_inventory_items | retail_online_orders, retail_social_publishes |

---

## Notas Técnicas

- **Moneda**: USD como base, con soporte para VES vía `venezuela_rates`
- **Fiscal**: Todas las ventas retail pasan por `ve_fiscal` (IVA 16%, IGTF si aplica)
- **WhatsApp**: Patrón `wa.me` links (no API directa) — mismo que tuition/dist_credit
- **Delivery**: Zonas configurables con tarifa fija por zona (no integración con courier)
- **Scanner**: Input de código de barras via campo de texto (los scanners emulan teclado)
- **Permisos por branch**: Se implementa como feature flag + filtro en queries (branch_id del staff)
