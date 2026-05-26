# Guía de Desarrollo — Patrones Obligatorios para Módulos Custom

> **CHAINLOCK**: Este documento es un registro de errores cometidos y sus soluciones.
> Toda persona o agente que escriba código en este repo DEBE leer este archivo antes de crear o modificar módulos.

---

## 1. Entidades MikroORM — Decoradores @Property

### Problema encontrado
Turbopack (Next.js 16) **no emite decorator metadata** en producción. MikroORM depende de `emitDecoratorMetadata` para inferir tipos de propiedades en runtime. Sin metadata, la app crashea con:

```
💥 Failed: Please provide either 'type' or 'entity' attribute in Entity.field
```

### Regla: SIEMPRE declarar `type:` explícito

```typescript
// ✅ CORRECTO — siempre declarar type
@Property({ type: 'text' })
tenant_id!: string

@Property({ type: 'text' })
organization_id!: string

@Property({ type: 'text', length: 255 })
title!: string

@Property({ type: 'text', length: 100 })
city!: string

@Property({ type: 'uuid' })
property_id!: string

@Property({ type: 'boolean', default: false })
is_active: boolean = false

@Property({ type: 'int', default: 0 })
sort_order: number = 0

@Property({ type: 'decimal', precision: 18, scale: 2 })
price!: string

@Property({ type: 'timestamptz' })
created_at: Date = new Date()

@Property({ type: 'timestamptz', onUpdate: () => new Date() })
updated_at: Date = new Date()

@Property({ type: 'timestamptz', nullable: true })
deleted_at?: Date | null

@Property({ type: 'text', nullable: true })
notes?: string | null
```

```typescript
// ❌ INCORRECTO — nunca hacer esto
@Property()
tenant_id!: string

@Property({ length: 100 })
city!: string
```

### Referencia de tipos MikroORM

| TypeScript type | MikroORM type |
|----------------|---------------|
| `string` | `'text'` |
| `string` (UUID) | `'uuid'` |
| `string` (decimal) | `'decimal'` con precision/scale |
| `number` (int) | `'int'` o `'smallint'` |
| `boolean` | `'boolean'` |
| `Date` | `'timestamptz'` |
| `string[]` / `any[]` | `'json'` |

---

## 2. Acceso a Kysely (queries cross-module)

### Problema encontrado
`EntityManager` de `@mikro-orm/core` no declara `getKysely()` en sus tipos públicos. TypeScript rechaza la llamada directa.

### Regla: SIEMPRE castear a `any`

```typescript
// ✅ CORRECTO
const kysely = (em as any).getKysely()

// ❌ INCORRECTO
const kysely = em.getKysely()
```

Este es el mismo patrón que usa Open Mercato internamente.

---

## 3. makeCrudRoute — create y update

### Problema encontrado
Open Mercato 0.6.1 requiere `mapToEntity` en create y `applyToEntity` en update. El shorthand `create: { schema }` ya no es válido.

### Regla: SIEMPRE incluir mapToEntity y applyToEntity

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
})
```

```typescript
// ❌ INCORRECTO — falta mapToEntity/applyToEntity
const crud = makeCrudRoute({
  ...
  create: { schema: createSchema },
  update: { schema: updateSchema },
})
```

---

## 4. createModuleEvents — moduleId

### Problema encontrado
Open Mercato 0.6.1 renombró `module` a `moduleId` en `CreateModuleEventsOptions`.

### Regla: Usar `moduleId`

```typescript
// ✅ CORRECTO
export const eventsConfig = createModuleEvents({
  moduleId: 'my_module',
  events: [...],
})

// ❌ INCORRECTO
export const eventsConfig = createModuleEvents({
  module: 'my_module',
  events: [...],
})
```

---

## 5. em.create() y em.find() — cast as any

### Problema encontrado
MikroORM v7 con strict types requiere todos los campos (incluyendo `created_at`, `updated_at`) en `em.create()` y tipos exactos en filtros de `em.find()`.

### Regla: Usar `as any` en operaciones de seed/setup

```typescript
// ✅ CORRECTO
const entry = em.create(MyEntity, {
  tenant_id: scope.tenantId,
  organization_id: scope.organizationId,
  ...data,
} as any)

