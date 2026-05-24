# Roadmap — Aika Platform

> Última actualización: 24 Mayo 2026 — CI verde ✅
> Stack: Open Mercato v0.6.1 · Next.js 16 · Hetzner CX43 Helsinki · Coolify 4.0
> Deploy URL: mercato.novaincs.com · Panel: deploy.novaincs.com
> CI: github.com/aikapenelope/crm-world/actions — Lint ✅ Typecheck ✅ Unit Tests ✅

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
| **Agroalimentario con Procesamiento** | 23 | 12 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| **Manufactura Industrial** | 24 | 16 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
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

### Phase 18 — CI Pipeline (completo en código)
- [x] `.github/workflows/ci.yml` — typecheck + lint en cada PR
- [x] Concurrency cancel, cache de `.yarn/cache` + `node_modules`
- [ ] **Activar en GitHub**: Settings → Actions → General → "Allow all actions" ← **1 click pendiente**
- [ ] Docker layer caching en Coolify
- [ ] Resend email (`mail.aikalabs.cc`)
- [ ] Wildcard domain `*.aika.com.ve`

### Phase 19 — Workflows de Aprobación (completo)
- [x] Infraestructura: `WorkflowApprovalWidget`, `seed-workflow.ts`, `useWorkflowApproval.ts`
- [x] **Gasto extraordinario** (`condo_accounting`) — Junta aprueba gastos fuera del presupuesto
- [x] **Change order** (`const_rfis`) — Gerente de obra aprueba RFIs con impacto en costo
- [x] **Límite de crédito** (`dist_credit`) — Gerencia autoriza cambios de límite
- [x] **Inscripción escolar** (`enrollment`) — Comité de admisiones decide solicitudes
- [x] **Devolución fuera de política** (`retail_returns`) — Gerente autoriza devoluciones

### Phase 20 — Academias y Centros de Formación (completo)
- [x] 9 módulos + portal del estudiante, kanban, AI Agent, search.ts universal

### Phase 22 — ISP / Telecomunicaciones Venezuela (completo)
- [x] **22-A** — `isp_plans`, `isp_network`, `isp_subscribers`, `isp_billing` — core económico
- [x] **22-B** — `isp_support`, `isp_technicians`, `isp_sales` — operaciones diarias
- [x] **22-Portal** — `isp_portal` — portal del abonado
- [x] **Estandarización** — search.ts, notifications.ts, events.ts para todos los módulos ISP
- [ ] **22-C** — `isp_monitoring` — webhooks Zabbix/PRTG + Radius/OLT (pendiente: cliente con NMS)

### Estandarización de módulos — Sprints S1–S6 (completo)
- [x] **S1** — events.ts + i18n para módulos de infraestructura
- [x] **S2** — Schema `NotificationTypeDefinition` correcto en 10 módulos
- [x] **S3** — `search.ts` para 12 módulos → 100% coverage
- [x] **S4** — `CrudForm` en 7 páginas + 19 excepciones AGM documentadas
- [x] **S5** — `notifications.ts` en 63 módulos operativos (100%)
- [x] **S6** — `<Button>` reemplaza `<button>` raw; `<table>` excepciones documentadas
- [x] **Portales** — Migración a `[orgSlug]/portal/` en 6 módulos

### Phase 23 — Agroalimentario con Procesamiento (completo)

Vertical para empresas con integración vertical completa: campo → planta → distribución.
Spec completo en `.ai/specs/2026-05-26-agri-agroalimentario-vertical.md`.

**12 módulos en 3 capas:**

#### Sprint A — Producción primaria
- [x] `agri_units` — Fincas, galpones, flocks (lotes de aves). KPIs: FCA, IEP, viabilidad, proyección día 42. AI Agent con 6 tools.
- [x] `agri_feed` — Fórmulas de alimento con ingredientes USD/VES. Worker de recálculo automático al cambiar tasa BCV. Editor de ingredientes con cálculo de costo en tiempo real.
- [x] `agri_vet` — Vacunación (con calendario automático), medicación, mortalidad diaria. Bloqueo de despacho por período de retiro activo.
- [x] `agri_inputs` — Inventario de insumos (medicamentos, vacunas, agroquímicos). Descuento automático al aplicar tratamientos.

