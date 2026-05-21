# Realtime en Aika Platform — Guía de clientBroadcast

> **Canal**: Servidor → Browser (SSE unidireccional, interno, por tenant)
> **Framework**: Open Mercato `@open-mercato/events` + DOM Event Bridge
> **Utility base**: `src/lib/emit-lifecycle.ts`

---

## ¿Qué es clientBroadcast?

`clientBroadcast` es el mecanismo de Open Mercato que empuja eventos del servidor
al browser en tiempo real, sin polling. Es el canal comunicacional entre cualquier
acción que ocurra en el CRM (pago registrado, estado cambiado, voto emitido) y la
interfaz web que debe reflejarlo instantáneamente.

```
Acción en el servidor                 Browser del mismo tenant
─────────────────────                 ───────────────────────
eventsConfig.emit(                →   useAppEvent('condo_fees.receipt.paid',
  'condo_fees.receipt.paid',            (event) => {
  { tenantId, id }                        setReceipts(prev => updateStatus(prev, event))
)                                       }
                                    )
```

**No requiere nada externo.** No es un webhook, no escucha sistemas externos.
Es un pipe interno: `emit()` en el servidor → SSE → `useAppEvent()` en el browser.

**Aislamiento por tenant.** El framework filtra por `tenantId` antes de enviar.
Un usuario del Tenant A nunca recibe eventos del Tenant B, aunque ambos tengan
la misma ventana abierta.

---

## Arquitectura completa

```
Servidor (Node.js)                   Browser (React)
──────────────────                   ──────────────
1. Acción ocurre                     5. useAppEvent() recibe el evento
   (pago, aprobación, voto)              └─ actualiza estado local (React)
      │                                     sin recargar la página
      ▼
2. emitLifecycle() llamado
   └─ eventsConfig.emit(id, payload)
      │
      ▼
3. Event bus de OM verifica:
   ¿clientBroadcast: true?
      │ sí
      ▼
4. SSE endpoint /api/events/stream
   filtra por tenantId + organizationId
   └─ empuja el evento al browser correcto
```

---

## Eventos disponibles por vertical

### Condominios

| Evento | clientBroadcast | Cuándo se dispara | Quién llama emit() |
|--------|:-:|---|---|
| `condo_fees.receipts.generated` | ✅ | Generación masiva de recibos | `api/generate/route.ts` |
| `condo_fees.receipt.paid` | ✅ | Pago registrado en un recibo | `api/receipts/pay/route.ts` |
| `condo_fees.receipt.overdue` | ✅ | Worker diario detecta mora | `workers/detect-overdue.ts` |
| `condo_fees.config.created` | — | Nueva cuota configurada | makeCrudRoute (auto) |
| `condo_comms.circular.published` | ✅ | Circular publicada | _pendiente_ (ver §Pendientes) |
| `condo_comms.vote.opened` | ✅ | Votación abierta | _pendiente_ |
| `condo_comms.vote.closed` | ✅ | Votación cerrada por worker | `workers/close-expired-votes.ts` |
| `condo_comms.vote.cast` | ✅ | Voto emitido (tally en vivo) | `api/votes/cast/route.ts` |
| `condo_collections.debtor.detected` | ✅ | Moroso detectado (worker) | _pendiente_ |
| `condo_collections.agreement.defaulted` | ✅ | Acuerdo de pago incumplido | _pendiente_ |
| `condo_maintenance.request.created` | ✅ | Nueva solicitud | makeCrudRoute (auto) |
| `condo_maintenance.request.assigned` | ✅ | Solicitud asignada | _pendiente_ (PUT route) |
| `condo_maintenance.request.completed` | ✅ | Solicitud completada | _pendiente_ (PUT route) |
| `condo_maintenance.work_order.completed` | ✅ | Orden de trabajo terminada | _pendiente_ |

### Construcción