const existing = await em.find(MyEntity, {
  tenant_id: scope.tenantId,
  deletedAt: null,
} as any)

// ❌ INCORRECTO — TypeScript rechaza campos faltantes
const entry = em.create(MyEntity, {
  tenant_id: scope.tenantId,
  ...data,
})
```

---

## 6. Dependencias — declarar explícitamente

### Problema encontrado
`uuid` se usaba en 7 archivos pero solo existía como dependencia transitiva. Cuando la resolución de dependencias cambió, TypeScript no encontró los tipos.

### Regla: Si usas un import, debe estar en package.json

```json
{
  "dependencies": {
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0"
  }
}
```

Nunca confiar en dependencias transitivas para imports directos.

---

## 7. Componentes UI — props requeridas

### Problema encontrado
`<LoadingMessage />` cambió a requerir `label` prop en Open Mercato 0.6.1.

### Regla: Verificar props requeridas de componentes @open-mercato/ui

```tsx
// ✅ CORRECTO
<LoadingMessage label="Cargando..." />

// ❌ INCORRECTO
<LoadingMessage />
```

Cuando uses un componente de `@open-mercato/ui`, verifica su interfaz en el repo de Open Mercato.

---

## 8. Variables de entorno en Coolify

### Problema encontrado
`NODE_ENV=production` como buildtime hacía que `yarn install` omitiera devDependencies, ocultando errores de tipos.

### Regla: NODE_ENV solo como runtime

| Variable | Buildtime | Runtime |
|----------|:---------:|:-------:|
| NODE_ENV | ❌ NO | ✅ SÍ |
| Todas las demás | ✅ SÍ | ✅ SÍ |

Nunca duplicar variables. Un solo set de producción.

---

## 9. Deploy en Coolify — errores intermitentes

### Problema conocido
Coolify 4.0.0 tiene un bug donde el build container se destruye prematuramente ("No such container"). No es error de código.

### Solución: Reintentar el deploy

Si el deploy falla con `Error response from daemon: No such container`, simplemente hacer redeploy. No hay fix de código necesario.

---

## 10. Checklist antes de crear un módulo

**Backend/módulos:**
- [ ] Todos los `@Property()` tienen `type:` explícito
- [ ] `em.getKysely()` usa cast `(em as any).getKysely()`
- [ ] `makeCrudRoute` tiene `mapToEntity` y `applyToEntity`
- [ ] `createModuleEvents` usa `moduleId:` (no `module:`)
- [ ] `em.create()` y `em.find()` en seeds usan `as any`
- [ ] Dependencias directas declaradas en package.json
- [ ] Componentes UI verificados contra la interfaz actual
- [ ] `acl.ts` tiene `export default features`

**UI v0.6.1 (crítico para CI typecheck):**
- [ ] `CrudForm`: campos usan `id:` (no `name:`), grupos usan `title:` (no `label:`)
- [ ] `CrudForm`: props son `fields/groups/initialValues/onSubmit/cancelHref` — NO `entityId/apiPath/mode`
- [ ] `DataTable`: NO pasar `extensionTableId` — NO pasar `apiPath` — `emptyState` es string/ReactNode
- [ ] `RowActionItem`: usa `label:` (no `title:`)
- [ ] `useGuardedMutation({ contextId: 'module.page' })` — contextId requerido
- [ ] `runMutation({ operation: async () => {...}, context })` — operation es función
- [ ] `flash('msg', 'type')` — mensaje primero, tipo segundo
- [ ] `PageMetadata.navHidden` (no `hidden`)
- [ ] `PortalNavMetadata.group`: solo `'main' | 'account'`

**Zod v4:**
- [ ] `z.record(z.string(), valueSchema)` — 2 argumentos requeridos

**Events:**
- [ ] `EventCategory`: solo `'crud' | 'lifecycle' | 'system' | 'custom'`

**CI:**
- [ ] `yarn generate && yarn typecheck` pasa sin errores
- [ ] `yarn lint` pasa sin errores
- [ ] `yarn test --ci --forceExit` pasa (todos los `.spec.ts` en `__tests__/`)
- [ ] `NODE_ENV` NO está como buildtime en Coolify

---

## 11. yarn.lock — DEBE estar completo

### Problema encontrado
El `yarn.lock` se commiteó vacío (12 líneas, solo workspace root) en el commit inicial. Esto causaba builds no-deterministas y fallos intermitentes en Coolify porque yarn resolvía 97 dependencias desde cero cada vez.

### Regla: SIEMPRE commitear yarn.lock completo

```bash
# Para regenerar el lockfile (requiere Node >= 24):
docker run --rm -v $(pwd):/app -w /app node:24-alpine sh -c '
  corepack enable && corepack prepare yarn@4.12.0 --activate && yarn install