#### Sprint B — Capa industrial
- [x] `agri_processing` — Planta de beneficio. Verificación de retiro activo antes de permitir beneficio. Workflow `despacho_sanitario_v1`.
- [x] `agri_cold_chain` — Cadena de frío. Endpoint IoT batch, worker de excursiones, historial con sparkline. Alert threshold para micro-cortes venezolanos.
- [x] `agri_quality` — HACCP con editor de PCCs, monitoreo de PCCs con auto-NC, checklists BPM. Workflow `no_conformidad_ccp_v1`.
- [x] `agri_traceability` — Trazabilidad completa (producto → flock → alimentos → medicamentos) via Kysely. Recall con workflow `recall_v1`.

#### Sprint C — Capa comercial
- [x] `agri_sales` — Ventas a cadenas/distribuidores. Multi-moneda: USD + IVA 16% VES + IGTF 3%.
- [x] `agri_field` — Operaciones de campo (maíz, soya, sorgo). Costo real de materia prima propia.
- [x] `agri_hr` — Nómina jornaleros (provisiones LOTTT automáticas) + liquidación productor integrado. Workflow `liquidacion_productor_v1`.
- [x] `agri_portal` — Portal del productor integrado: ciclo activo (FCA/IEP en tiempo real), liquidaciones, datos.

**UI completa + 5 flujos inteligentes:**
- [x] Dashboard "Programa de Cosecha" — todos los flocks activos con semáforos de retiro/cosecha
- [x] Editor inline de PCCs (HACCP) y calendario de vacunación (VetPrograms)
- [x] Editor de ingredientes de fórmula con cálculo BCV en tiempo real
- [x] Nóminas jornaleros con preview de LOTTT antes de guardar
- [x] Historial de temperatura con sparkline SVG
- [x] Auto-aplicar programa de vacunación al iniciar flock
- [x] Auto-calcular liquidación del productor al completar flock
- [x] Excursión de temperatura → No-Conformidad automática
- [x] Vacunación/medicación → descuento automático en inventario
- [x] Costo de producción por lote en tiempo real (endpoint + tab UI)

**Workflows activados (seedModuleWorkflow en setup.ts + páginas [id]):**
- [x] `despacho_sanitario_v1` — `agri_processing/[id]`
- [x] `no_conformidad_ccp_v1` — `agri_quality/non-conformities/[id]`
- [x] `recall_v1` — `agri_traceability/recalls/[id]`
- [x] `liquidacion_productor_v1` — `agri_hr/settlements/[id]`

**PDFs (4 documentos):**
- [x] Liquidación del productor integrado (ciclo + KPIs + desglose de pago)
- [x] Guía de despacho sanitaria (lote de beneficio + resultados QC + vehículo)
- [x] Certificado de trazabilidad del lote (flock → alimentos → medicamentos → PT)
- [x] Informe semanal del lote (FCA, IEP, mortalidad, peso, proyecciones)

---

### Phase 18 — CI Pipeline (COMPLETO Y VERDE ✅ — PR #83)
- [x] `.github/workflows/ci.yml` — 3 jobs paralelos: Lint + Typecheck + Unit Tests
- [x] Lint verde: `typescript-eslint` en `src/modules` (patrón OM standalone)
- [x] Typecheck verde: `tsc --noEmit` en TODO el código (incluye `.tsx` backend pages)
- [x] Unit Tests verde: Jest con `jest-mikroorm-transformer.cjs` del repo oficial
- [x] Fix 900+ errores TS preexistentes: módulos escritos con APIs antiguas de OM v0.5.x
- [x] Documentación CI completa en `docs/CI.md`
- [x] `docs/OPEN_MERCATO_REFERENCE.md` actualizado con todos los breaking changes

### Phase 24 — Manufactura Industrial (completo)

Vertical para fábricas de producción discreta y por procesos en Venezuela.
Spec completo en `.ai/specs/2026-05-26-manufactura-industrial.md`.

**16 módulos en 4 sprints:**

