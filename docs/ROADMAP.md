# Roadmap — Aika Platform

> Última actualización: Mayo 2026
> Stack: Open Mercato v0.6.1 · Next.js 16 · Hetzner CX33 Helsinki · Coolify 4.0
> Deploy URL: mercato.novaincs.com · Panel: deploy.novaincs.com

---

## Verticales — Estado

| Vertical | Phase | Módulos | AI Agent | Search | PDF | Estado |
|----------|-------|---------|----------|--------|-----|--------|
| Real Estate / Inmobiliaria | 2–6 | 8 módulos | ✅ | ✅ | — | **COMPLETO** |
| Fiscal Venezuela (transversal) | 7 | 4 módulos | — | ✅ | — | **COMPLETO** |
| Educación / Colegios | 8 | 10 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Distribución / Distribuidoras | 9 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Automotriz / Talleres | 10 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Retail / Comercio | 11 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Condominios | 12 | 7 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Construcción / Constructoras | 13 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| **Academias y Formación** | 20 | 9 módulos | ✅ | ✅ | — | **COMPLETO** |
| **ISP / Telecomunicaciones** | 22 | 9 módulos | — | ✅ | — | **COMPLETO** |
| Fitness / Gym | — | — | — | — | — | Candidata |
| Beauty / Salones | — | — | — | — | — | Candidata |
| Services / Agencias | — | — | — | — | — | Candidata |
| Transporte / Logística | — | — | — | — | — | Futura |

> **Healthcare / Clínicas — DESCARTADO.**
> **Restaurant / Food — DESCARTADO.** Fuera de roadmap.

---

## Completado