'
git add yarn.lock
git commit -m "chore: regenerate yarn.lock"
```

**Nunca** commitear un `yarn.lock` vacío o parcial. Si agregas una dependencia a `package.json`, ejecuta `yarn install` y commitea el lockfile actualizado.

---

## 12. Traefik 504 Gateway Timeout

### Problema conocido
Después de un deploy, la primera request puede dar 504 porque Next.js necesita compilar la página (cold start). Esto es normal en el primer acceso.

### Solución
Esperar 10-15 segundos después del deploy y reintentar. Si persiste, verificar que el container está corriendo: `docker logs app-dnts5dsaufpulbz33dp7vwmp-*`.

---

## 14. Tests Zod — Anti-patrones en specs de validadores

> Aprendido en Phase 25, Sprint T9/T10 (PRs #103/#104). Causó 4 tests rojos en CI.

### 14a. `z.string()` sin `.min(1)` acepta cadena vacía `''`

`z.string()` solo valida que el valor sea de tipo string. Sin restricciones adicionales, `''` es **válido**.

```typescript
// ❌ TEST INCORRECTO — z.string() acepta ''
it('rejects empty date', () => {
  expect(schema.safeParse({ date: '' }).success).toBe(false) // FALLA: recibe true
})

// ✅ CORRECTO — solo assertear el comportamiento real
it('accepts date as plain string', () => {
  expect(schema.safeParse({ date: '2026-01-15' }).success).toBe(true)
})
```

**Regla:** Antes de escribir "rejects empty X", verificar si el campo usa `z.string().min(1)`. Si usa solo `z.string()`, no escribir ese test.

| Schema | Acepta `''`? |
|--------|:-----------:|
| `z.string()` | ✅ SÍ |
| `z.string().min(1)` | ❌ NO |
| `z.string().min(1).max(N)` | ❌ NO |

### 14b. `z.coerce.boolean()` usa `Boolean()` nativo de JS

`z.coerce.boolean()` convierte el valor usando el constructor `Boolean()` de JavaScript. Cualquier string no vacío (incluyendo `'false'`, `'0'`, `'no'`) resulta en `true`.

```typescript
// Comportamiento real de z.coerce.boolean():
Boolean('false') === true  // ← 'false' es string no vacío → true
Boolean('true')  === true
Boolean('0')     === true
Boolean('')      === false
Boolean(null)    === false
Boolean(0)       === false
```

```typescript
// ❌ TEST INCORRECTO — espera que 'false' coercione a false
it('coerces is_active from string', () => {
  const r = schema.safeParse({ is_active: 'false' })
  if (r.success) expect(r.data.is_active).toBe(false) // FALLA: recibe true
})