#### Sprint A — Núcleo productivo
- [x] `mfg_bom` — BOM multinivel (process/discrete), versiones, materiales alternativos para escasez. Workflow `bom_approval_v1`.
- [x] `mfg_inventory` — Almacén 4-tier (MP/empaque/WIP/PT), lotes FEFO, cuarentena QC, conteo cíclico.
- [x] `mfg_orders` — Órdenes con routing, reserva de materiales, OEE separado (CORPOELEC vs. interno). AI Agent + workflow `downtime_escalation_v1`.
- [x] `mfg_quality` — Planes de muestreo, SPC con cartas X-R, NCs automáticas en PCCs. Workflow `nc_disposition_v1`.

#### Sprint B — Inteligencia productiva
- [x] `mfg_mrp` — Motor MRP completo: BOM explosion, necesidades netas, lead times 60d importación venezolana, requisiciones automáticas.
- [x] `mfg_floor` — MES simplificado: OEE total vs. interno, worker cierre de turno, reportes automáticos.
- [x] `mfg_planning` — MPS semanal + heatmap eléctrico CORPOELEC, carga de capacidad por línea.
- [x] `mfg_costs` — Costeo bimoneda + variaciones de precio/cantidad/MO al cierre de cada orden.

#### Sprint C — Operaciones completas
- [x] `mfg_maintenance` — GMAO: preventivo/correctivo, repuestos críticos con stock de seguridad = ceil(lead_time/MTBF).
- [x] `mfg_procurement` — OCs con tracking completo de importación + cálculo CIF real en almacén. Workflow `purchase_authorization_v1`.
- [x] `mfg_subcontract` — Maquila con almacén virtual en instalaciones del maquilador, merma real vs. contractual.
- [x] `mfg_energy` — Consumo kWh, cortes CORPOELEC, sobrecosto generador (`generator_premium_usd`).

#### Sprint D — Capa comercial e inteligencia
- [x] `mfg_dispatch` — Pedidos industriales (IVA 16% + IGTF 3% bimoneda), guías de despacho, CoA obligatorio.
- [x] `mfg_hr` — Operarios con LOTTT (+30% noche, +25% extra día), bonos de producción por cuota.
- [x] `mfg_reports` — KPI dashboard ejecutivo + AI Agent "Gerente de Fábrica" (6 tools cross-module).
- [x] `mfg_portal` — Portal cliente industrial: estado de pedidos + certificados de análisis.

**PDFs (4 documentos):**
- [x] Guía de Despacho PT (cliente, lotes, cantidades, vehículo, firma de recepción)
- [x] Certificate of Analysis (CoA) — resultados de QC del lote para clientes industriales
- [x] Reporte de Turno — OEE total/interno, producción real vs. plan, paros por categoría
- [x] Orden de Trabajo de Mantenimiento — instructivo para técnicos con repuestos requeridos

---

## Pendiente

### Phase 22-C — ISP Monitoring (bloqueado: cliente con NMS)
- [ ] `isp_monitoring` — webhooks Zabbix/PRTG + comandos Radius/OLT

---

## Próximas Fases — Roadmap

> Orden sugerido basado en impacto y dependencias técnicas.

### Phase 25 — Tests unitarios para módulos custom (PRIORIDAD ALTA)

**Por qué ahora**: El CI tiene los 3 jobs verdes pero la cobertura de tests es baja.
Solo tienen tests los módulos: `properties`, `ve_fiscal`, `matching`, `mfg_bom`,
`mfg_orders`, `mfg_mrp`. El resto (95+ módulos) no tienen ningún test.

**Objetivo**: Al menos 1 test de validators por vertical.

**Cómo hacerlo** (patrón OM establecido):
```
src/modules/<module>/__tests__/validators.spec.ts
```

Cada test debe cubrir:
- `createSchema.safeParse(validPayload)` → success
- Campos requeridos faltantes → failure
- Valores de enum inválidos → failure
- Reglas de negocio venezolanas (RIF, tasas, etc.)

