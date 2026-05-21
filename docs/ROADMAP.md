# Roadmap — Aika Platform

> Última actualización: Mayo 2026
> Stack: Open Mercato v0.6.1 · Next.js 16 · Hetzner CX33 Helsinki · Coolify 4.0
> Deploy URL: mercato.novaincs.com · Panel: deploy.novaincs.com

---

## Verticales — Estado

| Vertical | Phase | Módulos | AI Agent | Search | PDF | Estado |
|----------|-------|---------|----------|--------|-----|--------|
| Real Estate / Inmobiliaria | 2–6 | 8 módulos | ✅ | ✅ | — | **COMPLETO** |
| Fiscal Venezuela (transversal) | 7 | 4 módulos | — | — | — | **COMPLETO** |
| Educación / Colegios | 8 | 10 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Distribución / Distribuidoras | 9 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Automotriz / Talleres | 10 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Retail / Comercio | 11 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Condominios | 12 | 7 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Construcción / Constructoras | 13 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| **Academias y Formación** | 20 | 9 módulos | ✅ | ✅ | — | **COMPLETO** |
| **Restaurant / Food** | 21 | — | — | — | — | **PRÓXIMA** |
| Fitness / Gym | — | — | — | — | — | Candidata |
| Beauty / Salones | — | — | — | — | — | Candidata |
| Services / Agencias | — | — | — | — | — | Candidata |
| Transporte / Logística | — | — | — | — | — | Futura |

> **Healthcare / Clínicas — DESCARTADO.**

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
- [x] `search.ts` para `students` y `tuition`
- [x] **AI Agent** — Asistente del Director Escolar (tuition, 5 tools)
- [x] **PDFs** — Boletín escolar + Constancia de inscripción

### Phase 9 — Distribución / Distribuidoras (completo)
- [x] `dist_credit`, `dist_price_lists`, `dist_inventory`, `dist_routes`, `dist_delivery`, `dist_reports`, `dist_commissions`, `dist_portal`
- [x] `search.ts` para `dist_credit` (límites + transacciones)
- [x] **AI Agent** — Asistente del Director de Distribución (dist_reports, 5 tools)
- [x] **PDF** — Nota de entrega / Remisión

### Phase 10 — Automotriz / Talleres Mecánicos (completo)
- [x] `auto_vehicles`, `auto_service_orders`, `auto_inspections`, `auto_parts`, `auto_estimates`, `auto_reports`, `auto_portal`
- [x] `search.ts` para `auto_vehicles` y `auto_service_orders`
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
- [x] `search.ts` para `const_projects`, `const_budget`, `const_rfis`, `const_progress`
- [x] **AI Agent** — Asistente del Director de Obra (6 tools)
- [x] **PDF** — Valuación de obra (tabla de partidas, montos, firmas)

### Phase 14 — Real-time Pipeline + Platform Quality (completo)
- [x] `emit-lifecycle.ts`, `calendar-links.ts` — utilidades base
- [x] `clientBroadcast: true` + `emitLifecycle()` wired en 9 módulos (13 emit() pendientes)
- [x] `indexer: { entityType }` en todas las CRUD routes
- [x] `search.ts` activos en 44 módulos (cobertura universal Cmd+K)
- [x] Módulo `example` desactivado, colores hardcoded → tokens semánticos OM

### Phase 15 — Portal del Propietario Condominios (completo)
- [x] Recibos (lista + detalle + reportar pago)
- [x] Mantenimiento (lista + crear solicitud)
- [x] Circulares, votaciones (lista + emitir voto)
- [x] Documentos/actas, estado de cuenta

### Phase 16 — Páginas de Detalle `[id]` (completo)
- [x] `const_projects/[id]` — tabs Overview, Valuaciones, RFIs
- [x] `condo_properties/[id]` — edificio con unidades y alícuotas
- [x] `condo_fees/receipts/[id]` — recibo con pago inline
- [x] `const_rfis/[id]` — RFI con formulario de respuesta
- [x] `const_daily/[id]` — reporte con labor + actividades
- [x] `auto_service_orders/[id]` — timeline visual + ítems

### Phase 17 — Generación de PDFs (completo)

Usa `@react-pdf/renderer` con sistema de diseño compartido (`src/lib/pdf/`).
Todos los PDFs incluyen branding del tenant (nombre de la organización, initiales coloreadas como logo).

- [x] **Recibo de condominio** — GET `/api/condo-fees/receipts/pdf?id=XXX`
  Watermark PAGADO, watermark en recibos pagados, desglose monto+mora, equivalente VES