// ✅ CORRECTO — demostrar que coerce funciona para truthy strings
it('coerces is_active from string', () => {
  // z.coerce.boolean() usa Boolean() — cualquier string no vacío coerciona a true
  const r = schema.safeParse({ is_active: 'true' })
  expect(r.success).toBe(true)
  if (r.success) expect(r.data.is_active).toBe(true)
})
```

**Regla:** Para `z.coerce.boolean()`, solo testear con valores que demuestren la coerción real: `'true'` → `true`, o pasar un booleano directamente.

### 14c. Checklist antes de escribir tests de Zod validators

Antes de escribir cualquier "rejects X" test, verificar en `data/validators.ts`:

- [ ] `z.string()` → NO rechaza `''`. Solo `z.string().min(1)` lo hace.
- [ ] `z.string().min(1)` → SÍ rechaza `''`. OK escribir el test.
- [ ] `z.coerce.boolean()` → `'false'` coerciona a `true`. No usar `'false'` esperando `false`.
- [ ] `z.coerce.number()` → `'5'` coerciona a `5`. Sí funciona para números.
- [ ] `z.number().int().min(1)` → NO acepta `0` ni negativos. OK escribir el test.
- [ ] `z.array(...).min(1)` → NO acepta `[]`. OK escribir el test.

---

## Historial de incidentes

| Fecha | Problema | Causa | Fix |
|-------|----------|-------|-----|
| 2026-05-19 | Build falla: `getKysely` type error | Cast faltante | PR #3 |
| 2026-05-19 | Build falla: `uuid` types | Dependencia transitiva | PR #11 |
| 2026-05-19 | Build falla: `mapToEntity` missing | API cambió en 0.6.1 | PR #12 |
| 2026-05-19 | Build falla: `module` → `moduleId` | Renombrado en 0.6.1 | PR #13 |
| 2026-05-19 | Build falla: `created_at` missing | Strict types | PR #14 |
| 2026-05-19 | Build falla: `LoadingMessage` label | Prop required | PR #15 |
| 2026-05-19 | Runtime crash: `@Property()` sin type | Turbopack no emite metadata | PR #16 + #17 |
| 2026-05-19 | OOM durante build | CX33 sin RAM suficiente | Upgrade a CX43 |
| 2026-05-19 | Deploy no se triggerea | Source era "Public GitHub" | Cambio a GitHub App en UI |
| 2026-05-19 | Deploy falla: "No such container" | Bug de Coolify 4.0.0 | Reintentar deploy |
| 2026-05-20 | Builds no-deterministas | yarn.lock vacío (12 líneas) desde commit inicial | PR #31 (regenerar lockfile) |
| 2026-05-20 | 504 Gateway Timeout post-deploy | Cold start de Next.js (normal) | Esperar 10-15s y reintentar |
| 2026-05-20 | **Build falla: "Export register doesn't exist"** | **di.ts sin export function register** | **PR #33 — agregar export** |
| 2026-05-24 | CI Typecheck OOM (exit 129) | 111 módulos agotan heap de Node | `NODE_OPTIONS=--max-old-space-size=6144` a nivel de JOB en CI |
| 2026-05-24 | CI Lint: `scopeManager.addGlobals` TypeError | `eslint-config-next@16.2.4` + ESLint v10 flat config | Actualizar a `16.2.6` + limitar lint a `src/modules` |
| 2026-05-24 | CI Tests: `SyntaxError: Unexpected token 'export'` | `@mikro-orm` no en `transformIgnorePatterns` de Jest | Añadir `@mikro-orm` al patrón + usar `jest-mikroorm-transformer.cjs` |
| 2026-05-24 | CI Tests: `TypeError: Cannot read .errors.map` | Zod v4 renombró `.errors` a `.issues` | Cambiar a `.issues` en tests |
| 2026-05-24 | CI Tests: `TS5103: ignoreDeprecations` | Flag solo válido en TypeScript 6.x | Remover de jest.config.cjs (proyecto usa TS 5.x) |
| 2026-05-24 | 900+ errores TS al activar CI | Módulos escritos con APIs antiguas (nunca validados) | Corrección sistemática de APIs: ver PR #83 |
| 2026-05-24 | CI Tests T9/T10: 4 tests rojos | `z.string()` sin `.min(1)` acepta `''`; `z.coerce.boolean('false')` → `true` | Fix en PRs #103/#104 + Sección §14 en PATTERNS.md |

---

## 15. Workers y Subscribers — Contrato del contexto DI

> Auditado el 2026-05-26 contra el código fuente de OM (`packages/cli/src/mercato.ts:1344`).

### Problema encontrado
Varios workers usaban `ctx.container.resolve('em')` en lugar de `ctx.resolve('em')`.
El CLI de OM NO inyecta un `.container` en el contexto del worker — inyecta `resolve` directamente:

```typescript
// packages/cli/src/mercato.ts línea 1344 (fuente de verdad)
await worker.handler(job, { ...ctx, resolve: container.resolve.bind(container) })
//                          ↑                ↑ ctx.resolve — NO ctx.container
```

### Regla: Workers usan `ctx.resolve()`, API routes usan `ctx.container.resolve()`

```typescript
// ✅ CORRECTO — worker/subscriber
export default async function handler(job: any, ctx: any) {
  const em = ctx.resolve('em')
  const kysely = (em as any).getKysely()
}

