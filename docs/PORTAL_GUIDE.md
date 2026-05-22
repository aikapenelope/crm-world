# Portal Guide — Arquitectura del Portal de Clientes en Aika/Open Mercato

> **Fuente autoritativa**: Este documento cita archivos exactos del repositorio oficial de Open Mercato.
> Ante cualquier duda, el código fuente del paquete tiene precedencia sobre esta guía.

---

## 1. ¿Qué es el Portal?

Open Mercato tiene dos sistemas de autenticación dentro de la misma aplicación Next.js:

| Sistema | Ruta | Auth | Para quién |
|---------|------|------|------------|
| **Backend (admin)** | `/backend/...` | JWT staff (`auth_token`) | Empleados / operadores del tenant |
| **Portal de cliente** | `/{orgSlug}/portal/...` | JWT customer (`customer_auth_token`) | Clientes del negocio (abonados, estudiantes, propietarios, etc.) |

No son dos aplicaciones separadas. Son dos ramas de la misma app Next.js con sistemas de identidad **completamente independientes**.

**Fuente**: `packages/core/src/modules/customer_accounts/AGENTS.md`
> "This module manages customer user accounts, sessions, roles... It is separate from the internal `auth` module, which handles staff authentication."

---

## 2. El patrón correcto de directorios

### ✅ Correcto — dinámico por tenant

```
src/modules/<modulo>/frontend/[orgSlug]/portal/<path>/page.tsx
                              ↑
                              Segmento dinámico Next.js
                              Resuelve al slug real de la org: "inet-caracas", "telecarabobo"
```

**Resultado**: cada tenant tiene su portal en su propia URL:
- `https://mercato.novaincs.com/inet-caracas/portal/home`
- `https://mercato.novaincs.com/telecarabobo/portal/home`
- `https://mercato.novaincs.com/mi-condo/portal/home`

**Fuente**: `packages/core/src/modules/portal/frontend/[orgSlug]/portal/dashboard/page.tsx`
```typescript
type Props = { params: { orgSlug: string } }

export default function PortalDashboardPage({ params }: Props) {
  const router = useRouter()
  // Siempre usa params.orgSlug para construir URLs del portal
  router.replace(`/${params.orgSlug}/portal/login`)
}
```

### ❌ Incorrecto — slug fijo (deuda técnica en crm-world)

```
src/modules/condo_portal/frontend/condominio/portal/...   ← sólo funciona para org con slug "condominio"
src/modules/academy_portal/frontend/academia/...          ← sólo funciona para org con slug "academia"
```

> **Deuda técnica**: todos los portales de crm-world anteriores a `isp_portal` usan slugs fijos.
> Funcionan en deployments de un solo tenant porque el slug se configura manualmente para que coincida,
> pero son incorrectos y deben migrarse al patrón `[orgSlug]` en un sprint de deuda técnica.
> Ver §9 para lista completa.

---

## 3. Auto-detección del PortalLayoutShell

El layout de la app detecta automáticamente cualquier ruta que empiece por `/{orgSlug}/portal/`
y la envuelve con la shell del portal (header, navegación lateral, lógica de auth de cliente).

**Fuente**: `src/app/(frontend)/layout.tsx`
```typescript
// Detecta si el pathname pertenece a un portal
const portalMatch = pathname.match(/^\/([^/]+)\/portal(?:\/|$)/)
if (!portalMatch) {
  return <>{children}</>  // No es portal → renderiza sin shell
}

const orgSlug = portalMatch[1]  // "inet-caracas", "telecarabobo", etc.

// Resuelve tenant real desde la BD por orgSlug
const org = await em.findOne(Organization, { slug: orgSlug, deletedAt: null })

// Envuelve con la shell del portal
return (
  <PortalLayoutShell orgSlug={orgSlug} tenantId={tenantId} ...>
    {children}
  </PortalLayoutShell>
)
```

Esto significa que **no se necesita ningún archivo de layout en el módulo**. Cualquier página cuya
ruta coincida con `/{*}/portal/` hereda automáticamente la shell completa del portal.

**Fuente de PortalLayoutShell**: `packages/ui/src/portal/PortalLayoutShell.tsx`
- Header con logo del tenant
- Navegación lateral (items auto-construidos desde los `nav` declarados en `page.meta.ts`)
- Bell de notificaciones (`PortalNotificationBell`)
- Menu de usuario (logout, perfil)

---

## 4. Autenticación del portal (`customer_accounts`)

### Two-cookie strategy

**Fuente**: `packages/core/src/modules/customer_accounts/AGENTS.md` §Authentication Flow

| Cookie | Contenido | TTL | Propósito |
|--------|-----------|-----|-----------|
| `customer_auth_token` | JWT firmado | 8 horas | Auth corto con claims embebidos |
| `customer_session_token` | Token raw | 30 días | Sesión larga para renovar JWT |

### Claims del JWT (`CustomerAuthContext`)

**Fuente**: `packages/core/src/modules/customer_accounts/lib/customerAuth.ts`
```typescript
export interface CustomerAuthContext {
  sub: string                      // CustomerUser.id (siempre presente)
  tenantId: string
  orgId: string
  email: string
  displayName: string
  customerEntityId?: string | null  // FK al CRM company del tenant
  personEntityId?: string | null    // FK al CRM person del tenant
}
```

