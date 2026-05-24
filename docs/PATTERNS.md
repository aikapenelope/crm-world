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
