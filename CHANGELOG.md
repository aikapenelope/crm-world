# Changelog — Aika Platform (CRM World)

## 2026-05-23 — CI Pipeline + Phase 19 Workflows (PR #69)

### CI Pipeline — Phase 18 (.github/workflows/ci.yml)

Primera vez que el CI llega al repo. Dos jobs en paralelo sobre cada PR hacia main:

- **typecheck**: `yarn generate` (descubre módulos) → `yarn typecheck` (tsc --noEmit)
- **lint**: `yarn lint` (ESLint)

El audit de seguridad (`yarn npm audit`) excluido deliberadamente — en un codebase con ~300+ dependencias transitivas de OM core/react/next.js, los CVEs ajenos bloquearían PRs válidos sin posibilidad de resolución.

Concurrency cancel: descarta runs anteriores del mismo ref al hacer push nuevo. Cache de `.yarn/cache` + `node_modules` por hash de `yarn.lock`.

### Phase 19 — 5 Workflows de Aprobación

Infraestructura compartida (`src/lib/workflows/`):
- `WorkflowApprovalWidget.tsx` — widget React inline para páginas de detalle. Muestra estado del workflow + botones de decisión. Llama al motor OM via `/api/workflows/instances` y `/api/workflows/tasks/[id]/complete`
- `seed-workflow.ts` — helper que hace upsert de `WorkflowDefinition` en la BD para el tenant. Usa `WorkflowDefinition` entity de `@open-mercato/core`
- `useWorkflowApproval.ts` — hook que encapsula estado del widget (polling instance + task)

5 definiciones JSON en `examples/` de cada módulo + `setup.ts → seedDefaults`:

| Workflow | Módulo | Página | Caso de uso |
|---------|--------|--------|-------------|
| `gasto_extraordinario_v1` | `condo_accounting` | `entries/[id]` (nuevo) | Junta aprueba gastos fuera presupuesto (Ley PH Venezuela) |
| `change_order_approval_v1` | `const_rfis` | `[id]` (existente) | Revisión técnica + dirección aprueban change orders |
| `limite_credito_v1` | `dist_credit` | `[id]` (nuevo) | Gerencia financiera autoriza cambios de límite |
| `inscripcion_escolar_v1` | `enrollment` | `applications/[id]` (nuevo) | Comité de admisiones decide inscripciones |
| `devolucion_fuera_politica_v1` | `retail_returns` | `[id]` (existente) | Gerente autoriza devoluciones fuera de política |

Los workflows se seed automáticamente al crear un tenant. Son visibles y editables en `/backend/workflows`.

---

## 2026-05-23 — Estandarización de módulos (Sprints S1–S6) (PRs #63–#67)

Auditoría completa + corrección sistemática de 83 módulos para cumplir patrones Open Mercato oficiales. Verificados contra el repo oficial `packages/shared/src/modules/` y `packages/core/src/modules/`.

### Sprint 1 — Críticos estructurales (PR #63)
- `mercadolibre_sync/events.ts` — declara `sync.completed` / `sync.failed`; worker emite evento al finalizar
- `ratelimit_probe/i18n/` + `ve_tenant_defaults/i18n/` — archivos vacíos requeridos por el generador

### Sprint 2 — Schema notifications.ts (PR #64)
**Hallazgo crítico**: 10 módulos usaban campos inventados (`id`, `label`, `category`, `defaultChannels`) que NO existen en `NotificationTypeDefinition` del tipo oficial (`packages/shared/src/modules/notifications/types.ts:58`).

Schema correcto:
```typescript
{ type, module, titleKey, bodyKey, icon, severity, actions, linkHref, expiresAfterHours }
```

Módulos corregidos: `isp_billing`, `isp_subscribers`, `isp_support`, `condo_fees`, `condo_comms`, `condo_maintenance`, `const_daily`, `const_progress`, `const_rfis`, `auto_service_orders`. + 74 claves i18n añadidas.

### Sprint 3 — search.ts (PR #65)
12 módulos con backend+entities sin cobertura Cmd+K añadidos: `academy_payments`, `academy_sessions`, `attendance`, `bank_reconciliation`, `const_daily`, `market_intelligence`, `mercadolibre_sync`, `payment_methods`, `school_calendar`, `school_comms`, `school_docs`, `ve_tax_books`. Coverage: 64% → 79%.

