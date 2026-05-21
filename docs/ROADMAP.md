# Roadmap — Aika Platform

> Última actualización: Mayo 2026
> Stack: Open Mercato v0.6.1 · Next.js 16 · Hetzner CX33 Helsinki · Coolify 4.0
> Deploy URL: mercato.novaincs.com · Panel: deploy.novaincs.com

---

## Verticales — Estado

| Vertical | Phase | Módulos | AI Agent | Search | Estado |
|----------|-------|---------|----------|--------|--------|
| Real Estate / Inmobiliaria | 2–6 | 8 módulos | ✅ | ✅ | **COMPLETO** |
| Fiscal Venezuela (transversal) | 7 | 4 módulos | — | — | **COMPLETO** |
| Educación / Colegios | 8 | 10 módulos | ✅ | ✅ | **COMPLETO** |
| Distribución / Distribuidoras | 9 | 8 módulos | ✅ | ✅ | **COMPLETO** |
| Automotriz / Talleres | 10 | 7 módulos | ✅ | ✅ | **COMPLETO** |
| Retail / Comercio | 11 | 7 módulos | ✅ | — | **COMPLETO** |
| Condominios | 12 | 7 módulos | ✅ | ✅ | **COMPLETO** |
| Construcción / Constructoras | 13 | 8 módulos | ✅ | ✅ | **COMPLETO** |
| Restaurant / Food | 20 | — | — | — | **PRÓXIMA** |
| Fitness / Gym | — | — | — | — | Candidata |
| Beauty / Salones | — | — | — | — | Candidata |
| Services / Agencias | — | — | — | — | Candidata |
| Transporte / Logística | — | — | — | — | Futura |

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
- [x] `properties` — CRUD, tipos, operaciones, status, imágenes, links, GPS
- [x] `transactions` — cierres, comisiones, auto-update status
- [x] `matching` — preferencias + scoring engine (type 30%, city 25%, budget 25%, op 20%)
- [x] `property_portal` — página pública /p/[id]
- [x] `property_docs` — ficha PDF (data layer)
- [x] `property_publishing` — texto + links (ML, FB, IG, TikTok, WhatsApp)
- [x] `mercadolibre_sync` — worker sync diario
- [x] `market_intelligence` — tasación, KPIs, P25-P75, comparables
- [x] Dashboard widgets, notificaciones, agent portal, CSV import
- [x] `search.ts` para properties (Meilisearch + vector)
- [x] **AI Agent** — Asistente del Agente Inmobiliario (5 tools)

### Phase 7 — Fiscal Venezuela (transversal)
- [x] `ve_tax_books` — Libros de compra/venta IVA
- [x] `ve_withholdings` — Retenciones IVA (75%) e ISLR
- [x] `ve_tax_reports` — Reportes fiscales con export CSV
- [x] `bank_reconciliation` — Conciliación bancaria multi-banco (CSV)

### Phase 8 — Educación / Colegios (completo)
- [x] `students` — Registro + representantes (15 grados VE)
- [x] `enrollment` — Inscripciones + documentos + workflow
- [x] `tuition` — Mensualidades + pagos + morosos + WhatsApp cobro + detect-overdue worker
- [x] `grades` — Notas + boletines (numérico + cualitativo)
- [x] `attendance` — Asistencia diaria + resumen mensual
- [x] `school_calendar` — Calendario escolar + feriados VE
- [x] `school_comms` — Circulares + avisos + tracking lectura
- [x] `school_docs` — Constancias + plantillas
- [x] `parent_portal` — Portal del representante
- [x] `school_migration` — Importación CSV de datos
- [x] `search.ts` para `students` y `tuition`
- [x] **AI Agent** — Asistente del Director Escolar (tuition, 5 tools)

### Phase 9 — Distribución / Distribuidoras (completo)
- [x] `dist_credit` — Cuentas por cobrar, límites, aging, cobro WhatsApp, worker morosos
- [x] `dist_price_lists` — Listas de precios múltiples + asignación a clientes
- [x] `dist_inventory` — Stock, movimientos, alertas reposición
- [x] `dist_routes` — Rutas por zona/día, paradas, visitas, "Mi Día"
- [x] `dist_delivery` — Órdenes de despacho, entregas, devoluciones
- [x] `dist_reports` — Dashboard KPI (cuentas, inventario, entregas, rutas)
- [x] `dist_commissions` — Comisiones vendedores (venta/cobranza/meta)
- [x] `dist_portal` — Portal self-service del cliente
- [x] `search.ts` para `dist_credit` (límites + transacciones)
- [x] **AI Agent** — Asistente del Director de Distribución (dist_reports, 5 tools)

