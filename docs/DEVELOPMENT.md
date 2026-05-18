# CRM World — Guía de Desarrollo

Plataforma SaaS multi-vertical construida sobre [Open Mercato](https://github.com/open-mercato/open-mercato) (v0.6.1).

## Arquitectura

```
crm-world/
├── src/
│   ├── modules.ts              ← Registro central de módulos
│   ├── modules/                ← Módulos verticales (tu código)
│   │   ├── example/            ← Módulo de referencia (borrar en producción)
│   │   └── ...                 ← Aquí van las verticales
│   ├── bootstrap.ts            ← Inicialización de la app
│   ├── di.ts                   ← Overrides globales de DI
│   └── app/                    ← Next.js App Router (no tocar)
├── docker-compose.fullapp.yml  ← Stack de producción
├── Dockerfile                  ← Build multi-stage
└── package.json                ← Dependencias @open-mercato/*
```

## Verticales Planificadas

| Vertical | Módulos | Estado |
|----------|---------|--------|
| **Retail & E-Commerce** | loyalty, stock_sync, omnichannel | Pendiente |
| **Manufacturing** | production_orders, quality_control, bom | Pendiente |
| **Logistics & Distribution** | fleet, routes, warehouse | Pendiente |
| **Real Estate** | properties, leases, tenant_portal | Pendiente |
| **Education** | enrollment, courses, student_portal | Pendiente |
| **Agriculture & Food** | traceability, harvest, compliance | Pendiente |

Cada vertical se activa/desactiva por tenant usando feature toggles. Un cliente de retail no ve módulos de manufactura.

---

## Cómo Crear un Módulo

### Estructura mínima

```
src/modules/<modulo>/
├── index.ts          ← Metadata (nombre, título, versión)
├── acl.ts            ← Permisos (features RBAC)
├── setup.ts          ← Roles por defecto, seed de datos
├── di.ts             ← Registro de servicios (Awilix)
├── data/
│   ├── entities.ts   ← Entidades MikroORM (tablas)
│   └── validators.ts ← Schemas Zod (validación)
├── api/
│   └── <recurso>/route.ts  ← Endpoints REST (CRUD factory)
├── backend/
│   └── <pagina>/
│       ├── page.tsx       ← Componente React (admin UI)
│       └── page.meta.ts   ← Metadata (sidebar, permisos)
├── i18n/
│   ├── en.json
│   └── es.json
└── events.ts         ← Eventos del módulo
```

### Paso 1: Crear metadata

```ts
// src/modules/mi_modulo/index.ts
import type { ModuleInfo } from '@open-mercato/shared/modules/registry';

export const metadata: ModuleInfo = {
  name: 'mi_modulo',
  title: 'Mi Módulo',
  version: '0.1.0',
  description: 'Descripción corta del módulo.',
};
```

### Paso 2: Declarar permisos

```ts
// src/modules/mi_modulo/acl.ts
export const features = [
  { id: 'mi_modulo.view',   title: 'Ver registros',    module: 'mi_modulo' },
  { id: 'mi_modulo.create', title: 'Crear registros',  module: 'mi_modulo' },
  { id: 'mi_modulo.edit',   title: 'Editar registros', module: 'mi_modulo' },
  { id: 'mi_modulo.delete', title: 'Borrar registros', module: 'mi_modulo' },
];

export default features;
```

### Paso 3: Asignar permisos a roles por defecto

```ts
// src/modules/mi_modulo/setup.ts
import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup';

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['mi_modulo.*'],
    employee: ['mi_modulo.view'],
  },
};

export default setup;
```

### Paso 4: Definir entidades (tablas)

```ts
// src/modules/mi_modulo/data/entities.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity({ tableName: 'mi_modulo_items' })
export class MiModuloItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  tenant_id!: string;

  @Property()
  organization_id!: string;

  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date;
}
```

**Convenciones obligatorias:**
- UUID como primary key
- `tenant_id` + `organization_id` en toda entidad (multi-tenant)
- `created_at`, `updated_at`, `deleted_at` (soft delete)
- Nombres de tabla en plural, snake_case
- Importar decoradores de `@mikro-orm/decorators/legacy` (MikroORM v7)

### Paso 5: Crear validadores

```ts
// src/modules/mi_modulo/data/validators.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
```

### Paso 6: Crear API REST (CRUD factory)

```ts
// src/modules/mi_modulo/api/items/route.ts
import { z } from 'zod';
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory';
import { MiModuloItemEntity } from '../../data/entities';
import { createItemSchema, updateItemSchema } from '../../data/validators';

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
}).passthrough();

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mi_modulo.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mi_modulo.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mi_modulo.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mi_modulo.delete'] },
};

export const metadata = routeMetadata;

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MiModuloItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: { schema: createItemSchema },
  update: { schema: updateItemSchema },
});

export const GET = crud.GET;
export const POST = crud.POST;
export const PUT = crud.PUT;
export const DELETE = crud.DELETE;

export const openApi = {};
```

**`makeCrudRoute` maneja automáticamente:**
- Filtrado por tenant_id y organization_id
- Soft deletes
- Validación con Zod
- RBAC por método HTTP
- Paginación

### Paso 7: Crear página de admin

```tsx
// src/modules/mi_modulo/backend/mi_modulo/page.tsx
const MiModuloPage = () => {
  return (
    <div className="container">
      <h1>Mi Módulo</h1>
      <p>Contenido del módulo aquí.</p>
    </div>
  );
};

export default MiModuloPage;
```

```ts
// src/modules/mi_modulo/backend/mi_modulo/page.meta.ts
import type { PageMetadata } from '@open-mercato/shared/modules/registry';

export const metadata: PageMetadata = {
  title: 'Mi Módulo',
  group: 'Operations',
  order: 30,
  requireAuth: true,
  requireFeatures: ['mi_modulo.view'],
};
```

### Paso 8: Registrar el módulo

Agregar en `src/modules.ts`:

```ts
{ id: 'mi_modulo', from: '@app' },
```

### Paso 9: Generar y verificar

```bash
yarn generate
yarn mercato configs cache structural --all-tenants
# Reiniciar dev server o esperar hot reload
```

---

## Convenciones Importantes

### Nombres

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| ID de módulo | snake_case, plural | `production_orders` |
| Tabla de DB | snake_case, plural | `production_order_items` |
| Columna de DB | snake_case | `organization_id` |
| Variables JS/TS | camelCase | `orderTotal` |
| Archivos | snake_case o kebab-case | `entities.ts`, `page.meta.ts` |
| Feature IDs | `modulo.accion` | `loyalty.redeem` |
| Event IDs | `modulo.entidad.accion` | `loyalty.points.earned` |

### Multi-tenancy

Toda entidad DEBE incluir:
- `tenant_id: string` — identifica al tenant (cliente)
- `organization_id: string` — identifica la organización dentro del tenant

El query engine filtra automáticamente por estos campos. Nunca expongas datos cross-tenant.

### Soft Deletes

Nunca borrar registros físicamente. Usar `deleted_at` y filtrar con `softDeleteField` en el CRUD factory.

### Validación

- Toda entrada de usuario se valida con Zod
- Schemas en `data/validators.ts`
- Tipos derivados con `z.infer<typeof schema>`
- No usar `any`

### i18n

- No hardcodear strings visibles al usuario
- Usar archivos JSON en `i18n/` por idioma
- Client-side: `useT()` hook
- Server-side: `resolveTranslations()`

---

## Patrones Avanzados (nivel medio)

### Eventos entre módulos

```ts
// src/modules/mi_modulo/events.ts
import { createModuleEvents } from '@open-mercato/shared/modules/events';

export const eventsConfig = createModuleEvents({
  module: 'mi_modulo',
  events: [
    { id: 'mi_modulo.item.created', label: 'Item created', entity: 'item' },
    { id: 'mi_modulo.item.updated', label: 'Item updated', entity: 'item' },
    { id: 'mi_modulo.item.deleted', label: 'Item deleted', entity: 'item' },
  ],
} as const);
```

### Subscribers (reaccionar a eventos)

```ts
// src/modules/mi_modulo/subscribers/on-order-completed.ts
export const metadata = {
  event: 'sales.order.completed',
  persistent: true,
  id: 'mi_modulo.on-order-completed',
};

export default async function handler(payload: any, ctx: any) {
  // Lógica cuando se completa una orden
  // Ejemplo: sumar puntos de lealtad
}
```

### Widget Injection (inyectar UI en otros módulos)

Para agregar un widget en la página de detalle de un cliente:

```ts
// src/modules/mi_modulo/widgets/injection/customer-extra/widget.ts
import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets';

const widget: InjectionWidgetModule = {
  metadata: {
    id: 'mi_modulo.customer-extra',
    title: 'Extra Info',
  },
  component: () => import('./widget.client'),
};

export default widget;
```

```ts
// src/modules/mi_modulo/widgets/injection-table.ts
export const injectionTable = {
  'mi_modulo.customer-extra': 'crud-form:customers.person',
};
```

### Custom Fields (campos dinámicos por tenant)

```ts
// src/modules/mi_modulo/ce.ts
import { defineFields, cf } from '@open-mercato/shared/modules/dsl';

export const entities = [
  defineFields('mi_modulo.item', [
    cf.text('priority', { label: 'Priority Level' }),
    cf.select('status', {
      label: 'Status',
      options: ['pending', 'active', 'completed'],
    }),
  ]),
];
```

### Overlay Overrides (modificar módulos core sin fork)

Para cambiar la página de listado de clientes:

```tsx
// src/modules/customers/backend/customers/people/page.tsx
// Este archivo REEMPLAZA la página original del módulo customers
const CustomPeoplePage = () => {
  return <div>Mi versión personalizada de la lista de personas</div>;
};

export default CustomPeoplePage;
```

---

## Flujo de Trabajo

### Desarrollo local

```bash
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET, REDIS_URL
docker compose up -d          # PostgreSQL + Redis + Meilisearch
yarn install
yarn setup                    # Genera, migra, seed
yarn dev                      # http://localhost:3000/backend
```

### Crear migración de base de datos

```bash
# Después de modificar entities.ts
yarn db:generate              # Genera SQL de migración
yarn db:migrate               # Aplica la migración
```

### Deploy a producción

Cada push a `main` redespliega automáticamente via Coolify.

```bash
git add -A
git commit -m "feat: add loyalty module"
git push origin main
# Coolify detecta → build → deploy (~10-15 min primera vez, ~5-7 min después)
```

### Actualizar Open Mercato

```bash
yarn up '@open-mercato/*'     # Actualiza paquetes
yarn generate                 # Regenera registros
yarn db:migrate               # Aplica migraciones nuevas
git add -A && git commit -m "chore: upgrade open-mercato packages"
git push origin main
```

---

## Infraestructura

| Componente | Detalle |
|---|---|
| **Servidor** | Hetzner CX33, Helsinki (65.108.61.137) |
| **OS** | Ubuntu 24.04 |
| **PaaS** | Coolify 4.0 (https://deploy.novaincs.com) |
| **App** | https://mercato.novaincs.com |
| **Infra como código** | [mercatinfra](https://github.com/aikapenelope/mercatinfra) (Pulumi) |
| **Secrets** | Pulumi ESC (`aikapenelope-org/mercato-secrets`) |

### Servicios en producción

| Servicio | Imagen | Propósito |
|---|---|---|
| App (Next.js) | Build desde Dockerfile | Aplicación principal |
| PostgreSQL 17 | pgvector/pgvector:pg17-trixie | Base de datos + vectores |
| Redis 7 | redis:7-alpine | Cache + eventos + colas |
| Meilisearch 1.11 | getmeili/meilisearch:v1.11 | Búsqueda full-text |

### Seguridad aplicada

- TLS automático (Let's Encrypt via Coolify/Traefik)
- Firewall UFW (solo 22, 80, 443, 8000)
- fail2ban (SSH brute-force)
- Secrets generados con `openssl rand -hex 32`
- Encriptación de datos por tenant (AES-GCM)
- Rate limiting habilitado
- Soft deletes (no se borran datos)
- RBAC por features (no por roles)
- Backups diarios automáticos (PostgreSQL)
- Swap 4 GB (previene OOM durante builds)
- Memory limits en containers

---

## Referencia Rápida

### Módulos core disponibles (ya activos)

| Módulo | Qué hace |
|---|---|
| `auth` | Login, roles, RBAC, sesiones |
| `customers` | CRM: personas, empresas, deals, actividades |
| `catalog` | Productos, categorías, variantes, precios |
| `sales` | Órdenes, cotizaciones, facturas, envíos |
| `currencies` | Multi-moneda, tasas de cambio |
| `workflows` | Automatización con editor visual |
| `notifications` | Notificaciones in-app |
| `messages` | Mensajería interna |
| `search` | Búsqueda full-text + vectorial |
| `ai_assistant` | Asistente AI con tools por módulo |
| `portal` | Portal de clientes (self-service) |
| `customer_accounts` | Auth de clientes del portal |
| `integrations` | Marketplace de integraciones |
| `data_sync` | Sincronización de datos |
| `payment_gateways` | Pasarelas de pago |
| `shipping_carriers` | Carriers de envío |
| `webhooks` | Webhooks entrantes/salientes |
| `feature_toggles` | Feature flags por tenant |
| `business_rules` | Motor de reglas de negocio |

### Comandos esenciales

```bash
yarn dev                      # Desarrollo con hot reload
yarn generate                 # Regenerar registros de módulos
yarn db:generate              # Generar migración de DB
yarn db:migrate               # Aplicar migraciones
yarn build                    # Build de producción
yarn lint                     # Linting
yarn test                     # Tests
yarn mercato eject --list     # Ver módulos ejectables
yarn mercato auth setup       # Crear nuevo tenant
```