| Evento | clientBroadcast | Cuándo se dispara | Quién llama emit() |
|--------|:-:|---|---|
| `const_progress.valuation.submitted` | ✅ | Valuación enviada para aprobación | `api/valuations/submit/route.ts` |
| `const_progress.valuation.approved` | ✅ | Valuación aprobada | `api/valuations/approve/route.ts` |
| `const_progress.valuation.paid` | ✅ | Valuación marcada como pagada | _pendiente_ (PUT route) |
| `const_progress.valuation.rejected` | ✅ | Valuación rechazada | _pendiente_ (PUT route) |
| `const_rfis.rfi.answered` | ✅ | RFI respondido | `api/rfis/answer/route.ts` |
| `const_rfis.rfi.overdue` | ✅ | Worker escala RFI a urgente | `workers/detect-overdue.ts` |
| `const_rfis.submittal.approved` | ✅ | Submittal aprobado | _pendiente_ (PUT route) |
| `const_rfis.submittal.rejected` | ✅ | Submittal rechazado | _pendiente_ (PUT route) |
| `const_projects.project.status_changed` | — | Estado del proyecto cambia | _pendiente_ |

### Educación

| Evento | clientBroadcast | Cuándo se dispara | Quién llama emit() |
|--------|:-:|---|---|
| `tuition.payment.recorded` | ✅ | Pago registrado | Interceptor `api/interceptors.ts` |
| `tuition.charge.paid` | ✅ | Cargo marcado como pagado | _pendiente_ (PUT route) |
| `tuition.charge.overdue` | ✅ | Worker detecta mora | _pendiente_ (worker) |
| `tuition.charges.generated` | ✅ | Generación masiva de cargos | _pendiente_ (generate route) |

### Distribución

| Evento | clientBroadcast | Cuándo se dispara | Quién llama emit() |
|--------|:-:|---|---|
| `dist_credit.transaction.created` | ✅ | Transacción de crédito creada | Interceptor `api/interceptors.ts` |
| `dist_credit.account.overdue` | ✅ | Cuenta vencida (worker) | _pendiente_ (worker) |
| `dist_credit.account.blocked` | ✅ | Cliente bloqueado | _pendiente_ (PUT limits route) |

### Automotriz

| Evento | clientBroadcast | Cuándo se dispara | Quién llama emit() |
|--------|:-:|---|---|
| `auto_service_orders.order.status_changed` | ✅ | Status de orden cambia | Interceptor `api/interceptors.ts` |
| `auto_service_orders.order.completed` | ✅ | Orden completada (PUT status=completed) | Interceptor `api/interceptors.ts` |
| `auto_service_orders.order.delivered` | ✅ | Vehículo entregado (PUT status=delivered) | Interceptor `api/interceptors.ts` |

---

## Cómo consumir eventos en una página React

```typescript
'use client'
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'

export default function ReceiptsPage() {
  const [receipts, setReceipts] = React.useState<ReceiptRow[]>([])

  // Escuchar un evento específico
  useAppEvent('condo_fees.receipt.paid', (event) => {
    // event.id, event.payload, event.tenantId, event.organizationId
    setReceipts((prev) =>
      prev.map((r) => r.id === event.payload.id
        ? { ...r, status: event.payload.new_status as string }
        : r
      )
    )
  }, [])

  // Escuchar todos los eventos del módulo con wildcard
  useAppEvent('condo_fees.*', (event) => {
    console.log('Condo fees event:', event.id, event.payload)
  }, [])

  // Recargar toda la lista al recibir cualquier cambio relevante
  useAppEvent('condo_fees.receipts.generated', () => {
    loadReceipts() // tu función de carga existente
  }, [])

  // ...
}
```

### Reglas para useAppEvent

1. **Colocarlo siempre dentro de un componente client** (`'use client'`).
2. **El array de dependencias** funciona igual que `useEffect` — incluye las
   variables externas que use el handler.
3. **Wildcards disponibles**: `'module.*'`, `'module.entity.*'`, `'*'` (todos).
4. **Filtrado automático**: el hook solo recibe eventos del tenant + organización
   activos en la sesión del usuario.
