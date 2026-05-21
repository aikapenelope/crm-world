# Best Practices — Aika Platform

> Documento consolidado de buenas prácticas para desarrollo en este repo.
> Combina las reglas Chainlock de `PATTERNS.md`, los patrones del `COOKBOOK.md`,
> y las guías oficiales de Open Mercato (`packages/*/AGENTS.md`).
>
> **Última auditoría**: 2026-05 (comparada contra OM v0.6.1 + `open-mercato/AGENTS.md`)

---

## Índice

1. [Estructura mínima de módulo](#1-estructura-mínima-de-módulo)
2. [Entidades MikroORM](#2-entidades-mikroorm)
3. [Rutas CRUD (`makeCrudRoute`)](#3-rutas-crud-makecrudroute)
4. [Rutas custom (Kysely directo)](#4-rutas-custom-kysely-directo)
5. [Eventos y Real-time (clientBroadcast)](#5-eventos-y-real-time-clientbroadcast)
6. [Search (`search.ts`)](#6-search-searchts)
7. [AI Agents (`ai-agents.ts` + `ai-tools.ts`)](#7-ai-agents-ai-agentsts--ai-toolsts)
8. [UI — Componentes y páginas](#8-ui--componentes-y-páginas)
9. [ACL y permisos](#9-acl-y-permisos)
10. [Workers y jobs background](#10-workers-y-jobs-background)
11. [Patrones cross-module](#11-patrones-cross-module)
12. [Compatibilidad con updates de OM](#12-compatibilidad-con-updates-de-om)
13. [Estado actual del repo — auditoría](#13-estado-actual-del-repo--auditoría)

---

## 1. Estructura mínima de módulo

```
src/modules/<module>/
├── index.ts              # ModuleInfo: name, title, version, description
├── acl.ts                # export const features = ['module.view', 'module.create', ...]
├── setup.ts              # ModuleSetupConfig con defaultRoleFeatures + onTenantCreated
├── di.ts                 # export function register(_: AppContainer) {}  ← OBLIGATORIO vacío
├── events.ts             # createModuleEvents({ moduleId: '...', events: [...] }) as const
├── data/
│   ├── entities.ts       # MikroORM con @Property({ type: '...' }) SIEMPRE
│   └── validators.ts     # Zod schemas + z.infer<typeof schema>
├── api/<resource>/
│   └── route.ts          # makeCrudRoute o handler custom — SIEMPRE exporta openApi
├── backend/<module>/
│   ├── page.tsx          # 'use client' — página principal del módulo
│   └── <subpage>/page.tsx
├── i18n/
│   ├── es.json
│   └── en.json
└── [opcional]
    ├── search.ts          # SearchModuleConfig para búsqueda Cmd+K
    ├── ai-agents.ts       # AiAgentDefinition[]
    ├── ai-tools.ts        # defineAiTool definitions
    ├── workers/           # Background jobs
    ├── subscribers/       # Event subscribers
    ├── notifications.ts   # Tipos de notificación
    └── api/interceptors.ts
```

### Registro en `src/modules.ts`

```typescript
{ id: 'mi_modulo', from: '@app' }
```

---

## 2. Entidades MikroORM

### Regla CHAINLOCK #1 — `@Property()` SIEMPRE con `type:` explícito

Turbopack no emite `emitDecoratorMetadata`. Sin `type:`, MikroORM crashea en runtime.

```typescript
// ✅ CORRECTO
@Property({ type: 'text' }) tenant_id!: string
@Property({ type: 'uuid' }) property_id!: string
@Property({ type: 'boolean', default: false }) is_active: boolean = false
@Property({ type: 'int', default: 0 }) sort_order: number = 0
@Property({ type: 'decimal', precision: 18, scale: 2 }) price!: string
@Property({ type: 'timestamptz' }) created_at: Date = new Date()
@Property({ type: 'timestamptz', nullable: true }) deleted_at?: Date | null
@Property({ type: 'json' }) tags: string[] = []

// ❌ INCORRECTO
@Property() tenant_id!: string
@Property({ length: 100 }) city!: string
```

### Referencia de tipos

| TypeScript | MikroORM type |
|-----------|---------------|
| `string` | `'text'` |
| string UUID | `'uuid'` |
| string decimal | `'decimal'` + `precision/scale` |
| `number` int | `'int'` o `'smallint'` |
| `boolean` | `'boolean'` |
| `Date` | `'timestamptz'` |
| `string[]` / `any[]` | `'json'` |

### `em.create()` / `em.find()` — usar `as any`

MikroORM v7 strict types requiere todos los campos en `em.create()`.

```typescript
// ✅ CORRECTO
const entry = em.create(MyEntity, { tenant_id, organization_id, ...data } as any)
const existing = await em.find(MyEntity, { tenant_id, deleted_at: null } as any)
```

---

## 3. Rutas CRUD (`makeCrudRoute`)

### Regla CHAINLOCK #3 — `mapToEntity` + `applyToEntity` obligatorios

```typescript
// ✅ CORRECTO
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
  // ⚡ IMPORTANTE: incluir indexer para que los registros sean buscables
  indexer: { entityType: 'mi_modulo:mi_entidad' },
})
```

### `openApi` — SIEMPRE exportar

```typescript
// Mínimo aceptable (no bloquea build pero no documenta nada)
export const openApi = {}

// Recomendado para rutas CRUD — usar factory
import { createCrudOpenApiFactory } from '@open-mercato/shared/lib/openapi/crud'
export const buildModuleCrudOpenApi = createCrudOpenApiFactory({ defaultTag: 'MiModulo' })
export const openApi = buildModuleCrudOpenApi({
  resourceName: 'MiRecurso',
  querySchema: listSchema,
  listResponseSchema: createPagedListResponseSchema(itemSchema),
  create: { schema: createSchema, description: 'Crear un registro' },
  update: { schema: updateSchema, responseSchema: okSchema, description: 'Actualizar' },
})
```

### Interceptores para emit() lifecycle

Para emitir eventos `clientBroadcast` desde rutas `makeCrudRoute`, usar `api/interceptors.ts`:

```typescript
// src/modules/mi_modulo/api/interceptors.ts
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'mi_modulo.recurso-broadcast',
    targetRoute: 'mi-modulo/recurso',  // guiones, sin /api/ prefix
    methods: ['POST'],
    priority: 10,
    async before() { return { ok: true } },
    async after(_request, _response, context) {
      await emitLifecycle(
        eventsConfig,
        'mi_modulo.recurso.creado',
        { tenantId: context.tenantId, organizationId: context.organizationId },
      )
      return {}
    },
  },
]
```

---

## 4. Rutas custom (Kysely directo)

### Regla CHAINLOCK #2 — Cast `(em as any).getKysely()`

```typescript
export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()   // ← cast SIEMPRE
  // ...
}
```

### Regla CHAINLOCK #5 — Firma de handler

```typescript
// ✅ CORRECTO — ctx como segundo argumento tipado como any
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope  // { tenantId, organizationId }
}
```

### Regla CHAINLOCK #10 — NO usar `kysely.fn.count/sum/ref`

Usar agregaciones en JavaScript, no en SQL:

```typescript
// ❌ INCORRECTO
.select(kysely.fn.count('id').as('total'))

// ✅ CORRECTO — traer los registros y contar en JS
const rows = await kysely.selectFrom('mi_tabla').select(['id']).execute()
const total = rows.length
```

### emit() DESPUÉS del UPDATE

```typescript
// 1. Realiza el cambio en BD
await kysely.updateTable('mi_tabla')
  .set({ status: 'nuevo_estado', updated_at: new Date() })
  .where('id', '=', entity_id)
  .execute()

// 2. Emite el evento DESPUÉS de que el UPDATE se confirme
await emitLifecycle(eventsConfig, 'mi_modulo.entidad.accion', scope, {
  id: entity_id,
  new_status: 'nuevo_estado',
})

return Response.json({ success: true })
```

### Mutation guard (recomendado para mutaciones)

OM AGENTS dice que las rutas custom de mutación DEBERÍAN llamar al mutation guard:

```typescript
import { validateCrudMutationGuard, runCrudMutationGuardAfterSuccess } 
  from '@open-mercato/shared/lib/crud/mutation-guard'

export async function POST(request: Request, ctx: any) {
  const guardResult = await validateCrudMutationGuard(request, ctx)
  if (!guardResult.ok) return guardResult.response

  // ... tu lógica de mutación ...

  await runCrudMutationGuardAfterSuccess(request, ctx, guardResult)
  return Response.json({ success: true })
}
```

---

## 5. Eventos y Real-time (clientBroadcast)

### Regla CHAINLOCK #4 — `moduleId:` (no `module:`)

```typescript
// ✅ CORRECTO
export const eventsConfig = createModuleEvents({
  moduleId: 'mi_modulo',
  events: [
    // clientBroadcast: true → el browser recibe el evento via SSE sin polling
    { id: 'mi_modulo.entidad.accion', label: 'Descripción', entity: 'entidad',
      category: 'lifecycle', clientBroadcast: true },
  ],
} as const)   // ← as const SIEMPRE para type safety
```

### Arquitectura completa

```
eventsConfig.emit('mi_modulo.entidad.accion', { tenantId, organizationId, id })
  → eventBus.emit()
  → isBroadcastEvent() == true (porque clientBroadcast: true en events.ts)
  → publishCrossProcessEvent() via pg_notify
  → SSE endpoint /api/events/stream (filtra por tenantId)
  → useAppEvent('mi_modulo.entidad.accion', handler) en el browser
```

**IMPORTANTE**: Si `clientBroadcast: true` no está en `events.ts`, el emit() no llega al browser aunque la ruta llame `emitLifecycle()`.

### Cuándo usar `clientBroadcast: true`

```
✅ Cambios de estado que la UI debe reflejar inmediatamente (pago, aprobación)
✅ Acciones que múltiples usuarios pueden ver simultáneamente (votaciones)
✅ Alertas sin recarga de página (morosos, urgentes, completado)
❌ Eventos CRUD masivos que crearían flood (entity.updated en listas largas)
❌ Eventos internos sin representación visual
```

### Consumir en componente React

```typescript
'use client'
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'

export default function MiPagina() {
  useAppEvent('mi_modulo.entidad.accion', (event) => {
    // event.id, event.payload, event.tenantId
    setItems(prev => prev.map(i => i.id === event.payload.id ? { ...i, ...event.payload } : i))
  }, [])
  // wildcards disponibles: 'mi_modulo.*', 'mi_modulo.entidad.*'
}
```

### Portal real-time (portalBroadcast)

Para enviar eventos al portal del cliente (propietarios, distribuidores, etc.):

```typescript
{ id: 'condo_fees.receipt.paid', ..., clientBroadcast: true, portalBroadcast: true }
```

En el portal:
```typescript
import { usePortalAppEvent } from '@open-mercato/ui/portal/hooks/usePortalAppEvent'
usePortalAppEvent('condo_fees.receipt.paid', (event) => { refetch() })
```

### §Pendientes — emit() aún sin cableado

Ver `docs/REALTIME.md §Pendientes` para la lista completa de los 13 eventos declarados
que aún necesitan su llamada `emit()` en la ruta/worker correspondiente.

---

## 6. Search (`search.ts`)

### Estructura correcta

```typescript
import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mi_modulo:mi_entidad',  // debe coincidir con entity registry
      enabled: true,
      priority: 20,

      // FULLTEXT: campos buscables en Meilisearch
      fieldPolicy: {
        searchable: ['nombre', 'descripcion', 'estado'],
        hashOnly: ['email', 'telefono', 'rif'],  // PII — solo exact match
        excluded: ['password', 'token'],          // nunca indexar
      },

      // VECTOR: texto para embeddings semánticos
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.nombre) lines.push(`Nombre: ${r.nombre}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: { title: String(r.nombre ?? ''), icon: 'building' },
          links: [{ href: `/backend/mi_modulo/${r.id}`, label: 'Ver', kind: 'primary' }],
          // OBLIGATORIO: para que el indexer detecte cambios y evite re-indexar innecesariamente
          checksumSource: { nombre: r.nombre, estado: r.estado, updated_at: r.updated_at },
        }
      },

      // TOKENS: cómo mostrar el resultado en búsqueda keyword
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        return {
          title: String(ctx.record.nombre ?? 'Sin nombre'),
          subtitle: String(ctx.record.estado ?? ''),
          icon: 'building',
        }
      },

      // URL de detalle del registro — usar [id] cuando la página exista
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        if (!id) return null
        return `/backend/mi_modulo/${encodeURIComponent(String(id))}`
        // Si no hay página de detalle aún: return `/backend/mi_modulo`
      },

      resolveLinks: async (ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/mi_modulo`, label: 'Ver lista', kind: 'secondary' }]
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
```

### Checklist antes de agregar `search.ts`

- [ ] `entityId` coincide con el entity registry (formato `modulo:entidad`)
- [ ] `fieldPolicy.excluded` lista campos sensibles (tokens, passwords)
- [ ] `fieldPolicy.hashOnly` lista PII (email, teléfono, RIF/CI)
- [ ] `buildSource` incluye `checksumSource`
- [ ] `formatResult` definido (no confiar en fallback para tokens)
- [ ] `resolveUrl` apunta a página de detalle `[id]` si existe
- [ ] CRUD routes del módulo tienen `indexer: { entityType: 'modulo:entidad' }`

---

## 7. AI Agents (`ai-agents.ts` + `ai-tools.ts`)

### Estructura de `ai-agents.ts`

```typescript
import type { AiAgentDefinition } from '@open-mercato/ai-assistant'

const miAsistente: AiAgentDefinition = {
  id: 'mi_modulo.mi_asistente',
  moduleId: 'mi_modulo',
  label: 'Nombre del asistente',
  description: 'Descripción breve para la UI de selección de agentes.',
  systemPrompt: '...',  // construir con promptSections.sort().join('\n\n')
  allowedTools: [
    'mi_modulo.get_resumen',
    'search.hybrid_search',
    'search.get_record_context',
  ],
  executionMode: 'chat',       // 'chat' | 'object'
  readOnly: true,              // true si solo lee datos
  mutationPolicy: 'read-only', // 'read-only' | 'with-approval' | 'direct'
  requiredFeatures: ['mi_modulo.view'],
  domain: 'mi_modulo',
  keywords: ['keyword1', 'keyword2'],
  suggestions: [
    { label: 'Pregunta sugerida', prompt: '¿Texto completo de la pregunta?' },
  ],
}

// ← AMBAS exportaciones obligatorias
export const aiAgents: AiAgentDefinition[] = [miAsistente]
export default aiAgents
```

### Estructura de `ai-tools.ts`

```typescript
import { defineAiTool } from '@open-mercato/ai-assistant'

const getMiResumen = defineAiTool({
  name: 'mi_modulo.get_resumen',
  description: 'Obtiene el resumen del módulo.',
  parameters: { tenant_id: { type: 'string', description: '...' } },
  async execute({ tenant_id }, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    // ... query
    return { data: resultado }
  },
})

export const aiTools = [getMiResumen]
export default aiTools
```

### Regla de mutaciones AI

**Nunca** escribir directamente desde un tool handler. Si el agente necesita mutar:

```typescript
import { prepareMutation } from '@open-mercato/ai-assistant'

// Dentro de un tool execute():
const pending = await prepareMutation(ctx, {
  description: 'Crear factura para cliente X por $500',
  payload: { client_id, amount: 500 },
})
return { pendingActionId: pending.id, message: 'Pendiente de aprobación' }
```

---

## 8. UI — Componentes y páginas

### Regla CHAINLOCK — No `<button>` raw

```typescript
// ❌ INCORRECTO
<button type="button" onClick={...}>Guardar</button>

// ✅ CORRECTO
import { Button } from '@open-mercato/ui/primitives/button'
<Button type="button" variant="outline" size="sm" onClick={...}>Guardar</Button>
```

### Regla CHAINLOCK — Colores semánticos

```typescript
// ❌ INCORRECTO — colores hardcoded
<span className="text-red-500">Error</span>
<span className="bg-green-100 text-green-800">Activo</span>

// ✅ CORRECTO — tokens semánticos de OM
<span className="text-destructive">Error</span>
<Badge variant="success">Activo</Badge>
```

### Regla CHAINLOCK — No `lucide-react` en `page.meta.ts`

```typescript
// ❌ INCORRECTO
import { Building } from 'lucide-react'
export const metadata = { icon: <Building /> }  // en page.meta.ts

// ✅ CORRECTO
export const metadata = {
  icon: React.createElement('svg', { ... })  // SVG inline
}
```

### No `fetch` raw en UI — usar `apiCall`

```typescript
// ❌ INCORRECTO
const res = await fetch(`/api/mi-endpoint`)
const data = await res.json()

// ✅ CORRECTO
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
const { data } = await apiCall('/api/mi-endpoint')
```

### No `window.confirm` — usar `ConfirmDialog`

```typescript
// ❌ INCORRECTO
if (window.confirm('¿Estás seguro?')) { ... }

// ✅ CORRECTO
import { useConfirmDialog } from '@open-mercato/ui/backend/confirm-dialog'
const { confirm } = useConfirmDialog()
const confirmed = await confirm({ title: '¿Estás seguro?', description: '...' })
if (confirmed) { ... }
```

### CrudForm para formularios create/edit

```typescript
// ✅ Siempre usar CrudForm para formularios, no forms manuales
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'

// Para páginas con writes que NO pueden usar CrudForm:
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
const { runMutation } = useGuardedMutation()
await runMutation({ operation: 'POST', mutationPayload: data })
```

### page.meta.ts — Páginas backend

```typescript
// src/modules/mi_modulo/backend/mi_modulo/page.meta.ts
import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Mi Módulo',
  titleKey: 'mi_modulo.title',
  requireAuth: true,
  requireFeatures: ['mi_modulo.view'],
  // icon: React.createElement('svg', { viewBox: '0 0 24 24', ... }, ...)
}
```

### Portal pages — `page.meta.ts` obligatorio

```typescript
// src/modules/condo_portal/frontend/[orgSlug]/portal/receipts/page.meta.ts
export const metadata: PageMetadata = {
  requireCustomerAuth: true,
  requireCustomerFeatures: ['portal.receipts.view'],
  nav: { label: 'Mis recibos', group: 'main', order: 20, icon: 'receipt' },
}
```

---

## 9. ACL y permisos

### `acl.ts` — nombrar features como `modulo.accion`

```typescript
export const features = [
  'mi_modulo.view',
  'mi_modulo.create',
  'mi_modulo.edit',
  'mi_modulo.delete',
  // features específicas
  'mi_modulo.generate',
  'mi_modulo.approve',
]
```

### `setup.ts` — `defaultRoleFeatures` SIEMPRE presente

```typescript
import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['mi_modulo.*'],
    admin: ['mi_modulo.*'],
    employee: ['mi_modulo.view', 'mi_modulo.create'],
  },
  async onTenantCreated({ em, tenantId, organizationId }) {
    // Config inicial del tenant — IDEMPOTENTE
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    // Datos de referencia: diccionarios, tipos, estados
  },
}
export default setup
```

### Guardar guards en páginas (no roles)

```typescript
// ❌ INCORRECTO — roles son mutables
requireRoles: ['admin']

// ✅ CORRECTO — features son inmutables
requireFeatures: ['mi_modulo.view']
```

---

## 10. Workers y jobs background

### Estructura de worker

```typescript
// src/modules/mi_modulo/workers/mi-worker.ts
export const metadata = {
  queue: 'mi-modulo-queue',
  id: 'mi-modulo-worker',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const { tenantId, organizationId } = payload
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  // ... lógica ...

  // Emitir evento con scope del job (no ctx.scope)
  await emitLifecycle(
    eventsConfig,
    'mi_modulo.entidad.accion',
    { tenantId, organizationId },
    { id: entity_id, affected_count: count },
  )
}
```

### Workers con múltiples tenants

Cuando un worker procesa registros de diferentes tenants, emitir por tenant:

```typescript
for (const record of records) {
  await emitLifecycle(eventsConfig, 'mi_modulo.alerta', {
    tenantId: record.tenant_id as string,
    organizationId: record.organization_id as string,
  }, { id: record.id as string })
}
```

---

## 11. Patrones cross-module

### Regla CHAINLOCK #9 — Nunca imports directos entre módulos custom

```typescript
// ❌ INCORRECTO — acoplamiento directo
import { Condo } from '../condo_properties/data/entities'

// ✅ CORRECTO — queries Kysely cross-module
const kysely = (em as any).getKysely()
const condo = await kysely.selectFrom('condo_units').select(['id', 'name']).where('id', '=', id).executeTakeFirst()

// ✅ CORRECTO — event bus para side effects
await eventsConfig.emit('mi_modulo.entidad.accion', { tenantId, organizationId, id })
```

### Query de tablas OM core desde módulos custom

Solo via Kysely para lectura. Las tablas core estables son:
- `organizations` — `id`, `name`, `slug`
- `tenants` — `id`
- `users` — `id`, `full_name`, `email`
- `role_feature_grants` — para verificar features
- `venezuela_exchange_rates` — rates BCV

---

## 12. Compatibilidad con updates de OM

### Lo que es estable

| Patrón | Riesgo |
|--------|--------|
| `from: '@app'` en modules.ts | Bajo — nuestros módulos no colisionan con OM |
| Prefijos de tabla (`condo_`, `auto_`, `const_`, `dist_`) | Bajo — sin colisión con tablas OM |
| `@open-mercato/shared` imports | Bajo — API pública estable |
| `@open-mercato/ui` imports | Bajo — API pública estable |
| `makeCrudRoute` / `createModuleEvents` | Bajo — API estable |

### Lo que tiene riesgo en updates

| Patrón | Riesgo | Mitigación |
|--------|--------|-----------|
| `(em as any).getKysely()` | Medio | El cast `as any` absorbe cambios de tipo pero no de nombre. Ver incidentes en PATTERNS.md |
| Queries directas a tablas OM core (`organizations`, `tenants`) | Medio | Si OM renombra columnas, se rompe. Usar solo columnas documentadas |
| Sin archivos de migración formales por módulo | Medio | Agregar `.snapshot-open-mercato.json` por módulo en el futuro |
| `example` module activo en producción | Alto | Remover `{ id: 'example', from: '@app' }` de modules.ts |

### Procedimiento seguro ante update de OM

1. Leer `CHANGELOG.md` del update antes de aplicarlo
2. Revisar `BACKWARD_COMPATIBILITY.md` de OM para breaking changes en contract surfaces
3. Buscar cambios en `packages/shared/src/lib/crud/` — si cambia la API de `makeCrudRoute`, ajustar módulos custom
4. Correr `yarn generate` después de actualizar
5. Verificar que `yarn.lock` se regenera completo (ver Chainlock #11)
6. Hacer deploy a staging primero — el primer request compila cold start

---

## 13. Estado actual del repo — auditoría

> Auditoría ejecutada contra main, mayo 2026.

### ✅ Correcto

| Área | Detalle |
|------|---------|
| Chainlock violations | 0 en código nuevo — todos los PRs pasan |
| `@Property({ type: '...' })` | 100% completo en módulos custom |
| `moduleId:` en createModuleEvents | ✅ todos los módulos |
| `di.ts` exporta `register` | ✅ todos los módulos |
| `acl.ts` con features | 59/61 módulos |
| `setup.ts` + `defaultRoleFeatures` | 57/59 módulos (falta `venezuela_rates`, `ve_tenant_defaults`) |
| AI agents activos | 7 verticales × 1 agente = 7 agentes |
| `search.ts` con entidades searchables | 9 módulos con búsqueda configurada |
| `clientBroadcast: true` declarado | 9 módulos — todos los eventos lifecycle relevantes |
| `emitLifecycle()` cableado | 8 puntos activos (rutas + workers + interceptores) |
| `yarn.lock` completo | 16,074 líneas ✅ |
| Cross-module imports | 0 imports directos entre módulos custom ✅ |
| Colores semánticos (texto destructive) | `text-destructive` en uso |

### ⚠️ Mejorable (deuda técnica priorizada)

| Prioridad | Problema | Archivos afectados | Fix |
|-----------|----------|-------------------|-----|
| 🔴 Alta | `resolveUrl` apunta a lista, no a página `[id]` | `auto_vehicles`, `const_projects`, `const_rfis`, `tuition` search.ts | Actualizar a `/backend/modulo/${id}` cuando se creen las páginas de detalle (Phase 16) |
| 🔴 Alta | 13 eventos `clientBroadcast: true` sin `emit()` cableado | Ver `docs/REALTIME.md §Pendientes` | Phase 14 |
| 🟡 Media | 29 CRUD routes sin `indexer: { entityType }` | `dist_credit/transactions`, `condo_fees/receipts`, etc. | Agregar `indexer` en cada CRUD route |
| 🟡 Media | 39 instancias de colores hardcoded | Varios `page.tsx` | `text-red-*` → `text-destructive`, `bg-green-*` → tokens status-* |
| 🟡 Media | 141 `openApi = {}` sin documentación real | Todas las custom routes | Agregar schemas en el futuro |
| 🟡 Media | `properties/agente/[id]/page.tsx` usa `raw fetch` | 1 archivo | Reemplazar con `apiCall` |
| 🟡 Media | `retail_ecommerce/cart/page.tsx` usa `<button>` raw | 1 archivo | Reemplazar con `Button` |
| 🟢 Baja | `example` module activo en producción | `src/modules.ts` | Remover `{ id: 'example', ... }` |

### ❌ Faltante (features de OM no usadas aún)

| Feature OM | Por qué agregarla | Esfuerzo |
|-----------|------------------|---------|
| `search.ts` en 44 módulos sin búsqueda | Los registros no aparecen en Cmd+K | Medio (Phase 18) |
| `portalBroadcast: true` en events de portales | condo_portal, dist_portal no reciben eventos real-time | Bajo |
| `formatResult` explícito en search.ts | Actualmente confía en fallback | Bajo |
| Mutation guard en custom routes | Sin guardia para lock conflicts | Bajo por ruta |
| Migrations formales (`.snapshot-open-mercato.json`) | Sin traza de evolución de schema | Alto |
| Widget injection cross-module | Sin extensiones de UI entre verticales | Medio |
| `ProgressJob` en workers bulk | Los jobs de generación masiva no reportan progreso | Medio |
| `translations.ts` por módulo | Sin soporte multiidioma de campos de entidad | Medio |
| `portalBroadcast` en portal events | Ver punto anterior | Bajo |
| Command pattern (undo/redo) | Mutaciones directas, sin historial de operaciones | Alto |

---

## Referencias

- `docs/PATTERNS.md` — Historial de incidentes y reglas Chainlock
- `docs/COOKBOOK.md` — Patrones con ejemplos de código
- `docs/REALTIME.md` — Canal clientBroadcast completo
- `docs/ROADMAP.md` — Fases completadas y pendientes
- `open-mercato/packages/core/AGENTS.md` — Contrato de extensibilidad completo
- `open-mercato/packages/events/AGENTS.md` — Event bus + DOM Event Bridge
- `open-mercato/packages/search/AGENTS.md` — Search configuration
- `open-mercato/packages/ui/AGENTS.md` — Componentes UI, CrudForm, DataTable
- `open-mercato/AGENTS.md` — Task Router + convenciones globales