### Phase 10 — Automotriz / Talleres Mecánicos (completo)
- [x] `auto_vehicles` — Registro de vehículos (placa, marca, modelo, año, km, fotos)
- [x] `auto_service_orders` — Órdenes de servicio workflow 8 pasos + board Kanban + timeline
- [x] `auto_inspections` — Inspección digital DVI (fotos por sistema, hallazgos, urgencia)
- [x] `auto_parts` — Inventario de repuestos (stock, alertas, costo/venta)
- [x] `auto_estimates` — Presupuestos con aprobación interactiva (página pública)
- [x] `auto_reports` — Dashboard KPI del taller
- [x] `auto_portal` — Portal del cliente (status del vehículo en tiempo real)
- [x] `search.ts` para `auto_vehicles` y `auto_service_orders`
- [x] **AI Agent** — Asistente del Gerente de Taller (auto_reports, 5 tools)
- [x] Regionalización VE: 15 marcas, 20 servicios comunes, validación placa venezolana

### Phase 11 — Retail / Comercio (completo)
- [x] `retail_branches` — Multi-sucursal: tiendas, bodegas, personal, transferencias
- [x] `retail_inventory` — Inventario tiempo real: conteo cíclico, rotación, dead stock
- [x] `retail_loyalty` — Fidelización: puntos, niveles VIP, campañas WhatsApp
- [x] `retail_returns` — Devoluciones: políticas por categoría, notas de crédito
- [x] `retail_ecommerce` — E-commerce: storefront público, pedidos, delivery, publicación social
- [x] `retail_purchasing` — Órdenes de compra a proveedores, recepción, notas de débito
- [x] `retail_pricing` — Reglas de precios dinámicos (descuentos, marcas, categorías)
- [x] **AI Agent** — Asistente del Gerente de Retail (retail_branches, 5 tools)

### Phase 12 — Condominios / Property Management (completo)
- [x] `condo_properties` — Edificios, unidades con alícuota (5 decimales, suma=100%), áreas comunes
- [x] `condo_fees` — Cuotas ordinarias/extraordinarias, generación masiva por alícuota, multi-moneda USD/VES
- [x] `condo_collections` — Morosidad, aging, cobro WhatsApp, acuerdos de pago en cuotas
- [x] `condo_maintenance` — Solicitudes workflow (open→assigned→in_progress→completed), órdenes de trabajo, proveedores
- [x] `condo_accounting` — Ingresos/gastos, fondo de reserva (Art. 14 LPH), presupuesto anual
- [x] `condo_comms` — Circulares tracking lectura, votaciones ponderadas por alícuota (Art. 23 LPH), actas
- [x] `condo_portal` — Portal del propietario: estado de cuenta, pagos, solicitudes, circulares, votaciones
- [x] `search.ts` para `condo_properties`, `condo_fees`, `condo_maintenance`, `condo_collections`
- [x] **AI Agent** — Asistente del Administrador de Condominio (condo_properties, 6 tools)

### Phase 13 — Construcción / Constructoras (completo)
- [x] `const_projects` — Proyectos con contratos, avance global, dashboard KPIs
- [x] `const_budget` — APU, árbol de partidas (capítulos → subcapítulos → partidas), recursos
- [x] `const_schedule` — Cronograma Gantt, dependencias, hitos, ruta crítica, % avance
- [x] `const_progress` — Valuaciones de obra, retenciones, anticipo, flujo de aprobación
- [x] `const_rfis` — RFIs y submittals con prioridad, vencimiento, respuesta inline
- [x] `const_daily` — Reporte Diario de Obra: personal, clima, actividades, incidentes
- [x] `const_subcon` — Subcontratistas, contratos con retenciones, pagos aprobados
- [x] `const_materials` — Órdenes de compra, recepción, inventario en obra
- [x] `search.ts` para `const_projects`, `const_budget`, `const_rfis`, `const_progress`
- [x] **AI Agent** — Asistente del Director de Obra (const_projects, 6 tools)

### Phase 14 — Real-time Pipeline + Platform Quality (completo)

#### Real-time (clientBroadcast) — 100% cableado
- [x] `src/lib/emit-lifecycle.ts` — utility base para todos los módulos
- [x] `src/lib/calendar-links.ts` — add-to-calendar sin API (Google, Outlook, ICS)
- [x] `clientBroadcast: true` declarado en 9 módulos (events.ts)
- [x] `emitLifecycle()` wired en todas las rutas/workers pendientes:
  - `condo_comms`: circular.published, vote.opened
  - `condo_collections`: debtor.detected (worker)
  - `condo_maintenance`: request.assigned, request.completed
  - `const_progress`: valuation.paid, valuation.rejected
  - `const_rfis`: submittal.approved, submittal.rejected
  - `tuition`: charge.paid, charge.overdue (worker), charges.generated
  - `dist_credit`: account.overdue (worker), account.blocked
- [x] `api/interceptors.ts` activos en: auto_service_orders, tuition, dist_credit, condo_comms, condo_maintenance, const_progress, const_rfis

#### Search — indexer universal
- [x] `indexer: { entityType }` en los 95 CRUD routes (todas las entidades)
- [x] `search.ts` activos: properties, students, tuition, auto_vehicles, condo_properties, condo_fees, condo_maintenance, condo_collections, const_projects, const_budget, const_rfis, const_progress, dist_credit, auto_service_orders (14 módulos)