### Sprint 4 — raw `<form>` → CrudForm (PR #66)
- 7 páginas create dedicadas migradas: `retail_branches`, `retail_inventory/counts`, `retail_loyalty/campaigns`, `const_projects`, `condo_properties`, `condo_fees/configs`, `condo_properties/units`
- 19 páginas documentadas con comentario `AGM Exception` (3 categorías: inline quick-add, dynamic line items, dynamic API options)

### Sprint 5+6 — notifications.ts + button/table cleanup (PR #67)
- 32 `notifications.ts` nuevos → coverage 16% → **100%** (63/63 módulos operativos)
- 15 archivos: raw `<button>` → `<Button type="button" variant="ghost">`
- 4 archivos: raw `<table>` documentados como AGM Exception (grids de entrada de datos)

---

## 2026-05-22 — Portal Pattern Fix + PORTAL_GUIDE.md (PRs #61–#62)

### Corrección crítica: patrón `[orgSlug]/portal/`

**Hallazgo**: todos los portales de cliente en crm-world usaban slugs fijos (`condominio/`, `academia/`, etc.) en lugar del segmento dinámico `[orgSlug]/portal/` requerido por Open Mercato.

Fuente oficial verificada: `packages/core/src/modules/portal/frontend/[orgSlug]/portal/dashboard/page.tsx`

Auto-detección del `PortalLayoutShell` en `src/app/(frontend)/layout.tsx`:
```typescript
const portalMatch = pathname.match(/^\/([^/]+)\/portal(?:\/|$)/)
// Si match → envuelve en PortalLayoutShell con tenant resuelto por orgSlug
```

**Bug adicional**: API routes usaban `ctx.customerContext?.entityId` (no existe en `CustomerAuthContext`) en lugar del correcto `ctx.customerContext?.customerEntityId`. Verificado en `packages/core/src/modules/customer_accounts/lib/customerAuth.ts`.

PR #61: fix `isp_portal` + `docs/PORTAL_GUIDE.md` (cita exacta de fuentes OM)
PR #62: migración de 5 portales existentes (condo, academy, dist, auto, parent) — 19 páginas totales

---

## 2026-05-22 — ISP/Telecomunicaciones Venezuela — Phase 22 (PRs #57–#60)

Vertical completa para ISPs venezolanos. 9 módulos, facturación USD/VES, portal del abonado.

### Phase 22-A — Core MVP (PR #58)
- `isp_plans` — Catálogo de planes (fiber/wireless, residential/PYME/corporate), perfil Radius/OLT
- `isp_network` — Nodos de red con autonomía UPS, CPE inventory, `report-outage` endpoint
- `isp_subscribers` — Lifecycle completo (pending_installation → active ↔ suspended → cancelled), PPPoE/IP
- `isp_billing` — Facturación mensual USD+VES, IVA 16%, IGTF 3%, worker detect-overdue, notify lib transversal

### Phase 22-B — Operaciones (PR #59)
- `isp_support` — Tickets técnicos + averías masivas, subscriber `on-node-outage` automático, worker SLA
- `isp_technicians` — Técnicos de campo, work orders, endpoint `complete` activa servicio automáticamente
- `isp_sales` — Pipeline leads, verificación cobertura por ciudad, comisiones con workflow aprobación

### Phase 22-Portal + Gaps (PR #60)
- `isp_portal` — Portal del abonado con patrón `[orgSlug]/portal/` correcto
- search.ts para 7 módulos ISP (account_number como campo prioritario, pppoe_username como hashOnly)
- notifications.ts con schema correcto
- Worker SLA breach + account number auto-generado (interceptor)

### Cadena event-driven
```
report-outage endpoint → isp_network.node.outage_reported
  → on-node-outage subscriber → crea avería + ticket automáticamente

work-orders/complete → isp_technicians.installation.done
  → isp_subscribers activa el servicio

isp_billing worker detect-overdue → cut_triggered
  → isp_subscribers suspende por mora
```

---

## 2026-05-21 — Phase 17: PDFs + Phase 20: Academias (PRs #49–#52)

### Phase 17 — 6 PDFs con branding del tenant (PR #52)
Sistema compartido en `src/lib/pdf/` usando `@react-pdf/renderer`.

