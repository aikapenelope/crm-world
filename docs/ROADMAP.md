# Roadmap — Aika Platform

## Completed

### Phase 0 — Infrastructure
- [x] Hetzner CX33 (Helsinki) via Pulumi
- [x] Coolify 4.0 installed (deploy.novaincs.com)
- [x] HTTPS (Let's Encrypt)
- [x] Security (fail2ban, UFW, swap, backups)
- [x] Auto-deploy on push to main

### Phase 1 — Base Venezuela (all tenants)
- [x] `venezuela_rates` — DolarApi (BCV + paralelo)
- [x] `payment_methods` — 7 métodos locales
- [x] `ve_fiscal` — RIF/CI, IVA 16%, IGTF 3%
- [x] `ve_tenant_defaults` — auto-config on tenant creation

### Phase 2 — Real Estate Core
- [x] `properties` — CRUD, tipos, operaciones, status, imágenes, links, GPS
- [x] `transactions` — cierres, comisiones, auto-update status
- [x] `matching` — preferencias + scoring structure

### Phase 3 — Real Estate Value
- [x] `property_portal` — página pública /p/[id]
- [x] `property_docs` — ficha PDF (data layer)
- [x] `property_publishing` — texto + links (ML, FB, IG, TikTok, WhatsApp)

### Phase 4 — Real Estate Intelligence
- [x] `mercadolibre_sync` — worker sync diario
- [x] `market_intelligence` — tasación, KPIs, P25-P75, comparables

### Phase 5 — UI Funcional
- [x] Properties: DataTable + CrudForm (list/create/edit)
- [x] Transactions: DataTable (list)
- [x] Matching: DataTable (results)
- [x] Fix cross-module imports (Turbopack restriction)
- [x] Cleanup Coolify (removed duplicate app)

### Phase 6 — Complete Real Estate for First Client
- [x] Transactions create form (CrudForm — register closing with lease fields)
- [x] `search.ts` for properties module (Meilisearch indexing + presenter)
- [x] Document type dictionary seed (contrato, escritura, avalúo, plano, factura)
- [x] Property detail tabs (General, Imágenes, Links, Matching)
- [x] RE dashboard widgets (properties by status, pipeline summary, recent closings)
- [x] RE notification types (lead inactivo, propiedad sin actividad, reservada, cierre)
- [x] Matching scoring engine (weighted: type 30%, city 25%, budget 25%, operation 20%)
- [x] Agent portal page (/agente/[id] — public properties grid)
- [x] CSV import adapter for contacts (flexible column mapping ES/EN)
- [x] Agent portal API (properties by assigned agent)
- [x] `properties/setup.ts` — seedDefaults: RE pipeline (7 stages) + tags (9 categories)

### Phase 7 — Fiscal Modules (transversal)
- [x] `ve_tax_books` — Libros de compra/venta IVA (registro manual para declaración)
- [x] `ve_withholdings` — Retenciones IVA (75%) e ISLR (cálculo + comprobantes)
- [x] `ve_tax_reports` — Reportes fiscales con export CSV para el contador
- [x] `bank_reconciliation` — Conciliación bancaria (upload CSV multi-banco)

### Phase 8 — Education Vertical (complete)
- [x] `students` — Registro + representantes (15 grados VE)
- [x] `enrollment` — Inscripciones + documentos + workflow
- [x] `tuition` — Mensualidades + pagos + morosos + WhatsApp cobro
- [x] `grades` — Notas + boletines (numérico + cualitativo)
- [x] `attendance` — Asistencia diaria + resumen mensual
- [x] `school_calendar` — Calendario escolar + feriados VE
- [x] `school_comms` — Circulares + avisos + tracking lectura
- [x] `school_docs` — Constancias + plantillas
- [x] `parent_portal` — Portal del representante
- [x] `school_migration` — Importación CSV de datos

### Phase 9 — Distribution Vertical (complete)
- [x] `dist_credit` — Cuentas por cobrar, límites, aging, cobro WhatsApp, worker morosos
- [x] `dist_price_lists` — Listas de precios múltiples + asignación a clientes
- [x] `dist_inventory` — Stock, movimientos, alertas reposición
- [x] `dist_routes` — Rutas por zona/día, paradas, visitas, "Mi Día"
- [x] `dist_delivery` — Órdenes de despacho, entregas, devoluciones
- [x] `dist_reports` — Dashboard KPI (cuentas, inventario, entregas, rutas)
- [x] `dist_commissions` — Comisiones vendedores (venta/cobranza/meta)
- [x] `dist_portal` — Portal self-service del cliente

---

## Next — Phase 10: Production Polish

### Infrastructure
- [ ] Fix yarn.lock (regenerar lockfile completo — PR #31)
- [ ] Wildcard domain for tenant subdomains
- [ ] Docker layer caching in Coolify (reduce build time)
- [ ] Upgrade to CX43 when Hetzner has stock

### Real Estate Polish
- [ ] PDF renderer for property sheet (cover image, specs, branding, QR)
- [ ] Monthly report PDF (transactions, pipeline, inventory)
- [ ] Email sending integration (Resend — needs API key + DNS)
- [ ] Branding settings (logo upload per tenant)

### Platform Features
- [ ] Resend email integration (mail.aikalabs.cc)
- [ ] WhatsApp Business API integration
- [ ] MercadoLibre OAuth (publish from platform)
- [ ] Self-service tenant onboarding (optional)

---

## Phase 11 — Retail/Comercio Vertical (complete)

- [x] `retail_branches` — Multi-sucursal: tiendas, bodegas, personal, transferencias
- [x] `retail_inventory` — Inventario tiempo real: conteo cíclico, rotación, dead stock
- [x] `retail_loyalty` — Fidelización: puntos, niveles VIP, campañas WhatsApp
- [x] `retail_returns` — Devoluciones: políticas por categoría, notas de crédito
- [x] `retail_ecommerce` — E-commerce: storefront público, pedidos, delivery, publicación social

## Phase 12 — Property Management / Condominios Vertical (complete)

- [x] `condo_properties` — Edificios, unidades con alícuota (5 decimales, suma=100%), áreas comunes reservables
- [x] `condo_fees` — Cuotas ordinarias/extraordinarias, generación masiva de recibos por alícuota, multi-moneda USD/VES con tasa BCV
- [x] `condo_collections` — Morosidad, aging, cobro masivo por WhatsApp (wa.me links), acuerdos de pago en cuotas
- [x] `condo_maintenance` — Solicitudes con workflow (open→assigned→in_progress→completed), órdenes de trabajo, proveedores con rating
- [x] `condo_accounting` — Ingresos/gastos por categoría, fondo de reserva automático (Art. 14 LPH), presupuesto anual
- [x] `condo_comms` — Circulares con tracking lectura, votaciones ponderadas por alícuota (Art. 23 LPH), actas de asamblea
- [x] `condo_portal` — Portal del propietario: estado de cuenta, reportar pagos, solicitudes, circulares, votaciones, documentos

## Phase 13 — Construction / Constructora Vertical (complete)

- [x] `const_projects` — Proyectos con contratos, avance global, dashboard KPIs, AI director assistant
- [x] `const_budget` — APU (Análisis de Precios Unitarios), árbol de partidas (capítulos → subcapítulos → partidas), recursos (material, MO, equipo)
- [x] `const_schedule` — Cronograma Gantt, tareas con dependencias, hitos, ruta crítica, % avance
- [x] `const_progress` — Valuaciones de obra (cobros parciales por avance), retenciones, anticipo, flujo de aprobación
- [x] `const_rfis` — RFIs y submittals con prioridad, vencimiento, respuesta inline, worker de escalación
- [x] `const_daily` — Reporte Diario de Obra (RDO): personal, clima, actividades, incidentes de seguridad
- [x] `const_subcon` — Subcontratistas, contratos con retenciones, pagos aprobados
- [x] `const_materials` — Órdenes de compra, recepción, inventario en obra, desvíos vs presupuesto
- [x] **AI Agent** — Asistente del Director de Obra (6 tools: overview, budget vs actual, overdue RFIs, pending valuations, material alerts, schedule status)
- [x] **Workers** — detect-overdue-rfis (escala a urgente), notifications (incidentes, aprobaciones)

---

## Future Verticals (por definir)

| # | Vertical | Mercado VE | Módulos core que usa | Custom necesario | Estado |
|---|---|---|---|---|---|
| 1 | ~~Retail / Comercio~~ | Tiendas, ferreterías, farmacias | catalog, sales, checkout | 7 módulos | COMPLETADO (Phase 11) |
| 2 | ~~Automotive / Talleres~~ | Talleres mecánicos | customers, catalog, sales | 7 módulos | COMPLETADO (Phase 10) |
| 3 | ~~Condominios~~ | Administradoras de edificios | customers, planner, portal | 7 módulos + AI | COMPLETADO (Phase 12) |
| 4 | ~~Construcción~~ | Constructoras y obras civiles | customers, sales, planner | 8 módulos + AI | COMPLETADO (Phase 13) |
| 5 | **Healthcare / Clínicas** | Consultorios, laboratorios, odontología | customers, planner, attachments | patients, appointments, records | Siguiente |
| 6 | **Restaurant / Food** | Restaurantes, areperas, delivery | catalog, sales, checkout | menu, kitchen_orders, tables | Candidato |
| 7 | **Fitness / Gym** | Gimnasios, crossfit, yoga | customers, planner, portal | memberships, classes, metrics | Candidato |
| 8 | **Beauty / Salones** | Peluquerías, spas, barberías | customers, planner, sales | bookings, staff_schedule | Candidato |
| 9 | **Services / Agencias** | Marketing, diseño, legal | customers, planner, sales | projects, timesheets, proposals | Candidato |
| 10 | **Transporte / Logística** | Encomiendas, mudanzas, courier | customers, sales | shipments, tracking, fleet | Futuro |

---

## Technical Debt
- [ ] Remove `example` module from production
- [ ] Add integration tests for RE + Education + Distribution modules
- [ ] CI pipeline (typecheck before merge to main)
- [ ] Regenerate yarn.lock on every dependency change