#### Quality
- [x] Módulo `example` desactivado en producción
- [x] Colores hardcoded → tokens semánticos OM (`text-status-warning-*`)
- [x] Raw `fetch` → `apiCall` en pages
- [x] Raw `<button>` → componente `Button` en módulos custom

---

## Pendiente

### Phase 15 — Portal del Propietario (páginas faltantes)

El portal tiene la estructura, faltan 8 páginas:

- [ ] `/portal/receipts` — listado de recibos con estado y monto
- [ ] `/portal/receipts/[id]` — detalle del recibo con opción de reporte de pago
- [ ] `/portal/maintenance` — mis solicitudes de mantenimiento
- [ ] `/portal/maintenance/create` — crear nueva solicitud
- [ ] `/portal/circulars` — circulares del edificio
- [ ] `/portal/votes` — votaciones abiertas
- [ ] `/portal/votes/[id]` — emitir voto
- [ ] `/portal/documents` — actas y documentos
- [ ] `/portal/account` — estado de cuenta completo

### Phase 16 — Páginas de Detalle `[id]`

Las listas existen, faltan las páginas de detalle:

- [ ] `const_projects/[id]` — detalle del proyecto con tabs (Overview, Presupuesto, Cronograma, Valuaciones, RFIs)
- [ ] `condo_properties/[id]` — detalle de unidad (propietario, recibos, historial)
- [ ] `condo_fees/receipts/[id]` — recibo individual con desglose y opción de pago
- [ ] `const_rfis/[id]` — detalle del RFI con hilo de respuestas
- [ ] `const_daily/[id]` — detalle del reporte diario de obra
- [ ] `auto_service_orders/[id]` — detalle de la orden con timeline y ítems

### Phase 17 — Generación de PDFs

Patrón existente: `property_docs` (data layer ya construido).

- [ ] Recibo de condominio (unit, período, monto, estado de cuenta)
- [ ] Valuación de obra (tabla de partidas, montos, firma del director)
- [ ] Boletín escolar (notas por materia, asistencia, período)
- [ ] Constancia de inscripción (escolar — datos del alumno + año escolar)
- [ ] Factura de distribución (cliente, ítems, impuestos IVA + IGTF)
- [ ] Acta de asamblea (condominios — votaciones ponderadas, presentes)

### Phase 18 — Infraestructura y Plataforma

- [ ] CI pipeline — `yarn typecheck` antes de merge a main (GitHub Actions)
- [ ] Docker layer caching en Coolify — reducir tiempo de build (actualmente ~8 min)
- [ ] Resend email — `mail.aikalabs.cc` (DNS configurado, falta API key)
- [ ] Wildcard domain `*.aika.com.ve` — subdominio por tenant
- [x] Calendar links `src/lib/calendar-links.ts` — implementado (patrón wa.me)
- [x] `search.ts` para dist_credit, auto_service_orders, condo_fees — implementado

### Phase 19 — Workflows de Aprobación

Usa el módulo `workflows` de Open Mercato (ya habilitado en modules.ts).

- [ ] Gasto extraordinario (condominios) — propuesta → votación → aprobación
- [ ] Change order (construcción) — solicitud → director → cliente
- [ ] Límite de crédito (distribución) — solicitud → gerente → aprobación
- [ ] Inscripción (educación) — solicitud → revisión documentos → confirmación
- [ ] Devolución fuera de política (retail) — solicitud → gerente → resolución

### Phase 20 — Restaurant / Food (próxima vertical)

**Mercado objetivo**: Restaurantes, areperas, fondas, delivery, food courts.

Módulos a construir:
- `restaurant_menu` — carta digital con categorías, fotos, precios USD/VES, modificadores
- `restaurant_tables` — mesas y zonas (salón, terraza, delivery), QR por mesa
- `restaurant_orders` — comanda digital: mesa/delivery/take-away, estados, tiempos
- `restaurant_kitchen` — pantalla cocina (KDS): tickets por estación, tiempos de preparación
- `restaurant_inventory` — insumos con recetas, consumo automático por venta, alertas merma
- `restaurant_reports` — ventas por hora, platos más vendidos, ticket promedio, mermas

---

## Deuda técnica pendiente

| Item | Prioridad | Estado |
|------|-----------|--------|
| CI pipeline (yarn typecheck antes de merge) | Alta | Pendiente |
| Migrations formales por módulo (`.snapshot-open-mercato.json`) | Media | Solo necesario al cambiar entidades |
| `search.ts` para 38 módulos restantes | Media | Fase por fase con revisión PII |
| `portalBroadcast` en portales custom | Baja | Requiere migrar a PortalShell de OM primero |
| Pages de detalle `[id]` (Phase 16) | Alta | Bloquea uso real del sistema |
| Integration tests (RE + Education + Distribution) | Media | Pendiente |
| Wildcard domain `*.aika.com.ve` | Media | Pendiente DNS |
| PDF generation (Phase 17) | Media | Pendiente |
