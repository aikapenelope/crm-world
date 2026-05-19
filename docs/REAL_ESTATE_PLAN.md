# Real Estate Vertical — Plan de Implementación

## Contexto

- Cada CRM es un sistema por empresa (no SaaS público, no trial, no self-service)
- Los usuarios se preconfiguran por la empresa
- Open Mercato ya tiene PWA nativa (no hay que crear otra)
- MercadoLibre se maneja como módulo compartido (un token, sirve datos a todos los tenants de real estate)
- Links a redes sociales son solo enlaces directos (no integración API)

---

## Lo que YA ESTÁ CONSTRUIDO (Open Mercato core)

No hay que tocar nada de esto. Ya funciona:

| Funcionalidad | Módulo core | Listo |
|---|---|---|
| Contactos CRUD (nombre, email, teléfono, empresa, notas) | `customers` | Si |
| Tags con colores | `customers` | Si |
| Fuentes de lead (Referido, Instagram, WhatsApp, etc.) | `customers` + `ve_tenant_defaults` | Si |
| Timeline de actividad por contacto | `customers` (activities) | Si |
| Pipeline Kanban (etapas configurables, drag & drop) | `customers` (deals) | Si |
| Calendario y citas (CRUD, vinculación a contacto) | `planner` | Si |
| Tareas (CRUD, fecha límite, completar/descompletar) | `customers` (todos) | Si |
| Documentos (upload, tipos, vinculación) | `attachments` | Si |
| Dashboard con widgets | `dashboards` | Si |
| Búsqueda global multi-entidad | `search` (Meilisearch) | Si |
| Notificaciones (tipos, badge, mark as read) | `notifications` | Si |
| Workflows (automatización si pasa X haz Y) | `workflows` | Si |
| Auth + roles + RBAC | `auth` | Si |
| Multi-moneda + tasas VE | `currencies` + `venezuela_rates` | Si |
| Métodos de pago VE | `payment_methods` | Si |
| Fiscal (RIF, IVA, IGTF) | `ve_fiscal` + `ve_tenant_defaults` | Si |
| Portal de clientes | `portal` + `customer_accounts` | Si |
| Branding por tenant (nombre, logo) | `directory` + custom fields | Si |

---

## Lo que HAY QUE CONSTRUIR

### Prioridad 1 — Core Real Estate (sin esto no funciona)

| # | Módulo | Qué hace | Entidades | Esfuerzo |
|---|---|---|---|---|
| 1 | `properties` | Propiedades: CRUD, tipos, operaciones, status, imágenes, GPS, links externos | properties, property_images, property_links | 5 días |
| 2 | `transactions` | Cierre de operación + comisiones (precio real, tasa, fecha cierre) | property_transactions | 3 días |
| 3 | `matching` | Motor de cruce: preferencias del contacto vs propiedades activas | contact_preferences, match_results | 3 días |

### Prioridad 2 — Valor agregado (mejora la experiencia)

| # | Módulo | Qué hace | Esfuerzo |
|---|---|---|---|
| 4 | `property_portal` | Página pública /p/[id] para compartir propiedad sin auth | 2 días |
| 5 | `property_docs` | Ficha PDF de 1 página (foto, specs, branding del agente) | 2 días |
| 6 | `property_publishing` | Texto pre-generado + links directos a portales (ML, FB, IG, TikTok) | 1 día |

### Prioridad 3 — Inteligencia (diferenciador)

| # | Módulo | Qué hace | Esfuerzo |
|---|---|---|---|
| 7 | `market_intelligence` | Tasación: KPIs por zona, rango P25-P75, comparables | 5 días |
| 8 | `mercadolibre_sync` | **Módulo compartido (capa superior)**: sync de listings de ML, sirve datos a todos los tenants RE | 5 días |

---

## Detalle de cada módulo a construir

### 1. `properties` (Prioridad 1)

**Entidades:**

```
properties
├── id, tenant_id, organization_id
├── title, description
├── type: apartamento | casa | terreno | comercial | oficina | galpon | otro
├── operation: venta | alquiler | venta_alquiler
├── status: draft | active | reserved | sold | rented | inactive
├── price, currency (USD default)
├── area_m2, bedrooms, bathrooms, parking
├── address_line, city, state, zip, country
├── latitude, longitude
├── commission_rate (default 5%)
├── created_at, updated_at, deleted_at

property_images (max 4 por propiedad)
├── id, property_id, tenant_id
├── url, order, is_cover
├── created_at

property_links (max 3 por propiedad)
├── id, property_id, tenant_id
├── platform: mercadolibre | facebook | instagram | otro
├── url
```