- [x] **Valuación de obra** — GET `/api/const-progress/valuations/pdf?id=XXX`
  Tabla financiera completa con retenciones/anticipos, tabla de partidas valuadas, firmas
- [x] **Boletín escolar** — GET `/api/grades/boleta-pdf?student_id=XXX`
  Notas por materia × período, códigos de color por rendimiento, asistencia, firmas
- [x] **Constancia de inscripción** — GET `/api/enrollment/constancia-pdf?student_id=XXX`
  Texto legal formal venezolano, caja resaltada con nombre del alumno, sello circular placeholder
- [x] **Nota de entrega (distribución)** — GET `/api/dist-delivery/nota-entrega-pdf?id=XXX`
  Ítems agrupados por cliente, estado por ítem con colores, firma receptor
- [x] **Acta de asamblea** — GET `/api/condo-comms/acta-pdf?id=XXX`
  Apertura legal formal, agenda numerada, resultados de votación con barras de progreso por alícuota, 3 firmas

### Phase 20 — Academias y Centros de Formación (completo)
- [x] `academy_courses` — Catálogo de cursos (nivel, modalidad, precio, capacidad)
- [x] `academy_instructors` — Perfiles de instructores
- [x] `academy_groups` — Grupos/cohortes con generación automática de sesiones
- [x] `academy_sessions` — Sesiones individuales con asistencia en card grid
- [x] `academy_enrollments` — Inscripciones con anillos SVG de progreso
- [x] `academy_attendance` — Asistencia por toque (tap-to-cycle)
- [x] `academy_payments` — Cobros + WhatsApp cobro
- [x] `academy_certificates` — Certificados con URL de verificación pública `/cert/[number]`
- [x] `academy_portal` — Portal del estudiante (cursos, sesiones, pagos, certificados)
- [x] Kanban board de grupos (tablero 4 columnas + real-time)
- [x] `search.ts` para courses y enrollments
- [x] **AI Agent** — Asistente del Director de Academia (5 tools)

---

## Pendiente

### Phase 18 — Infraestructura y Plataforma

- [ ] **CI pipeline** — `yarn typecheck` antes de merge a main (GitHub Actions, ~20 min de setup)
- [ ] Docker layer caching en Coolify — reducir build time (~5 min → ~1 min)
- [ ] Resend email — `mail.aikalabs.cc` — requiere API key por tenant (no compartir dominio)
- [ ] Wildcard domain `*.aika.com.ve` — subdominio por tenant (requiere DNS challenge para wildcard SSL)
- [x] Calendar links `src/lib/calendar-links.ts` — implementado
- [x] `search.ts` universal — 44 módulos implementados

### Phase 19 — Workflows de Aprobación

Usa el módulo `workflows` de Open Mercato (ya habilitado en `modules.ts`).
Requiere `WorkflowDefinition` + `WorkflowEventTrigger` + UI de aprobación. ~2 semanas.

- [ ] Gasto extraordinario (condominios)
- [ ] Change order (construcción)
- [ ] Límite de crédito (distribución)
- [ ] Inscripción (educación)
- [ ] Devolución fuera de política (retail)

### Phase 21 — Restaurant / Food (próxima vertical)

**Mercado objetivo**: Restaurantes, areperas, fondas, delivery, food courts.

Módulos a construir:
- `restaurant_menu` — carta digital con categorías, fotos, precios USD/VES, modificadores
- `restaurant_tables` — mesas y zonas (salón, terraza, delivery), QR por mesa
- `restaurant_orders` — comanda digital: mesa/delivery/take-away, estados, tiempos
- `restaurant_kitchen` — pantalla cocina (KDS): tickets por estación, tiempos de preparación
- `restaurant_inventory` — insumos con recetas, consumo automático por venta, alertas merma
- `restaurant_reports` — ventas por hora, platos más vendidos, ticket promedio, mermas

---

## Deuda técnica residual

| Item | Prioridad | Estado |
|------|-----------|--------|
| CI pipeline (yarn typecheck antes de merge) | Alta | Pendiente — ~20 min |
| Migrations formales por módulo | Media | Solo necesario al cambiar entidades |
| Integration tests (RE + Education + Distribution) | Media | Pendiente |
| `portalBroadcast` en portales custom | Baja | Requiere migrar a PortalShell de OM primero |
| Wildcard domain `*.aika.com.ve` | Media | Pendiente DNS challenge |
| Docker layer caching en Coolify | Baja | Optimización de build |