5. **No necesita cleanup**: el framework gestiona la suscripción/desuscripción
   automáticamente con el ciclo de vida del componente.

---

## Cómo emitir desde una ruta custom

Para rutas que usan Kysely directamente (no `makeCrudRoute`):

```typescript
// src/modules/mi_modulo/api/mi_accion/route.ts
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../../events'

export async function POST(request: Request, ctx: any) {
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // 1. Realiza el cambio en la base de datos
  await kysely.updateTable('mi_tabla')
    .set({ status: 'nuevo_estado', updated_at: new Date() })
    .where('id', '=', entity_id)
    .execute()

  // 2. Emite el evento DESPUÉS de que el UPDATE se confirme
  await emitLifecycle(eventsConfig, 'mi_modulo.entidad.accion', scope, {
    id: entity_id,
    // campos adicionales relevantes para el handler en el browser
  })

  return Response.json({ success: true })
}
```

**Convención de payload:**
- Siempre incluye `id` del registro afectado.
- Incluye campos que el browser necesita para actualizar la UI sin un refetch
  (ej: `new_status`, `total_votes`, `approved_by`).
- Máximo 4 KB por evento (límite del SSE).

---

## Cómo emitir desde un worker (background job)

Los workers no tienen acceso a `ctx.scope` — el scope viene del payload del job:

```typescript
// src/modules/mi_modulo/workers/mi-worker.ts
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'mi-modulo-queue',
  id: 'mi-modulo-worker',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const { tenantId, organizationId } = payload

  // ... lógica del worker ...

  // Emitir con el scope del payload del job (no del ctx)
  await emitLifecycle(
    eventsConfig,
    'mi_modulo.entidad.accion',
    { tenantId, organizationId },
    { id: entity_id, affected_count: count },
  )
}
```

**Importante:** Cuando el worker procesa múltiples registros de diferentes tenants,
emite por cada tenant por separado. El SSE filtra por `tenantId` — si emites con
el `tenantId` incorrecto, el evento no llegará al browser correcto.

---

## Cómo emitir desde una ruta `makeCrudRoute` (interceptores)

Para rutas basadas en `makeCrudRoute` (como payments, transactions, orders), usa
el sistema de interceptores de Open Mercato. El `after` hook se ejecuta después
de que `makeCrudRoute` confirma el cambio en la BD:

```typescript
// src/modules/mi_modulo/api/interceptors.ts
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'mi_modulo.recurso-broadcast',
    targetRoute: 'mi-modulo/recurso',   // path sin /api/ prefix, guiones en vez de _
    methods: ['POST'],                   // o ['PUT'] para updates
    priority: 10,
    async before() {
      return { ok: true }
    },
    async after(_request, _response, context) {
      await emitLifecycle(
        eventsConfig,
        'mi_modulo.recurso.creado',
        { tenantId: context.tenantId, organizationId: context.organizationId },
      )
      return {}  // {} = sin modificar el response body
    },
  },
]
```

**Pasar datos del before al after** (útil para capturar campos del body):

```typescript
async before(request) {
  return {
    ok: true,
    metadata: { newStatus: request.body?.status ?? null },
  }
},
async after(_request, _response, context) {
  const newStatus = context.metadata?.newStatus
  if (!newStatus) return {}  // Solo emite si es relevante
  await emitLifecycle(eventsConfig, 'mi_modulo.entity.status_changed', {
    tenantId: context.tenantId, organizationId: context.organizationId,
  }, { new_status: newStatus })
  return {}
},
```

**Convención de `targetRoute`:**
- Sin prefix `/api/`
- Guiones en lugar de guiones bajos: `dist-credit/transactions`, no `dist_credit/transactions`
- Coincide con el path del API route file dentro del módulo

---

## Cómo agregar un nuevo evento con clientBroadcast

### Paso 1 — Declarar el evento en `events.ts`