| PDF | Endpoint | Módulo |
|-----|---------|--------|
| Recibo de condominio | `GET /api/condo-fees/receipts/pdf?id=` | `condo_fees` |
| Valuación de obra | `GET /api/const-progress/valuations/pdf?id=` | `const_progress` |
| Boletín escolar | `GET /api/grades/boleta-pdf?student_id=` | `grades` |
| Constancia de inscripción | `GET /api/enrollment/constancia-pdf?student_id=` | `enrollment` |
| Nota de entrega | `GET /api/dist-delivery/nota-entrega-pdf?id=` | `dist_delivery` |
| Acta de asamblea | `GET /api/condo-comms/acta-pdf?id=` | `condo_comms` |

### Phase 20 — Academia y Centros de Formación (9 módulos) (PRs #49–#50)
- `academy_courses`, `academy_instructors`, `academy_groups`, `academy_sessions`, `academy_enrollments`, `academy_attendance`, `academy_payments`, `academy_certificates`, `academy_portal`
- Kanban board de grupos (4 columnas, real-time)
- Tap-to-cycle para registro de asistencia
- Certificados con URL de verificación pública `/cert/[number]`
- AI Agent — Asistente del Director de Academia (5 tools)
- Portal del estudiante (cursos, sesiones, pagos, certificados)

---

## 2026-05-21 — Condominios + Construcción + Real-time (PRs #39–#48)

### Phase 12 — Condominios (7 módulos)
`condo_properties`, `condo_fees`, `condo_collections`, `condo_maintenance`, `condo_accounting`, `condo_comms`, `condo_portal`
- PDFs: recibo de condominio + acta de asamblea
- Votaciones con alícuota ponderada (Ley PH Venezuela)
- WhatsApp reminder para morosos
- AI Agent — Asistente del Administrador de Condominio

### Phase 13 — Construcción (8 módulos)
`const_projects`, `const_budget`, `const_schedule`, `const_progress`, `const_rfis`, `const_daily`, `const_subcon`, `const_materials`
- PDF: valuación de obra con tabla de partidas, retenciones/anticipos, firmas
- Sistema de RFIs con respuesta técnica + impacto costo/cronograma
- AI Agent — Asistente del Director de Obra

### Phase 14 — Real-time + Quality
- `emit-lifecycle.ts` — utilidad para emitir eventos desde routes y workers
- `clientBroadcast: true` en eventos clave
- `search.ts` universal (después de S3: 100% cobertura)
- Tokens semánticos OM reemplazando colores hardcoded

---

## 2026-05-20 — Retail (PR #37)

### Phase 11 — Retail/Comercio (7 módulos)
`retail_branches`, `retail_inventory`, `retail_loyalty`, `retail_returns`, `retail_ecommerce`, `retail_purchasing`, `retail_pricing`
- Sistema de fidelización con puntos, niveles VIP, campañas
- Tienda online (frontend/tienda/) con carrito y checkout
- Worker rotación de inventario y dead stock detection
- AI Agent — Asistente del Gerente de Retail

---

## 2026-05-20 — Fiscal + Distribución + Automotriz (ver entrada anterior)

---

## 2026-05-20 — Education Vertical (ver entrada anterior)

---

## 2026-05-19 — Real Estate UI + Cleanup (ver entrada anterior)

---

## 2026-05-18 — Fundación e Infraestructura (ver entrada anterior)

---

## Resumen de estado actual

### 83 módulos — cobertura total

| Feature | Coverage |
|---------|---------|
| `index.ts` + `di.ts` | 100% |
| `i18n` (es+en) | 100% |
| `@Property({ type: })` | 100% (cero bare properties) |
| `search.ts` | 100% (módulos con backend+entities) |
| `notifications.ts` (schema correcto) | 100% (módulos operativos) |
| `events.ts` (módulos con workers) | 100% |
| Portal `[orgSlug]/portal/` | 100% (portales de cliente) |

### PRs abiertos (pendientes de merge)
| PR | Contenido | Estado |
|----|-----------|--------|
| #68 | ROADMAP actualizado | Listo |
| #69 | CI + 5 Workflows | Listo |

### Pendiente de implementación
- **Phase 22-C**: `isp_monitoring` — Webhooks Zabbix/PRTG + Radius/OLT (cuando haya cliente con NMS)
- **GitHub Actions**: configurar "Allow all actions" en Settings → Actions → General
- **Infraestructura**: Docker layer caching, Resend email, wildcard domain `*.aika.com.ve`
