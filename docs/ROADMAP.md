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

## Next — Phase 14: Real-time Pipeline Completion

Cierra los emit() que quedaron pendientes en REALTIME.md. Son interceptores simples.

- [ ] `condo_comms` — Interceptor PUT votes → `vote.opened`; endpoint `circulars/send` → `circular.published`
- [ ] `condo_maintenance` — Interceptor PUT requests → `request.assigned`, `request.completed`, `work_order.completed`
- [ ] `condo_collections` — Worker WhatsApp → `debtor.detected`; interceptor PUT agreements → `agreement.defaulted`
- [ ] `const_progress` — Interceptor PUT valuations → `valuation.paid`, `valuation.rejected`
- [ ] `const_rfis` — Interceptor PUT submittals → `submittal.approved`, `submittal.rejected`
- [ ] `tuition` — Interceptor PUT charges → `charge.paid`; ruta generate → `charges.generated`; worker mora → `charge.overdue`
- [ ] `dist_credit` — Worker cobranza → `account.overdue`; interceptor PUT limits → `account.blocked`

---

## Phase 15 — Portal del Propietario (Condominios) — páginas completas

El portal corre en el mismo deploy que el backend. URL: `mercato.novaincs.com/condominio/[slug]/...`
Usa el módulo `customer_accounts` de OM para auth (magic links, sesiones separadas del admin).

- [ ] `receipts/page.tsx` — Historial de recibos + estado de deuda por período + botón reportar pago con comprobante
- [ ] `maintenance/page.tsx` — Lista de solicitudes del propietario (estado en tiempo real via clientBroadcast)
- [ ] `maintenance/create/page.tsx` — Formulario crear solicitud (categoría, descripción, foto adjunta)
- [ ] `circulars/page.tsx` — Circulares del edificio con tracking de lectura (marcar leído al abrir)
- [ ] `votes/page.tsx` — Votaciones activas con tally en vivo (clientBroadcast vote.cast)
- [ ] `votes/[id]/page.tsx` — Votar con confirmación de alícuota y peso del voto
- [ ] `documents/page.tsx` — Actas de asamblea, presupuestos y reglamento del edificio (attachments)
- [ ] `account/page.tsx` — Datos de la unidad, propietario, historial de contacto

---

## Phase 16 — Páginas de Detalle [id]

Todas las verticales tienen listas funcionales. Faltan los detalles individuales.

- [ ] `const_projects/[id]/` — Dashboard del proyecto con tabs: presupuesto, cronograma, valuaciones, RFIs, subcontratistas
- [ ] `condo_properties/[id]/` — Detalle edificio: tabs (unidades, áreas comunes, info, finanzas)
- [ ] `condo_fees/receipts/[id]/` — Detalle recibo: historial de pagos parciales, timeline, registrar pago completo
- [ ] `const_rfis/[id]/` — Detalle RFI: historial de comentarios, respuesta, impacto en costo/cronograma
- [ ] `const_daily/[id]/` — Detalle reporte diario: personal, actividades, fotos, incidentes
- [ ] `auto_service_orders/[id]/` — Orden de servicio: timeline de estados, ítems, repuestos usados

---

## Phase 17 — PDF Generation

Patrón existente en `property_docs`. Extender a las demás verticales.

- [ ] **Recibo de condominio** — PDF con: logo tenant, desglose de gastos comunes, monto USD + VES (tasa BCV), fondo de reserva, código QR con datos de pago (banco, teléfono, monto)
- [ ] **Valuación de obra** — PDF estilo AIA: partidas, cantidades, precios unitarios, retención deducida, monto neto a pagar. Firmable digitalmente desde el portal del dueño de obra
- [ ] **Boletín escolar** — PDF: notas por materia, promedio, asistencia, observaciones del maestro, período
- [ ] **Constancia de inscripción** — PDF con datos del estudiante, grado, año escolar, logo del colegio
- [ ] **Factura / Remisión distribución** — PDF con membrete del tenant, RIF, datos del cliente, líneas de pedido, totales IVA
- [ ] **Reporte de asamblea (condominios)** — PDF: acta, lista de asistentes, decisiones tomadas, quórum por alícuota