```typescript
// src/modules/mi_modulo/events.ts
export const eventsConfig = createModuleEvents({
  moduleId: 'mi_modulo',
  events: [
    // Agrega clientBroadcast: true solo en eventos lifecycle relevantes para la UI
    { id: 'mi_modulo.entidad.accion', label: 'Descripción', entity: 'entidad',
      category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
```

**Cuándo usar `clientBroadcast: true`:**
- ✅ Cambios de estado que la UI debe reflejar inmediatamente (pago, aprobación)
- ✅ Acciones que múltiples usuarios podrían estar viendo al mismo tiempo (votaciones)
- ✅ Alertas que deben aparecer sin que el usuario recargue (morosos, urgentes)
- ❌ Eventos CRUD masivos que crearían flood (NO en entity.updated de listas largas)
- ❌ Eventos internos que no tienen representación visual

### Paso 2 — Emitir el evento

Elige el patrón según el tipo de ruta:

| Tipo de ruta | Patrón |
|---|---|
| Ruta custom con Kysely | `emitLifecycle()` al final del handler |
| `makeCrudRoute` POST/PUT | `api/interceptors.ts` con `after` hook |
| Worker background | `emitLifecycle()` con scope del job payload |

### Paso 3 — Consumir en la UI

```typescript
useAppEvent('mi_modulo.entidad.accion', (event) => {
  // Actualiza el estado local
}, [dependencias])
```

### Paso 4 — Personalización por tenant (no requiere código)

Cada página decide independientemente qué eventos escuchar. Un tenant puede
tener una página customizada que reaccione a eventos adicionales, o que ignore
los que no le son relevantes. No hay configuración server-side per-tenant —
la personalización ocurre en el frontend a nivel de `useAppEvent`.

---

## Tabla de referencia rápida

| Necesito... | Usar |
|---|---|
| Emitir desde ruta custom | `emitLifecycle(eventsConfig, eventId, scope, extra?)` |
| Emitir desde worker | `emitLifecycle(eventsConfig, eventId, { tenantId, organizationId }, extra?)` |
| Emitir desde makeCrudRoute | `api/interceptors.ts` con `after` hook |
| Escuchar en componente React | `useAppEvent(pattern, handler, deps)` |
| Escuchar wildcards | `useAppEvent('module.*', handler, deps)` |
| Ver todos los eventos activos | `src/modules/*/events.ts` con `clientBroadcast: true` |
| Utility base | `src/lib/emit-lifecycle.ts` |

---

## §Pendientes — Eventos declarados pero sin emit() wired

Estos eventos tienen `clientBroadcast: true` en su `events.ts` pero aún no tienen
la llamada a `emit()` implementada. Son candidatos para el siguiente sprint:

| Módulo | Evento | Dónde agregar emit() |
|---|---|---|
| `condo_comms` | `circular.published` | `api/circulars/send/route.ts` (crear este endpoint) |
| `condo_comms` | `vote.opened` | PUT en `api/votes/route.ts` cuando status → 'open' |
| `condo_collections` | `debtor.detected` | `workers/whatsapp-reminder.ts` |
| `condo_maintenance` | `request.assigned` | Interceptor PUT en `api/requests/route.ts` |
| `condo_maintenance` | `request.completed` | Interceptor PUT en `api/requests/route.ts` |
| `const_progress` | `valuation.paid` | Interceptor PUT cuando status → 'paid' |
| `const_progress` | `valuation.rejected` | Interceptor PUT cuando status → 'rejected' |
| `const_rfis` | `submittal.approved/rejected` | Interceptor PUT en `api/submittals/route.ts` |
| `tuition` | `charge.paid` | Interceptor PUT en `api/charges/route.ts` |
| `tuition` | `charge.overdue` | Worker de detección de mora |
| `tuition` | `charges.generated` | `api/charges/generate/route.ts` |
| `dist_credit` | `account.overdue` | Worker de crédito |
| `dist_credit` | `account.blocked` | Interceptor PUT en `api/limits/route.ts` |

Para agregar cualquiera de estos, sigue el patrón de §Cómo agregar un nuevo evento.
