# Cookbook — Guía de Desarrollo para CRM World

> Documento vivo con patrones, errores comunes, y soluciones probadas.
> Consultar ANTES de escribir código. Actualizar DESPUÉS de cada incidente.

---

## 1. Kysely y TypeScript Strict Mode

### Problema
Next.js ejecuta TypeScript en modo strict durante `yarn build`. Kysely retorna resultados sin tipos explícitos. Cuando esos resultados se meten en un `Map()` o se acceden propiedades, TypeScript falla con:
- `Property 'X' does not exist on type '{}'`
- `Argument of type 'X' is not assignable to parameter of type 'Y'`

Estos errores NO aparecen en desarrollo local (Turbopack es más permisivo) pero SÍ aparecen en el build de producción.

### Regla: Siempre tipar Maps y resultados de Kysely

```typescript
// ❌ INCORRECTO — falla en build
const items = await kysely.selectFrom('table').selectAll().execute()
const itemMap = new Map(items.map(i => [i.id, i]))
const item = itemMap.get(someId)
console.log(item.name) // Error: Property 'name' does not exist on type '{}'

// ✅ CORRECTO — funciona en build
const items = await kysely.selectFrom('table').selectAll().execute()
const itemMap = new Map<string, any>(items.map((i: any) => [i.id, i]))
const item = itemMap.get(someId) as any
console.log(item.name) // OK
```

### Regla: Variables de Kysely siempre con `as any` al acceder propiedades

```typescript
// ❌ INCORRECTO
const result = await kysely.selectFrom('students').selectAll().executeTakeFirst()
const name = result.first_name // Error en build

// ✅ CORRECTO
const result = await kysely.selectFrom('students').selectAll().executeTakeFirst()
const name = (result as any)?.first_name // OK
```

### Regla: Map.get() siempre con cast

```typescript
// ❌ INCORRECTO
const rep = repMap.get(studentId)
const phone = rep.phone // Error: Property 'phone' does not exist on type '{}'

// ✅ CORRECTO
const rep = repMap.get(studentId) as any
const phone = rep?.phone // OK
```

---

## 2. API Routes — Firma Correcta

### Problema
Open Mercato inyecta un segundo argumento `ctx` a los handlers de API routes. Si solo declaras `(request: Request)`, no tienes acceso al container DI ni al scope del tenant.

### Regla: Siempre usar `(request: Request, ctx: any)`

```typescript
// ❌ INCORRECTO — no tiene acceso a DI ni scope
export async function GET(request: Request) {
  // ¿Cómo accedo al EntityManager? ¿Al tenantId?
  const { resolveOrganizationScopeForRequest } = await import('...')
  const scope = await resolveOrganizationScopeForRequest(request) // TYPE ERROR
}

// ✅ CORRECTO — Open Mercato pasa ctx automáticamente
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope // { tenantId, organizationId }
  const kysely = (em as any).getKysely()
}
```

### Cuándo usar cada patrón

| Situación | Patrón |
|---|---|
| CRUD estándar (list, create, update, delete) | `makeCrudRoute` — no necesitas handler custom |
| Endpoint custom con auth | `export async function GET(request: Request, ctx: any)` |
| Endpoint público (sin auth) | `export async function GET(request: Request)` — OK sin ctx |

### Nota sobre `makeCrudRoute`
Los handlers generados por `makeCrudRoute` ya manejan todo internamente. Solo exportas:
```typescript
export const GET = crud.GET
export const POST = crud.POST
```
No necesitas escribir handlers custom para CRUD básico.

---

## 3. Import Paths — Profundidad de Directorios

### Problema
Si un archivo está en un subdirectorio más profundo que lo normal, el import relativo cambia.

### Regla: Contar niveles desde el archivo hasta la raíz del módulo

```
src/modules/tuition/
├── data/entities.ts
├── api/
│   ├── charges/
│   │   ├── route.ts          ← desde aquí: ../../data/entities ✅
│   │   └── generate/
│   │       └── route.ts      ← desde aquí: ../../../data/entities ✅ (un nivel más)
│   └── payments/
│       └── route.ts          ← desde aquí: ../../data/entities ✅
```

### Cómo verificar
Contar cuántos `../` necesitas para llegar a la raíz del módulo:
- `api/charges/route.ts` → 2 niveles → `../../data/entities`
- `api/charges/generate/route.ts` → 3 niveles → `../../../data/entities`
- `backend/tuition/cobro/page.tsx` → 3 niveles → `../../../services/...`

---

## 4. Entidades MikroORM — Decoradores

### Problema
Turbopack (Next.js 16) NO emite decorator metadata en producción. Sin `type:` explícito, la app crashea en runtime.