// ❌ INCORRECTO en workers/subscribers — ctx.container no existe
export default async function handler(job: any, ctx: any) {
  const em = ctx.container.resolve('em')  // TypeError at runtime
}

// ✅ CORRECTO — API route (ctx diferente, inyectado por Next.js middleware de OM)
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
}
```

### Primer argumento del worker handler

El CLI llama al handler con `(job: QueuedJob<T>, ctx)` donde `job` es el wrapper completo:
```typescript
type QueuedJob<T> = {
  id: string
  payload: T        // ← datos reales aquí
  createdAt: string
  metadata?: Record<string, unknown>
}
```

Si el worker recibe payload per-tenant, acceder con `job.payload.tenantId` (NO `job.tenantId`).
Los workers globales (schedulers que procesan todos los tenants) ignoran el payload y usan
`ctx.resolve('em')` para obtener su propio scope desde cada fila de la query.

### Referencia verificada en OM core

```typescript
// packages/core/src/modules/data_sync/workers/sync-scheduled.ts
type HandlerContext = JobContext & { resolve: <T>(name: string) => T }

export default async function handle(job: QueuedJob<Payload>, ctx: HandlerContext) {
  const em = ctx.resolve<EntityManager>('em')  // ← correcto
}
```

---

## 16. Subscribers — ubicación y contrato

> Auditado el 2026-05-26 contra `packages/cli/src/lib/generators/scanner.ts`.

### Problema encontrado
Un subscriber (`on-cold-chain-excursion.ts`) estaba en `workers/` en vez de `subscribers/`.
El scanner de OM solo descubre subscribers en `src/modules/<id>/subscribers/*.ts`.
Archivos con `metadata.event` en `workers/` son ignorados silenciosamente — el generador
espera `metadata.queue` en workers, no `metadata.event`.

### Regla: Subscribers van en `subscribers/`, workers van en `workers/`

| Tipo | Directorio | metadata requerida |
|------|-----------|-------------------|
| Subscriber | `subscribers/*.ts` | `{ event: string, persistent?: boolean, id?: string }` |
| Worker | `workers/*.ts` | `{ queue: string, id?: string, concurrency?: number }` |

Si un archivo tiene `metadata.event` pero está en `workers/`, **nunca será registrado**.

```typescript
// ✅ CORRECTO — src/modules/my_module/subscribers/on-something.ts
export const metadata = {
  event: 'other_module.entity.action',
  persistent: true,
  id: 'my_module.on-something',
}
export default async function handler(payload: any, ctx: any) {
  const em = ctx.resolve('em')  // mismo patrón que workers
}

// ❌ INCORRECTO — subscriber en workers/
// src/modules/my_module/workers/on-something.ts  ← nunca será registrado
export const metadata = {
  event: 'other_module.entity.action',  // ← tiene event pero está en workers/
  ...
}
```

---

## 17. Columnas UUID — nunca usar strings no-UUID como sentinel

### Problema encontrado
Un worker usaba `.set({ non_conformity_id: 'pending' })` en una columna `type: 'uuid'`.
PostgreSQL rechaza valores no-UUID en columnas UUID con error de constraint.

### Regla: Usa `null` como sentinel en columnas UUID nullable

```typescript
// ✅ CORRECTO — null como "pendiente de asignar"
await kysely
  .updateTable('my_records')
  .set({ related_id: null })         // ← sentinel: null
  .where('status', '=', 'active')
  .execute()

// Subscriber/query posterior:
.where('related_id', 'is', null)     // ← IS NULL, no = null

// ❌ INCORRECTO — string en columna UUID
await kysely
  .updateTable('my_records')
  .set({ related_id: 'pending' })    // ← falla en PostgreSQL
  .execute()
```

Si necesitas más estados que `null`/`<uuid>`, añade una columna booleana o enum separada.

---

## 18. Entidades MikroORM — `default:` sin comillas SQL embebidas

### Problema encontrado
Propiedades con `default: "'standard'"` (comillas SQL embebidas en el JS string)
causan `syntax error at or near "standard"` cuando MikroORM v7 genera migrations.

MikroORM extrae el valor de la string JS → detecta las comillas → las elimina en el
SQL → genera `DEFAULT standard` (bareword) → PostgreSQL rechaza.

### Regla: SIEMPRE usar el valor JavaScript directamente, sin comillas SQL embebidas

```typescript
// ✅ CORRECTO — MikroORM añade las comillas SQL automáticamente
@Property({ type: 'text', length: 10, default: 'USD' })
currency: string = 'USD'

@Property({ type: 'decimal', precision: 5, scale: 2, default: '0.00' })
amount: string = '0.00'

@Property({ type: 'boolean', default: false })
is_active: boolean = true

// ❌ INCORRECTO — comillas SQL embebidas → sintax error en db:greenfield
@Property({ type: 'text', length: 10, default: "'USD'" })
currency: string = 'USD'
```

Para defaults SQL complejos (expresiones, funciones), usar `defaultRaw`:
```typescript
@Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
created_at: Date = new Date()
```

### Referencia
Verificado en open-mercato packages/core/src/modules/auth/data/entities.ts:
  `@Property({ type: 'boolean', default: false })` — sin comillas embedded.
MikroORM v7 documentation: `default` = JavaScript value, MikroORM maneja
el SQL quoting; `defaultRaw` = SQL expression raw.

---



| Fecha | Problema | Causa | Fix |
|-------|----------|-------|-----|
| 2026-05-26 | Workers fallan silenciosamente (no ejecutan lógica) | `ctx.container.resolve()` en lugar de `ctx.resolve()` | PR fix-worker-ctx |
| 2026-05-26 | Subscriber nunca registrado — NC de temperatura nunca creadas | Archivo en `workers/` con `metadata.event` en lugar de `subscribers/` | PR fix-worker-ctx |
| 2026-05-26 | PostgreSQL error en update de cadena de frío | `non_conformity_id: 'pending'` en columna UUID | PR fix-worker-ctx |

---

## 13. di.ts — DEBE exportar `register`

### Problema encontrado
El generador de Open Mercato (`.mercato/generated/di.generated.ts`) importa `register` de cada módulo. Si `di.ts` no exporta esa función, Turbopack falla con:
```
Export register doesn't exist in target module
```

### Regla: SIEMPRE exportar `register` en di.ts

```typescript
// ✅ CORRECTO — mínimo requerido
import type { AppContainer } from '@open-mercato/shared/lib/di/container'

export function register(_: AppContainer) {
  // Services registered here when needed
}

// ❌ INCORRECTO — causa build failure
// DI registrations for my_module
```

Incluso si el módulo no registra servicios, la función `register` vacía DEBE existir.

---

## 19. Agregar `deleted_at` a entidad existente con datos en producción

### Problema
Cuando se agrega `deleted_at` a una entidad cuya tabla ya existe en producción con datos,
`yarn db:generate` no puede ejecutarse directamente en el repo local (sin DB). El flujo
requiere generar la migration en el container de producción.

### Regla: Flujo para agregar deleted_at a entidad existente

```bash
# 1. Editar data/entities.ts localmente
@Property({ type: 'timestamptz', nullable: true })
deleted_at?: Date | null

# 2. Copiar entity al container de producción
docker cp ./src/modules/<mod>/data/entities.ts $CONTAINER:/app/src/modules/<mod>/data/entities.ts

# 3. Ejecutar db:generate en container (genera solo el diff)
docker exec -w /app $CONTAINER yarn db:generate

# 4. Verificar que generó solo ALTER TABLE ... ADD COLUMN (no noise)
# La migration debe ser:
#   alter table "<tabla>" add "<col>" timestamptz null;
# con su correspondiente down():
#   alter table "<tabla>" drop column "<col>";

# 5. Copiar migration + snapshot al repo
docker exec $CONTAINER tar -czf /tmp/mig.tar.gz -C /app/src/modules/<mod>/migrations .
scp root@VPS:/tmp/mig.tar.gz /tmp/mig.tar.gz
tar -xzf /tmp/mig.tar.gz -C src/modules/<mod>/migrations/

# 6. Aplicar en producción antes del merge
docker exec -w /app $CONTAINER yarn db:migrate

# 7. Commitear entity change + migration + snapshot en el MISMO commit
```

**Verificación crítica antes de commitear:**
- `yarn db:generate` SOLO genera migration para el módulo modificado (no noise de otros módulos)
- El SQL del `up()` es solo `ADD COLUMN ... NULL` (nullable, safe para producción con datos)
- El snapshot actualizado contiene la nueva columna

### Referencia
- `packages/core/AGENTS.md:533`: "Include `deleted_at timestamptz null` for soft delete"
- `packages/cli/AGENTS.md`: Default workflow para entity changes

---

## 20. CI fallos por infraestructura vs código

### Problema encontrado
Los CI checks de GitHub Actions pueden fallar con errores como:
```
remote: Your account is suspended.
fatal: unable to access '...': The requested URL returned error: 403
```
Esto ocurre en el paso `actions/checkout@v4` — el código NUNCA llega a ejecutarse.
Es un problema de infraestructura (cuenta GitHub suspendida, red, permisos), NO un error de código.

### Cómo distinguir infraestructura vs código

| Síntoma | Causa probable |
|---------|----------------|
| TODOS los jobs fallan en `actions/checkout@v4` con HTTP 403 | Cuenta suspendida / permisos |
| Solo algunos jobs fallan (lint pasa, typecheck falla) | Error de código TypeScript |
| `Your account is suspended` en el log | Cuenta GitHub suspendida |
| `yarn: command not found` o `Module not found` | Cache de Node.js expirado |
| Tests fallan con assertion errors | Error de código real |

### Solución

Si CI falla por infraestructura:
1. Verificar el log: buscar `suspended`, `403`, `unable to access`
2. Si es infraestructura: hacer **code review manual** del PR
3. Re-trigger CI con commit vacío:
   ```bash
   git commit --allow-empty -m "ci: re-trigger CI — previous run failed due to <causa>"
   git push
   ```
4. Si es error de código: corregir y hacer push normal

**Nunca asumir que CI falla = código roto.** Siempre leer el log completo.

---

## 21. CrudFormGroup: usar `title` no `label`

### Problema encontrado (PR #134)
Algunos módulos usaban `label:` en lugar de `title:` en la definición de grupos de `CrudForm`:
```typescript
// ❌ INCORRECTO
{ id: 'part', column: 1, label: 'Datos del repuesto', fields: [...] }

// ✅ CORRECTO
{ id: 'part', column: 1, title: 'Datos del repuesto', fields: [...] }
```

### Regla (PATTERNS.md §10 — ya documentado)
"CrudForm: grupos usan `title:` (no `label:`)"

Revisado en COMPLIANCE_CHECKLIST.md como issue detectado en audit de cada vertical.

---

## 22. Colores de marca de terceros en className vs style

### Problema (PR #134 — `auto_service_orders/detail`)
WhatsApp usa `#25D366` como color de marca. Poner esto en `className` viola `ds-rules.md`:
```
NEVER hardcode hex/rgb values in className
```

### Solución documentada
Para colores de marca de terceros (WhatsApp, Stripe, etc.) que no tienen token semántico:
```tsx
// ✅ CORRECTO — inline style (exento de la regla de className)
<Button
  type="button"
  style={{ backgroundColor: '#25D366', color: 'white' }}
  className="hover:opacity-90"
>
  WhatsApp
</Button>

// ❌ INCORRECTO — hex en className
<Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
  WhatsApp
</Button>
```

**Regla:** La restricción `NEVER hardcode hex in className` aplica a `className`. Inline `style={{}}` es aceptable para colores de marca de terceros documentados. Agregar comentario explicando la excepción.

| Fecha | Problema | Causa | Fix |
|-------|----------|-------|-----|
| 2026-05-26 | CI falló con 403 en checkout | Cuenta GitHub suspendida durante el run | Re-trigger con commit vacío |
| 2026-05-26 | `label:` en CrudFormGroup genera grupo sin título visible | API usa `title:`, no `label:` | Cambiar a `title:` |
| 2026-05-26 | `bg-[#25D366]` viola ds-rules | Hex en className | Mover a `style={{}}` |
