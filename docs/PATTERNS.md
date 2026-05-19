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

- [ ] Todos los `@Property()` tienen `type:` explícito
- [ ] `em.getKysely()` usa cast `(em as any).getKysely()`
- [ ] `makeCrudRoute` tiene `mapToEntity` y `applyToEntity`
- [ ] `createModuleEvents` usa `moduleId:` (no `module:`)
- [ ] `em.create()` y `em.find()` en seeds usan `as any`
- [ ] Dependencias directas declaradas en package.json
- [ ] Componentes UI verificados contra la interfaz actual
- [ ] `NODE_ENV` NO está como buildtime en Coolify

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
| 2026-05-19 | Build falla: `organizationId` null | `useOrganizationScopeDetail()` retorna `string \| null` | PR #18 (fallback `?? ''`) |
| 2026-05-19 | Env vars duplicadas (36) | Set de dev mezclado con prod | Limpieza via API |
| 2026-05-19 | Sprint 1 completado | Transactions form, search, dictionary, tabs | PR #18 (consolidated) |
| 2026-05-19 | Sprint 2+3+4 completado | Dashboard, portal, PDF, scoring, import, settings | PR #19 (consolidated) |