**Fuente del signing**: `packages/core/src/modules/customer_accounts/services/customerSessionService.ts`
```typescript
customerEntityId: user.customerEntityId || null,  // incluido en el JWT
personEntityId: user.personEntityId || null,
```

### Cómo identificar al abonado en una API route del portal

```typescript
export async function GET(request: Request, ctx: any) {
  // ✅ CORRECTO: customerEntityId está en el JWT
  const customerEntityId = ctx.customerContext?.customerEntityId ?? null

  // ❌ INCORRECTO: .entityId no existe en CustomerAuthContext
  // const customerEntityId = ctx.customerContext?.entityId  ← BUG

  if (!customerEntityId) {
    return Response.json({ error: 'No customer session' }, { status: 401 })
  }

  // Buscar el abonado vinculado a este customer
  const subscriber = await kysely
    .selectFrom('isp_subscribers')
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', ctx.scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}
```

### Guardia en page.meta.ts

```typescript
// page.meta.ts — patrón oficial
// Fuente: packages/core/src/modules/portal/frontend/[orgSlug]/portal/dashboard/page.meta.ts
export const metadata = {
  requireCustomerAuth: true,                              // ← redirige al login si no autenticado
  requireCustomerFeatures: ['isp_portal.view_account'],  // ← 403 si no tiene el feature
  pageTitle: 'Mi Cuenta',
  nav: { label: 'Inicio', group: 'main', order: 1 },     // ← auto-inyectado en la nav lateral
}
```

El router `(frontend)/[...slug]/page.tsx` procesa estas declaraciones:
- Si `requireCustomerAuth` y no hay session → `redirect('/{orgSlug}/portal/login')`
- Si `requireCustomerFeatures` y no tiene el feature → renderiza `AccessDeniedMessage`

---

## 5. RBAC del portal

### Dos capas (espejo del RBAC de staff)

**Fuente**: `packages/core/src/modules/customer_accounts/AGENTS.md` §Customer RBAC

1. **Role ACLs** (`CustomerRoleAcl`): features asignadas al rol
2. **User ACLs** (`CustomerUserAcl`): overrides por usuario (toma precedencia si existen)

### Roles por defecto (seed al crear tenant)

| Rol | Slug | Portal Admin |
|-----|------|-------------|
| Portal Admin | `portal_admin` | Sí (`portal.*`) |
| Buyer | `buyer` | No |
| Viewer | `viewer` | No |

### Declarar features de tu módulo en setup.ts

**Fuente**: `packages/core/src/modules/customer_accounts/agentic/standalone-guide.md`
```typescript
// src/modules/<tu_modulo>/setup.ts
export const setup: ModuleSetupConfig = {
  defaultCustomerRoleFeatures: {
    portal_admin: ['isp_portal.view_account', 'isp_portal.view_tickets', 'isp_portal.create_ticket'],
    buyer:        ['isp_portal.view_account', 'isp_portal.view_tickets', 'isp_portal.create_ticket'],
    viewer:       ['isp_portal.view_account'],
  },
}
```

El módulo `customer_accounts` recolecta estos `defaultCustomerRoleFeatures` de todos los módulos
habilitados durante `seedDefaults` y los fusiona en los `CustomerRoleAcl` del tenant.

---

## 6. Componentes UI del portal

**Fuente**: `packages/ui/src/portal/`

| Componente | Importación | Uso |
|-----------|-------------|-----|
| `usePortalContext()` | `@open-mercato/ui/portal/PortalContext` | Acceder a auth del customer y datos del tenant |
| `PortalPageHeader` | `@open-mercato/ui/portal/components/PortalPageHeader` | Título + subtítulo estandarizado |
| `PortalCard` + `PortalCardHeader` | `@open-mercato/ui/portal/components/PortalCard` | Cards del dashboard |
| `PortalEmptyState` | `@open-mercato/ui/portal/components/PortalEmptyState` | Estado vacío |
| `PortalFeatureCard` | `@open-mercato/ui/portal/components/PortalFeatureCard` | Cards de características en landing |
| `PortalShell` | `@open-mercato/ui/portal/PortalShell` | Shell completo (auto-provisto por `PortalLayoutShell`) |

El `PortalLayoutShell` ya provee el contexto. En las páginas internas del portal
se puede usar `usePortalContext()` directamente:

```typescript
// Fuente: packages/core/src/modules/portal/frontend/[orgSlug]/portal/dashboard/page.tsx
import { usePortalContext } from '@open-mercato/ui/portal/PortalContext'

export default function MyPortalPage({ params }: { params: { orgSlug: string } }) {
  const { auth, tenant } = usePortalContext()
  const { user, loading } = auth

  if (loading) return <Spinner />
  if (!user) {
    router.replace(`/${params.orgSlug}/portal/login`)
    return null
  }

  return <div>Hola, {user.displayName}</div>
}
```

---

## 7. Estructura completa del módulo portal