### Regla: SIEMPRE declarar `type:` en @Property

```typescript
// ❌ INCORRECTO — crashea en producción
@Property()
tenant_id!: string

@Property({ length: 100 })
name!: string

// ✅ CORRECTO — funciona siempre
@Property({ type: 'text' })
tenant_id!: string

@Property({ type: 'text', length: 100 })
name!: string
```

### Referencia de tipos

| TypeScript | MikroORM type |
|---|---|
| `string` | `'text'` |
| `string` (UUID) | `'uuid'` |
| `string` (decimal) | `'decimal'` con precision/scale |
| `number` (int) | `'int'` o `'smallint'` |
| `boolean` | `'boolean'` |
| `Date` | `'timestamptz'` |
| `string[]` / `any[]` | `'json'` |
| `Date` (solo fecha) | `'date'` |

---

## 5. makeCrudRoute — Campos Obligatorios

### Problema
Open Mercato 0.6.1 requiere `mapToEntity` en create y `applyToEntity` en update.

### Regla: SIEMPRE incluir ambos

```typescript
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'my_module.entity' },
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({ ...input }),  // OBLIGATORIO
  },
  update: {
    schema: updateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },  // OBLIGATORIO
  },
})
```

---

## 6. Events — moduleId (no module)

### Regla

```typescript
// ❌ INCORRECTO
export const eventsConfig = createModuleEvents({
  module: 'my_module',  // NO FUNCIONA
  events: [...],
})

// ✅ CORRECTO
export const eventsConfig = createModuleEvents({
  moduleId: 'my_module',  // CORRECTO
  events: [
    { id: 'my_module.entity.created', label: 'Creado', entity: 'entity', category: 'crud' },
  ],
} as const)
```

---

## 7. Seeds y em.create() — Strict Types

### Problema
MikroORM v7 con strict types requiere TODOS los campos en `em.create()`.

### Regla: Usar `as any`

```typescript
// ❌ INCORRECTO — TypeScript rechaza campos faltantes
const entry = em.create(MyEntity, {
  tenant_id: scope.tenantId,
  name: 'test',
})

// ✅ CORRECTO
const entry = em.create(MyEntity, {
  tenant_id: scope.tenantId,
  organization_id: scope.organizationId,
  name: 'test',
  created_at: new Date(),
  updated_at: new Date(),
} as any)
em.persist(entry)
await em.flush()
```

---

## 8. Coolify Deploy — Diagnóstico

### Problema
Coolify muestra "No such container" cuando el build falla. El error real está oculto en los logs.

### Cómo diagnosticar

```bash
# Ver último deploy con logs
curl -s -H "Authorization: Bearer TOKEN" \
  "https://deploy.novaincs.com/api/v1/deployments/applications/APP_UUID?take=1" \
  | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
deploy = data['deployments'][0]
logs = json.loads(deploy['logs'])
for entry in logs:
    output = entry.get('output','')
    if 'Type error' in output or 'Cannot find' in output or 'ERROR' in output:
        for line in output.split('\n'):
            if 'Type error' in line or 'Cannot find' in line or 'ERROR' in line:
                print(line.strip()[:200])
"
```

### Errores comunes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `Property 'X' does not exist on type '{}'` | Map sin tipo o Kysely result sin cast | `Map<string, any>` + `as any` |
| `Cannot find module '../../data/entities'` | Import path incorrecto por profundidad | Contar niveles correctamente |
| `Argument of type 'Request' is not assignable` | Handler sin `ctx` | Agregar `ctx: any` como segundo param |
| `No such container` | El build falló (ver error real arriba) | Corregir el TypeScript error |
| `OOM killed` | Servidor sin RAM suficiente | Agregar swap o upgrade servidor |

### Regla de oro
**Si el deploy falla, SIEMPRE revisar los logs del paso #15 (`yarn build`).** El error "No such container" es el EFECTO, no la CAUSA.

---

## 9. UI — Componentes y Patrones

### Regla: Nunca HTML raw

| Necesito... | Usar | NO usar |
|---|---|---|
| Formulario | `CrudForm` | `<form>` |
| Tabla | `DataTable` | `<table>` |
| Botón | `Button` | `<button>` |
| Input | `Input` / CrudForm fields | `<input>` |
| Checkbox | `Checkbox` | `<input type="checkbox">` |
| Loading | `Spinner` / `LoadingMessage` | Texto "Cargando..." |
| Feedback | `flash()` | `alert()` |
| Confirmación | `useConfirmDialog` | `window.confirm()` |
| API call | `apiCall` / `readApiResultOrThrow` | `fetch()` |

### Regla: Iconos