### Phase 0 — Infraestructura base
- [x] Hetzner CX33 (Helsinki) via Pulumi
- [x] Coolify 4.0 (deploy.novaincs.com)
- [x] HTTPS (Let's Encrypt)
- [x] Seguridad (fail2ban, UFW, swap, backups)
- [x] Auto-deploy on push to main

### Phase 1 — Base Venezuela (todos los tenants)
- [x] `venezuela_rates` — DolarApi (BCV + paralelo)
- [x] `payment_methods` — 7 métodos locales (Zelle, Binance, efectivo USD/VES, transferencia, pago móvil, punto)
- [x] `ve_fiscal` — RIF/CI, IVA 16%, IGTF 3%
- [x] `ve_tenant_defaults` — auto-config al crear tenant

### Phase 2–6 — Real Estate / Inmobiliaria (completo)
- [x] `properties`, `transactions`, `matching`, `property_portal`, `property_docs`, `property_publishing`, `mercadolibre_sync`, `market_intelligence`
- [x] Dashboard widgets, notificaciones, agent portal, CSV import, `search.ts`
- [x] **AI Agent** — Asistente del Agente Inmobiliario (5 tools)

### Phase 7 — Fiscal Venezuela (transversal)
- [x] `ve_tax_books`, `ve_withholdings`, `ve_tax_reports`, `bank_reconciliation`

### Phase 8 — Educación / Colegios (completo)
- [x] `students`, `enrollment`, `tuition`, `grades`, `attendance`, `school_calendar`, `school_comms`, `school_docs`, `parent_portal`, `school_migration`
- [x] `search.ts` para todos los módulos de educación
- [x] **AI Agent** — Asistente del Director Escolar (tuition, 5 tools)
- [x] **PDFs** — Boletín escolar + Constancia de inscripción

### Phase 9 — Distribución / Distribuidoras (completo)
- [x] `dist_credit`, `dist_price_lists`, `dist_inventory`, `dist_routes`, `dist_delivery`, `dist_reports`, `dist_commissions`, `dist_portal`
- [x] `search.ts` para todos los módulos dist
- [x] **AI Agent** — Asistente del Director de Distribución (dist_reports, 5 tools)
- [x] **PDF** — Nota de entrega / Remisión

### Phase 10 — Automotriz / Talleres Mecánicos (completo)
- [x] `auto_vehicles`, `auto_service_orders`, `auto_inspections`, `auto_parts`, `auto_estimates`, `auto_reports`, `auto_portal`
- [x] `search.ts` para todos los módulos auto
- [x] **AI Agent** — Asistente del Gerente de Taller (auto_reports, 5 tools)
- [x] Regionalización VE: 15 marcas, 20 servicios comunes, validación placa venezolana

### Phase 11 — Retail / Comercio (completo)
- [x] `retail_branches`, `retail_inventory`, `retail_loyalty`, `retail_returns`, `retail_ecommerce`, `retail_purchasing`, `retail_pricing`
- [x] `search.ts` para todos los módulos retail
- [x] **AI Agent** — Asistente del Gerente de Retail (retail_branches, 5 tools)

### Phase 12 — Condominios / Property Management (completo)
- [x] `condo_properties`, `condo_fees`, `condo_collections`, `condo_maintenance`, `condo_accounting`, `condo_comms`, `condo_portal`
- [x] `search.ts` para `condo_properties`, `condo_fees`, `condo_maintenance`, `condo_collections`
- [x] **AI Agent** — Asistente del Administrador de Condominio (6 tools)
- [x] **PDFs** — Recibo de condominio + Acta de asamblea

### Phase 13 — Construcción / Constructoras (completo)
- [x] `const_projects`, `const_budget`, `const_schedule`, `const_progress`, `const_rfis`, `const_daily`, `const_subcon`, `const_materials`
- [x] `search.ts` para todos los módulos const
- [x] **AI Agent** — Asistente del Director de Obra (6 tools)
- [x] **PDF** — Valuación de obra (tabla de partidas, montos, firmas)

### Phase 14 — Real-time + Platform Quality (completo)
- [x] `emit-lifecycle.ts`, `calendar-links.ts` — utilidades base
- [x] `clientBroadcast: true` + `emitLifecycle()` en módulos clave
- [x] `indexer: { entityType }` en todas las CRUD routes
- [x] `search.ts` universal — 63 módulos (100% coverage)
- [x] Módulo `example` desactivado, tokens semánticos OM

### Phase 15 — Portal del Propietario Condominios (completo)
- [x] Recibos, mantenimiento, circulares, votaciones, documentos, estado de cuenta

### Phase 16 — Páginas de Detalle `[id]` (completo)
- [x] `const_projects/[id]`, `condo_properties/[id]`, `condo_fees/receipts/[id]`
- [x] `const_rfis/[id]`, `const_daily/[id]`, `auto_service_orders/[id]`

### Phase 17 — Generación de PDFs (completo)
- [x] Recibo de condominio, Valuación de obra, Boletín escolar, Constancia de inscripción, Nota de entrega, Acta de asamblea

### Phase 18 — CI Pipeline (código listo, requiere acción en GitHub)
- [x] `.github/workflows/ci.yml` — en main desde el scaffold inicial. 3 jobs: `typecheck` (`yarn generate` + `yarn typecheck`), `audit` (`yarn npm audit --severity high`), `lint`
- [x] Concurrency cancel, cache de `.yarn/cache` + `node_modules` por hash de `yarn.lock`

> **⚠ Por qué no está corriendo en los PRs:**
> GitHub Actions requiere aprobación para workflows disparados por apps/bots externos.
> **Fix**: `Settings → Actions → General → "Fork pull request workflows"` → cambiar a
> "Allow all actions and reusable workflows". O aprobar manualmente en la pestaña Actions de cada PR.

- [ ] Docker layer caching en Coolify — reducir build time
- [ ] Resend email — `mail.aikalabs.cc`
- [ ] Wildcard domain `*.aika.com.ve`

### Phase 19 — Workflows de Aprobación (código listo en PR #53, requiere rebase)

Usa el motor `workflows` de Open Mercato (ya habilitado). Los workflows NO son módulos nuevos:
son **definiciones JSON** + seed en `setup.ts` + widget inline en la página de detalle de la entidad.
Infraestructura compartida en `src/lib/workflows/` (`WorkflowApprovalWidget`, `seed-workflow.ts`, `useWorkflowApproval.ts`).

- [x] **Gasto extraordinario** (`condo_accounting/entries/[id]`) — Junta de propietarios aprueba gastos fuera del presupuesto ordinario (requerido por Ley de PH Venezuela)
- [x] **Change order** (`const_rfis/[id]`) — Gerente de obra aprueba RFIs con impacto en alcance/costo antes de facturar en valuación
- [x] **Límite de crédito** (`dist_credit/[id]`) — Gerencia de distribución autoriza aumentos del límite de crédito de distribuidores
- [x] **Inscripción escolar** (`enrollment/applications/[id]`) — Comité de admisiones revisa y aprueba solicitudes de inscripción
- [x] **Devolución fuera de política** (`retail_returns/[id]`) — Gerente de tienda autoriza devoluciones que no cumplen la política estándar

> **Estado de PR #53**: código completo pero el branch está basado en un main antiguo.
> Necesita rebase para resolver conflictos con las correcciones de portales y sprints S1-S6.

### Phase 20 — Academias y Centros de Formación (completo)
- [x] 9 módulos + portal del estudiante, kanban, AI Agent, search.ts universal

### Phase 22 — ISP / Telecomunicaciones Venezuela (completo)
- [x] **22-A** — `isp_plans`, `isp_network`, `isp_subscribers`, `isp_billing` — core económico
- [x] **22-B** — `isp_support`, `isp_technicians`, `isp_sales` — operaciones diarias
- [x] **22-Portal** — `isp_portal` — portal del abonado con patrón `[orgSlug]/portal/` correcto
- [x] **Estandarización** — search.ts, notifications.ts, events.ts para todos los módulos ISP
- [ ] **22-C** — `isp_monitoring` — webhooks Zabbix/PRTG + Radius/OLT (cuando haya cliente con NMS)

### Estandarización de módulos — Sprints S1–S6 (completo, PRs #63–#67)
- [x] **S1** — events.ts + i18n para módulos de infraestructura
- [x] **S2** — Schema `NotificationTypeDefinition` correcto en 10 módulos
- [x] **S3** — `search.ts` para 12 módulos → 100% coverage
- [x] **S4** — `CrudForm` en 7 páginas + 19 excepciones AGM documentadas
- [x] **S5** — `notifications.ts` en 63 módulos operativos (100%)
- [x] **S6** — `<Button>` reemplaza `<button>` raw; `<table>` excepciones documentadas
- [x] **Portales** — Migración a `[orgSlug]/portal/` en 6 módulos (PRs #61-#62 + docs/PORTAL_GUIDE.md)

---

## Pendiente

### Phase 18 — Infraestructura (pendiente)
- [ ] Activar CI en GitHub: Settings → Actions → Allow all actions (el yml ya está en main)
- [ ] Docker layer caching en Coolify
- [ ] Resend email (`mail.aikalabs.cc`)
- [ ] Wildcard domain `*.aika.com.ve`

### Phase 19 — Workflows (pendiente: rebase de PR #53)
- [ ] Rebase PR #53 sobre main actual y resolver conflictos de portales
- [ ] Merge — activa los 5 workflows de aprobación

### Phase 22-C — ISP Monitoring (pendiente: cliente con NMS)
- [ ] `isp_monitoring` — Webhooks Zabbix/PRTG + comandos Radius/OLT

---

## Deuda técnica residual

| Item | Prioridad | Estado |
|------|-----------|--------|
| Activar GitHub Actions (settings) | Alta | 1 click — yml ya está en main |
| Rebase PR #53 (workflows) | Alta | Conflictos de portales resolubles |
| Migrations formales por módulo | Media | Solo necesario al cambiar entidades |
| Integration tests (RE + Education + Retail) | Media | Pendiente |
| `portalBroadcast` en portales | Baja | Pendiente migración a PortalShell OM completo |
| Wildcard domain `*.aika.com.ve` | Media | Pendiente DNS challenge |
| Docker layer caching en Coolify | Baja | Optimización de build |
| `<form>` con line items → CrudForm repeatable groups | Baja | 11 excepciones documentadas |