```
src/modules/<nombre>_portal/
  index.ts            ← metadata del módulo
  di.ts               ← register (vacío si no hay servicios propios)
  acl.ts              ← features admin (vacío si el portal es solo para clientes)
  setup.ts            ← defaultCustomerRoleFeatures
  notifications.ts    ← tipos de notificaciones in-app
  i18n/
    es.json
    en.json
  api/
    account/route.ts        ← GET estado de cuenta
    invoices/route.ts       ← GET facturas del cliente
    payments/route.ts       ← GET pagos
    tickets/route.ts        ← GET lista + POST nuevo ticket
    report-payment/route.ts ← POST reporte de pago
  frontend/
    [orgSlug]/
      portal/
        home/
          page.meta.ts      ← requireCustomerAuth: true + nav
          page.tsx          ← Props: { params: { orgSlug: string } }
        facturas/
          page.meta.ts
          page.tsx
        soporte/
          page.meta.ts
          page.tsx
          nuevo/
            page.meta.ts
            page.tsx
        servicio/
          page.meta.ts
          page.tsx
```

---

## 8. Implementación en isp_portal (referencia)

El módulo `isp_portal` de crm-world sigue el patrón correcto:

```
src/modules/isp_portal/frontend/[orgSlug]/portal/home/page.tsx
```

URL resultante para el ISP con org slug `telecarabobo`:
```
https://mercato.novaincs.com/telecarabobo/portal/home
```

Flujo de resolución:
1. Usuario visita `/telecarabobo/portal/home`
2. `(frontend)/layout.tsx` detecta el patrón `/portal/`
3. Busca `Organization.slug = 'telecarabobo'` en la BD → obtiene `tenantId` + `organizationId`
4. Envuelve en `PortalLayoutShell` con datos del tenant
5. `(frontend)/[...slug]/page.tsx` verifica `customer_auth_token` (cookie)
6. Si no existe → redirige a `/telecarabobo/portal/login`
7. Si existe → renderiza `IspPortalHome` con `params = { orgSlug: 'telecarabobo' }`

---

## 9. Deuda técnica: portales con slug fijo

Los siguientes módulos usan el patrón incorrecto (slug fijo). Funcionan en deploy single-tenant
porque el slug se configura manualmente, pero son incorrectos para uso multi-tenant:

| Módulo | Directorio actual (INCORRECTO) | Páginas | Directorio correcto |
|--------|-------------------------------|---------|---------------------|
| `condo_portal` | `frontend/condominio/portal/...` | 9 páginas | `frontend/[orgSlug]/portal/...` |
| `academy_portal` | `frontend/academia/...` | 4 páginas | `frontend/[orgSlug]/portal/...` |
| `dist_portal` | `frontend/portal/dashboard/` | 1 página | `frontend/[orgSlug]/portal/...` |
| `auto_portal` | `frontend/portal/vehicle/` | 1 página | `frontend/[orgSlug]/portal/...` |
| `parent_portal` | `frontend/portal/...` | 4 páginas | `frontend/[orgSlug]/portal/...` |

Adicionalmente, estos módulos no usan `PortalContext` ni los componentes `PortalCard`/`PortalPageHeader`,
lo que significa que sus páginas no aprovechan la shell del portal ni la navegación auto-generada.

**Prioridad de corrección**: Media. No rompen funcionalidad en deploy actual (single-tenant con slug
configurado), pero deben corregirse antes de habilitar múltiples tenants de la misma vertical en
un mismo deployment.

---

## 10. Flujo de vinculación abonado ↔ portal

Para que un abonado del ISP pueda entrar al portal, el operador debe vincularlo:

```
1. Operador crea el abonado en isp_subscribers
   → opcionalmente vincula customer_entity_id al CRM

2. Operador invita al abonado al portal:
   POST /api/customer_accounts/admin/users-invite
   { email, customerEntityId: <entity_id_del_abonado>, roleIds: ['buyer'] }

3. Abonado recibe email con link de invitación
   → crea su contraseña en /{orgSlug}/portal/signup o /invitations/accept

4. Al crear la sesión, el JWT incluye:
   { sub: CustomerUser.id, customerEntityId: <entity_id> }
   Fuente: customerSessionService.ts → customerEntityId: user.customerEntityId

5. Las API routes del portal usan ctx.customerContext.customerEntityId
   para buscar el abonado en isp_subscribers.customer_entity_id
```

---

## 11. Checklist para un nuevo módulo portal

- [ ] Directorio: `frontend/[orgSlug]/portal/<path>/` (NO slug fijo)
- [ ] `page.meta.ts`: `requireCustomerAuth: true` + `requireCustomerFeatures`
- [ ] Componente: acepta `{ params: { orgSlug: string } }` como props
- [ ] Links internos: usan `/${params.orgSlug}/portal/<path>` (NO paths absolutos fijos)
- [ ] API routes: usan `ctx.customerContext?.customerEntityId` (NO `.entityId`)
- [ ] `setup.ts`: declara `defaultCustomerRoleFeatures` para los roles portal_admin/buyer/viewer
- [ ] `acl.ts`: vacío para módulos 100% cliente (no hay features admin)
- [ ] `notifications.ts`: tipos para alertas in-app relevantes