**Prioridad de módulos** (por impacto de negocio):
1. `ve_fiscal` ← ya tiene tests, ampliar
2. `agri_units`, `agri_feed`, `agri_quality` (validaciones de KPIs)
3. `isp_billing`, `isp_subscribers` (lógica de facturación)
4. `const_progress`, `const_budget` (cálculos financieros)
5. Resto de verticales

---

### Phase 26 — Upgrade Open Mercato v0.6.2

**Por qué**: La versión actual del repo oficial es `0.6.2`. El proyecto usa `0.6.1`.
La diferencia incluye parches de TypeScript 6 y correcciones de eslint-config-next.

**Qué cambiaría**:
- `"typescript": "^5.9.3"` → `"typescript": "^6.0.3"`
- `"eslint-config-next": "16.2.6"` (ya está en 16.2.6)
- `@open-mercato/*`: `"0.6.1"` → `"0.6.2"`
- `"jest": "^30.3.0"` → `"^30.4.2"` (ya disponible)

**Riesgo**: TypeScript 6 es un major bump. Revisar breaking changes antes.
**Cómo**: Leer `UPGRADE_NOTES.md` del repo oficial antes de proceder.

---

### Phase 27 — Nuevas Verticales

**Candidatas prioritarias:**

#### Fitness / Gym
- `gym_members`, `gym_plans`, `gym_attendance`, `gym_payments`, `gym_classes`, `gym_portal`
- Venezuela: planes en USD, múltiples métodos de pago, control de acceso

#### Beauty / Salones / Spas
- `beauty_services`, `beauty_appointments`, `beauty_inventory`, `beauty_staff`, `beauty_portal`
- Venezuela: citas online, comisiones, productos de belleza

#### Agencias de Servicios Profesionales
- `agency_projects`, `agency_billing`, `agency_time_tracking`, `agency_contracts`
- Venezuela: facturación en USD/VES, retenciones ISLR

**Proceso para cada vertical nueva** (aprendido en CI verde):
1. Leer repo OM antes de escribir código → `open-mercato/open-mercato apps/mercato/src/modules/example/`
2. Escribir validators con tests PRIMERO
3. Verificar `yarn generate && yarn typecheck` después de cada módulo
4. Usar API correcta v0.6.1: `id:` en campos, `title:` en grupos, etc.
5. `acl.ts` siempre con `export default features`

---

### Phase 28 — Integration Tests

**Objetivo**: Tests end-to-end para los flujos críticos.

**Patrón OM**: `apps/mercato/src/modules/example/__integration__/`

Los tests de integración en el repo oficial usan:
- Playwright (`@playwright/test`)
- `mercato test:integration:ephemeral` — boot efímero del app
- PostgreSQL en memoria (Docker)

**Candidatos prioritarios**:
1. Creación de tenant → módulos base venezolanos auto-configurados
2. Flujo completo inmobiliaria: propiedad → lead → transacción
3. Flujo ISP: abonado → factura → pago → estado cuenta
4. Flujo manufactura: BOM → orden → despacho → CoA

---

### Phase 29 — Actualización CI con coverage threshold

Una vez que haya tests en todos los módulos, activar el threshold de coverage:

```js
// jest.config.cjs — activar cuando coverage sea suficiente
coverageThreshold: {
  global: {
    branches: 70,   // Empezar conservador
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

**Condición**: Al menos 1 test por módulo con validators (Phase 25 completada).

---

## Deuda técnica general

| Item | Prioridad | Estado |
|------|-----------|--------|
| Tests unitarios validators (95+ módulos sin tests) | **ALTA** | Phase 25 |
| Upgrade OM v0.6.2 + TypeScript 6 | **MEDIA** | Phase 26 |
| Migrations formales por módulo | Media | Solo necesario al cambiar entidades en producción |
| Integration tests (RE + Education + Retail) | Media | Phase 28 |
| `portalBroadcast` en portales | Baja | Pendiente migración a PortalShell OM completo |
| Wildcard domain `*.aika.com.ve` | Media | Pendiente DNS challenge |
| Coverage threshold activado en CI | Baja | Phase 29 (requiere Phase 25) |
| Docker layer caching en Coolify | Baja | Optimización de build |