| Contexto | Usar | NO usar |
|---|---|---|
| Body de página (botones, cards) | `lucide-react` | SVG inline |
| `page.meta.ts` (sidebar) | `React.createElement('svg', ...)` | lucide-react import |

### Regla: Colores

| Necesito... | Token | NO usar |
|---|---|---|
| Error/destructivo | `text-destructive` | `text-red-500` |
| Éxito | `text-primary` | `text-green-500` |
| Warning | `text-amber-600` (excepción permitida en widgets) | `text-yellow-500` |
| Muted | `text-muted-foreground` | `text-gray-500` |
| WhatsApp | `text-[#25D366]` (brand color, excepción) | — |

---

## 10. Módulos — Estructura Obligatoria

Todo módulo custom DEBE tener:

```
src/modules/<module>/
├── index.ts          ← ModuleInfo (name, title, version, description)
├── acl.ts            ← Features RBAC
├── setup.ts          ← ModuleSetupConfig (defaultRoleFeatures, seedDefaults)
├── di.ts             ← DI registration (puede estar vacío)
├── events.ts         ← createModuleEvents con moduleId
├── data/
│   ├── entities.ts   ← Entidades con @Property({ type: '...' })
│   └── validators.ts ← Schemas Zod
├── api/
│   └── <recurso>/route.ts  ← makeCrudRoute o handler custom
├── backend/
│   └── <pagina>/
│       ├── page.meta.ts    ← Sidebar entry
│       └── page.tsx        ← 'use client' component
└── i18n/
    ├── es.json
    └── en.json
```

Y DEBE estar registrado en `src/modules.ts`:
```typescript
{ id: 'my_module', from: '@app' },
```

---

## 11. Checklist Pre-Commit

Antes de cada commit que toque código TypeScript:

- [ ] `@Property()` tiene `type:` explícito
- [ ] `(em as any).getKysely()` — cast presente
- [ ] `makeCrudRoute` tiene `mapToEntity` + `applyToEntity`
- [ ] `createModuleEvents` usa `moduleId:` (no `module:`)
- [ ] API routes custom usan `(request: Request, ctx: any)`
- [ ] `em.create()` y `em.find()` en seeds usan `as any`
- [ ] `new Map()` tiene tipo explícito: `new Map<string, any>()`
- [ ] `Map.get()` usa `as any` al acceder propiedades
- [ ] Import paths relativos son correctos (contar niveles)
- [ ] Componentes UI de `@open-mercato/ui` (no HTML raw)
- [ ] Strings visibles en `i18n/es.json`
- [ ] `export const metadata` en API routes
- [ ] `export const openApi = {}` en API routes

---

## 12. Historial de Incidentes

| Fecha | Error | Causa raíz | Fix |
|---|---|---|---|
| 2026-05-19 | `getKysely` type error | Cast faltante | `(em as any).getKysely()` |
| 2026-05-19 | `uuid` types not found | Dependencia transitiva | Agregar a package.json |
| 2026-05-19 | `mapToEntity` missing | API cambió en v0.6.1 | Agregar mapToEntity |
| 2026-05-19 | `module` → `moduleId` | Renombrado en v0.6.1 | Usar moduleId |
| 2026-05-19 | `created_at` missing | Strict types en em.create | Usar `as any` |
| 2026-05-19 | `LoadingMessage` sin label | Prop requerida en v0.6.1 | Agregar label prop |
| 2026-05-19 | `@Property()` sin type | Turbopack no emite metadata | Agregar type explícito |
| 2026-05-19 | OOM durante build | CX33 sin RAM | Swap 4GB |
| 2026-05-20 | `resolveOrganizationScopeForRequest` type error | Firma incorrecta | Usar `ctx.scope` |
| 2026-05-20 | `Cannot find module ../../data/entities` | Path incorrecto (subdirectorio profundo) | `../../../data/entities` |
| 2026-05-20 | `Property 'contact_id' does not exist on type '{}'` | Map sin tipo explícito | `Map<string, any>` + `as any` |

---

## 13. Diferencias entre Desarrollo Local y Build de Producción

| Aspecto | Local (`yarn dev`) | Producción (`yarn build`) |
|---|---|---|
| TypeScript | Turbopack (permisivo) | tsc strict (estricto) |
| Decorator metadata | Puede funcionar sin `type:` | FALLA sin `type:` |
| Map types | Infiere correctamente | Infiere como `{}` |
| Import resolution | Más flexible | Estricto |
| `as any` necesario | A veces no | SIEMPRE en Kysely/seeds |
| Errores visibles | Solo warnings | Build falla completamente |

**Regla**: Si funciona en local pero falla en deploy, el problema es TypeScript strict mode. Revisar los 3 patrones: Maps sin tipo, accesos sin cast, imports incorrectos.