**APIs:**
- `/api/properties` — CRUD
- `/api/properties/[id]/images` — Upload/delete imágenes
- `/api/properties/[id]/links` — CRUD links externos

**Páginas admin:**
- `/backend/properties` — Listado con filtros (tipo, operación, status, ciudad)
- `/backend/properties/create` — Formulario de creación
- `/backend/properties/[id]` — Detalle con tabs (info, imágenes, links, matching, documentos)

---

### 2. `transactions` (Prioridad 1)

**Entidad:**

```
property_transactions
├── id, tenant_id, organization_id
├── property_id (FK)
├── contact_id (FK al comprador/inquilino)
├── type: sale | lease
├── closing_date
├── sale_price, currency
├── commission_rate, commission_amount
├── payment_method_code
├── notes
├── status: pending | completed | cancelled
├── created_at, updated_at, deleted_at
```

**Flujo:**
```
Propiedad (active) → Registrar cierre → Calcular comisión → Cambiar status (sold/rented)
```

---

### 3. `matching` (Prioridad 1)

**Entidades:**

```
contact_preferences (custom fields en customers, no tabla nueva)
├── preferred_property_type
├── preferred_city
├── preferred_operation
├── max_budget
├── min_area
├── min_bedrooms

match_results (generado por el motor)
├── id, tenant_id
├── contact_id, property_id
├── score (0-100)
├── criteria_matched (JSON)
├── created_at
```

**Motor:**
- Cruza propiedades `active` vs contactos con preferencias
- Score multi-criterio: tipo (30%), ciudad (25%), presupuesto (25%), área (10%), habitaciones (10%)
- Se ejecuta on-demand o por cron

---

### 4. `property_portal` (Prioridad 2)

Página pública `/p/[id]`:
- Carousel de fotos
- Specs (tipo, área, habitaciones, baños, parking)
- Precio + moneda
- Links externos
- Botón WhatsApp para contactar al agente
- Solo propiedades con status `active`

---

### 5. `property_docs` (Prioridad 2)

Genera PDF de 1 página:
- Foto principal
- Título + descripción corta
- Specs en grid
- Precio
- Logo + datos del agente (branding del tenant)
- QR code con link a la página pública

---

### 6. `property_publishing` (Prioridad 2)

- Genera texto descriptivo pre-formateado para copiar/pegar
- Links directos (solo abren la URL, no API):
  - MercadoLibre: `https://www.mercadolibre.com.ve/publicar`
  - Facebook Marketplace: `https://www.facebook.com/marketplace/create/item`
  - Instagram: `https://www.instagram.com/` (perfil del tenant)
  - TikTok: `https://www.tiktok.com/upload`

---

### 7. `market_intelligence` (Prioridad 3)

- Tasación manual: formulario con tipo, operación, ciudad, zona, área, habitaciones
- Devuelve: precio promedio, mediana, P25-P75, precio/m2, inventario
- Comparables: top 10 propiedades similares del mercado
- Datos vienen del módulo `mercadolibre_sync`

---

### 8. `mercadolibre_sync` (Prioridad 3 — Módulo compartido)

**Vive en la capa superior (aplica a todos los tenants de RE):**
- Un solo token de MercadoLibre (controlado por nosotros)
- Worker que sincroniza listings diariamente (apartamentos, casas, oficinas, locales)
- Almacena en tabla `market_listings` (compartida)
- Sirve datos a `market_intelligence` de cualquier tenant
- No publica — solo lee datos del mercado

---

## Cronograma

| Semana | Qué se construye |
|---|---|
| **1** | `properties` (entidades, API, páginas admin) |
| **2** | `properties` (imágenes, links, filtros) + `transactions` |
| **3** | `matching` + `property_portal` |
| **4** | `property_docs` + `property_publishing` |
| **5-6** | `market_intelligence` + `mercadolibre_sync` |

**Total: 6 semanas para la vertical completa.**

Prioridad 1 (semanas 1-2) deja un sistema funcional para un agente inmobiliario.

---

## Arquitectura de módulos

```
src/modules/
├── venezuela_rates/        ← Base (todos)
├── payment_methods/        ← Base (todos)
├── ve_fiscal/              ← Base (todos)
├── ve_tenant_defaults/     ← Base (todos)
├── properties/             ← Real Estate
├── transactions/           ← Real Estate
├── matching/               ← Real Estate
├── property_portal/        ← Real Estate
├── property_docs/          ← Real Estate
├── property_publishing/    ← Real Estate
├── market_intelligence/    ← Real Estate (usa mercadolibre_sync)
└── mercadolibre_sync/      ← Compartido (sirve a todos los RE)
```

Los módulos de Real Estate se activan via feature toggle solo para tenants inmobiliarios.