---

## Phase 18 — Infraestructura y Plataforma

### Build y Deploy
- [ ] **yarn.lock regeneración** — Lockfile de 12 líneas causó builds no-deterministas (PR #31 sin mergear). Requiere Docker con Node 24
- [ ] **CI pipeline** — GitHub Action que corra `yarn typecheck` antes de merge a main para atrapar errores TypeScript antes del deploy
- [ ] **Docker layer caching** — Reducir tiempo de build de ~8min a ~3min en Coolify

### Email (Resend)
- [ ] **Transactional emails** — Confirmación de pago (tuition, condo_fees), bienvenida al tenant, link de acceso al portal del propietario, vencimiento de recibo 3 días antes
- [ ] Dominio: `mail.aikalabs.cc` — necesita DNS + API key de Resend

### Dominio y Acceso
- [ ] **Wildcard domain** — `*.aika.com.ve` para que cada tenant tenga su subdominio: `colegio.aika.com.ve`, `ferreteria.aika.com.ve`
- [ ] **Self-service onboarding** — Formulario de registro de nuevo tenant sin intervención manual

### Búsqueda (Meilisearch)
- [ ] `search.ts` para `dist_credit` — buscar clientes por nombre, RIF, estado de crédito
- [ ] `search.ts` para `auto_service_orders` — buscar órdenes por número, placa, técnico
- [ ] `search.ts` para `condo_fees` — buscar recibos por número, propietario, período

---

## Phase 19 — Workflows de Aprobación (Open Mercato Workflows Module)

El módulo `workflows` de OM tiene step-machine completa. Cero workflows definidos para producción.

- [ ] **Condominios — Gasto extraordinario**: Admin propone → Junta revisa → Asamblea vota → Registro contable automático
- [ ] **Construcción — Change Order**: Residente crea → Director aprueba → Cliente firma → Actualiza contrato y presupuesto
- [ ] **Distribución — Límite de crédito especial**: Vendedor solicita → Gerente aprueba → Sistema actualiza límite automáticamente
- [ ] **Educación — Inscripción completa**: Formulario → Revisión documentos → Aprobación → Notificación → Cargo automático de inscripción
- [ ] **Retail — Devolución fuera de política**: Cajero reporta → Supervisor aprueba → Nota de crédito emitida

---

## Future Verticals

| # | Vertical | Mercado VE | Estado |
|---|---|---|---|
| 1 | ~~Retail / Comercio~~ | Tiendas, ferreterías, farmacias | COMPLETADO (Phase 11) |
| 2 | ~~Automotive / Talleres~~ | Talleres mecánicos | COMPLETADO (Phase 10) |
| 3 | ~~Condominios~~ | Administradoras de edificios | COMPLETADO (Phase 12) |
| 4 | ~~Construcción~~ | Constructoras y obras civiles | COMPLETADO (Phase 13) |
| 5 | **Restaurant / Food** | Restaurantes, areperas, delivery, dark kitchens | Siguiente |
| 6 | **Fitness / Gym** | Gimnasios, crossfit, yoga, pilates | Candidato |
| 7 | **Beauty / Salones** | Peluquerías, spas, barberías | Candidato |
| 8 | **Services / Agencias** | Marketing, diseño, legal, consultoría | Candidato |
| 9 | **Transporte / Logística** | Encomiendas, mudanzas, courier | Futuro |

---

## Technical Debt
- [ ] Remove `example` module from production builds
- [ ] Add integration tests for RE + Education + Distribution modules
- [ ] CI pipeline (typecheck before merge to main) — duplicado en Phase 18 para visibilidad
- [ ] Regenerate yarn.lock on every dependency change
- [ ] `makeCrudRoute` sin `indexer` — varios módulos secundarios sin cobertura de query_index
- [ ] Validación de suma de alícuotas al crear/editar unidades (ahora solo es warning en dashboard)

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
