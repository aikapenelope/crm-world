# Changelog — Aika Platform (CRM World)

## 2026-05-20 — Fiscal + Distribution + Automotive Verticals

### Módulos Fiscales Transversales (4 módulos)

- `ve_tax_books` — Libros de compra/venta IVA (registro manual, resumen mensual, export CSV)
- `ve_withholdings` — Retenciones IVA 75% e ISLR (cálculo, comprobantes, declaración quincenal)
- `ve_tax_reports` — Dashboard fiscal (débito/crédito fiscal, IGTF, export para el contador)
- `bank_reconciliation` — Conciliación bancaria (upload CSV: Banesco, Mercantil, Provincial, BNC, BDV)

### Vertical Distribuidoras (8 módulos)

- `dist_credit` — Cuentas por cobrar, límites de crédito, aging report (0-30/31-60/61-90/90+), cobro WhatsApp, worker morosos
- `dist_price_lists` — Listas de precios múltiples (mayorista, detallista, volumen), asignación a clientes
- `dist_inventory` — Stock por producto/bodega, movimientos, alertas de reposición
- `dist_routes` — Rutas por zona/día, paradas de clientes, registro de visitas, página "Mi Día"
- `dist_delivery` — Órdenes de despacho, items por entrega, confirmación, devoluciones
- `dist_reports` — Dashboard KPI (cuentas por cobrar, inventario, entregas, efectividad rutas)
- `dist_commissions` — Comisiones vendedores (venta/cobranza/meta), aprobación, liquidación
- `dist_portal` — Portal self-service del cliente (estado de cuenta, crédito disponible)

### Vertical Talleres Mecánicos (7 módulos)

- `auto_vehicles` — Registro de vehículos (placa, marca, modelo, año, km, fotos desde cámara)
- `auto_service_orders` — Órdenes de servicio con workflow 8 pasos + board Kanban + timeline visual
- `auto_inspections` — Inspección digital DVI (fotos por sistema, hallazgos, condición, urgencia)
- `auto_parts` — Inventario de repuestos (categorías, costo/venta, stock, alertas)
- `auto_estimates` — Presupuestos con aprobación interactiva (página pública, cliente aprueba/rechaza items)
- `auto_reports` — Dashboard KPI del taller (vehículos, ingresos, repuestos)
- `auto_portal` — Portal del cliente (status del vehículo en tiempo real)

### UX Moderna (Talleres)

- Upload de fotos desde cámara del teléfono (`capture="environment"`)
- Galería con lightbox (click para zoom)
- Página pública de inspección (link compartible sin auth, mobile-first)
- Presupuesto interactivo público (tap para aprobar/rechazar items, total en tiempo real)
- Timeline visual de progreso de la orden (barra animada con 8 pasos)
- Envío por wa.me con resumen de hallazgos + link público
- Board Kanban de órdenes por status

### Regionalización VE (Talleres)

- 15 marcas populares con modelos (Toyota, Chevrolet, Ford, Hyundai, Kia, etc.)
- 20 servicios comunes pre-cargados (cambio aceite, frenos, A/C, correa tiempo, etc.)
- Validación de placa venezolana (formato clásico ABC123 + nuevo AB123CD)
- Búsqueda rápida por placa (retorna vehículo + cliente + última orden)
- Recibo de pago como imagen HTML (compartible por WhatsApp)
- Worker de recordatorio de mantenimiento (6 meses / 10,000 km)
- 5 tipos de notificación (vehículo listo, presupuesto enviado, inspección, mantenimiento)

### Fixes

- `di.ts` debe exportar `register()` — causa raíz de los build failures en Coolify
- `yarn.lock` regenerado completo (16,074 líneas)
- Documentado en PATTERNS.md como regla #13

### Documentación

- `docs/DISTRIBUTION_VERTICAL_PLAN.md` — Plan completo distribuidoras
- `docs/AUTOMOTIVE_VERTICAL_PLAN.md` — Plan completo talleres
- `docs/ROADMAP.md` — Actualizado con todas las fases completadas
- `docs/PATTERNS.md` — Chainlock actualizado (reglas #11, #12, #13)
- `README.md` — Reescrito con estado actual

---

## 2026-05-20 — Education Vertical Complete

### Vertical Education / Colegios (9 módulos)

#### `students` — Registro de estudiantes (Sprint 1)
- Entidades: StudentEntity (15 grados VE: maternal → 5to año), StudentRepresentativeEntity
- 5 estados: active, graduated, withdrawn, suspended, transferred
- Datos médicos, alergias, contacto emergencia, tipo de sangre
- Junction con customers.person para representantes (parentesco, principal, autorizado retiro)
- DataTable con filtros (grado, sección, estado), CrudForm (4 grupos), detalle con tabs
- Búsqueda Meilisearch (nombre, cédula, grado, sección)
- 8 eventos tipados, seedDefaults (diccionarios: grados, secciones, parentescos)

#### `enrollment` — Inscripciones (Sprint 2)
- Entidades: EnrollmentPeriodEntity, EnrollmentApplicationEntity, EnrollmentDocumentEntity
- Tipos de solicitud: nuevo ingreso, renovación, traslado
- Workflow: pending → documents_pending → approved/rejected/cancelled
- Checklist de documentos VE: partida nacimiento, notas anteriores, foto carnet, cédula representante, RIF, constancia residencia, carta buena conducta, certificado salud
- 9 eventos tipados (período, solicitud, documento lifecycle)

#### `tuition` — Mensualidades (Sprint 3-4)
- Entidades: TuitionPlanEntity, TuitionChargeEntity, TuitionPaymentEntity, TuitionDiscountEntity
- Planes por grado con monto mensual, día de vencimiento, recargo por mora, días de gracia
- Cargos: mensualidad, inscripción, material, uniforme, transporte, evento
- Pagos: multi-moneda (USD/VES/USDT/EUR), tasa de cambio, método de pago, referencia
- Descuentos: hermanos, beca, empleado, pronto pago
- Control de morosos (status overdue automático)
- Notificaciones: cargo vencido, pago recibido
- 7 eventos tipados, 7 features ACL

#### `grades` — Notas y boletines (Sprint 5)
- Entidades: SubjectEntity, GradePeriodEntity (3 lapsos/año), StudentGradeEntity, ReportCardEntity
- Notas numéricas (0-20) para primaria/bachillerato
- Notas cualitativas (A-E) para preescolar
- Boletines con promedio, observaciones, profesor, PDF adjunto
- Status de boletín: draft → published → delivered
- 4 eventos tipados, 5 features ACL

#### `attendance` — Asistencia (Sprint 6)
- Entidades: AttendanceRecordEntity (diario), AttendanceSummaryEntity (mensual materializado)
- 5 estados: present, absent, late, excused, half_day
- Bulk record schema (toda la sección de un día)
- Resumen mensual: días presente/ausente/tarde/justificado + porcentaje
- 4 eventos tipados, 3 features ACL

#### `school_calendar` — Calendario escolar (Sprint 7)
- Entidad: SchoolEventEntity (7 tipos: holiday, exam_period, meeting, event, etc.)
- seedDefaults: 11 feriados nacionales venezolanos pre-configurados
- Soporte para eventos por grado específico
- 3 eventos tipados, 2 features ACL

#### `school_comms` — Comunicaciones (Sprint 7)
- Entidades: SchoolAnnouncementEntity, AnnouncementReadEntity
- Tipos: circular, aviso, recordatorio, emergencia
- Audiencia: todos, por grado, por sección
- Tracking de lectura por representante
- 3 eventos tipados, 3 features ACL

#### `school_docs` — Constancias (Sprint 8)
- Entidades: DocumentTemplateEntity, GeneratedDocumentEntity
- 5 tipos: constancia estudio, inscripción, notas, buena conducta, carta recomendación
- Templates con placeholders para generación PDF
- Status: pending → generated → delivered
- 3 features ACL

#### `parent_portal` — Portal del representante (Sprint 8)
- Portal público usando customer_accounts auth
- defaultCustomerRoleFeatures (portal_admin, buyer, viewer)
- Páginas: dashboard, pagos, notas, asistencia
- 4 features ACL

### Documentación y Configuración
- `docs/IMPLEMENTATION_GUIDE.md` — Guía paso a paso para onboarding de tenants RE
- `docs/ROADMAP.md` — Actualizado con Phase 6 completa + Education vertical
- `README.md` — Sección "Flujo de Deploy Multi-Vertical"
- `docs/DEVELOPMENT.md` — Corregidas discrepancias (moduleId, mapToEntity, type explícito)
- `properties/setup.ts` — seedDefaults: pipeline RE (7 etapas) + tags (9 categorías)

---

## 2026-05-19 — Real Estate UI + Cleanup

### UI Funcional (PR #1 merged)
- **Properties list**: DataTable con filtros (tipo, operación, estado), búsqueda, paginación, row actions
- **Properties create**: CrudForm con campos agrupados (info, precio, specs, ubicación)
- **Properties edit**: CrudForm pre-populated con datos existentes
- **Transactions list**: DataTable con filtros tipo/status, comisión, fecha cierre
- **Matching list**: DataTable con score badges, criterios matched

### Phase 6 — Complete Real Estate for First Client
- Transactions create form (CrudForm con lease fields, agentes, métodos de pago)
- Properties search.ts (Meilisearch indexing completo con presenter)
- Property detail tabs (General, Imágenes, Links, Matching)
- Dashboard widgets (properties by status, pipeline summary, recent closings)
- Notification types (lead inactivo, propiedad sin actividad, reservada, cierre completado)
- Matching scoring engine (weighted: type 30%, city 25%, budget 25%, operation 20%)
- Agent portal page (/agente/[id] — grid público de propiedades)
- CSV import adapter (mapeo flexible columnas ES/EN)
- Agent portal API

### Fixes
- Eliminados todos los imports cross-module (Turbopack restriction)
- Módulos usan Kysely queries (`em.getKysely()`) para leer tablas de otros módulos
- matching/data usa enums locales en vez de importar de properties

### Cleanup Coolify
- Eliminada app duplicada que generaba builds fallidos (17 failed)
- Eliminado proyecto vacío "My first project"
- Solo queda "Mercato SaaS" con la app correcta configurada

---

## 2026-05-18 — Fundación e Infraestructura

### Infraestructura (mercatinfra)

- **Servidor Hetzner CX33** desplegado en Helsinki (65.108.61.137) via Pulumi
- **Coolify 4.0** instalado como PaaS (deploy.novaincs.com)
- **Firewall** configurado: SSH + HTTP + HTTPS + Coolify UI
- **SSH Key** ED25519 auto-generada, almacenada en Pulumi secrets
- **Red privada** 10.10.0.0/16 con subnet 10.10.1.0/24
- **Swap 4 GB** configurado para prevenir OOM durante builds
- **fail2ban** + **UFW** activos
- **Backups diarios** de PostgreSQL (cron, 30 días retención)
- **Secrets** centralizados en Pulumi ESC (aikapenelope-org/mercato-secrets)

### Aplicación (crm-world)

- **Open Mercato v0.6.1** scaffolded como standalone app
- **Docker Compose** hardened para producción (NODE_ENV=production, memory limits)
- **Dockerfile** corregido con NODE_OPTIONS para builds pesados
- **Dominios** configurados: mercato.novaincs.com (app) + deploy.novaincs.com (Coolify)
- **HTTPS** automático via Let's Encrypt (Coolify/Traefik)
- **Auto-deploy** en cada push a main

### Módulos Base Venezuela (aplican a todos los tenants)

#### `venezuela_rates` — Tasas de cambio
- Provider DolarApi (ve.dolarapi.com/v1)
- Tasas BCV oficial (USD/VES, EUR/VES)
- Tasas paralelo/Binance P2P (USD/VES, EUR/VES, USDT/VES)
- Seed de monedas: USD (base), VES, EUR, USDT
- Formatos venezolanos (coma decimal, punto miles)

#### `payment_methods` — Métodos de pago locales
- 7 métodos pre-configurados: Pago Móvil, Zelle, Binance, Efectivo USD, Efectivo VES, Transferencia, Débito
- Entidad de registro de pagos con estado (pending → confirmed/rejected)
- Cada método tiene moneda, referencia requerida, instrucciones
- Equivalente USD + tasa de cambio almacenados por pago
- Eventos emitidos en registro/confirmación/rechazo

#### `ve_fiscal` — Identificación fiscal
- Validación de RIF (J-12345678-9) con prefijos J/V/E/G/P/C
- Validación de Cédula (V-12345678, E-12345678)
- Tasas vigentes: IVA 16%, IVA reducido 8%, IVA lujo 15%, IGTF 3%
- Retenciones: IVA 75%, ISLR servicios 5%, ISLR compras 2%
- Entidad de config fiscal por tenant + identidad fiscal por cliente

#### `ve_tenant_defaults` — Auto-configuración de tenant
- Reemplaza VAT polaco por IVA venezolano al crear tenant
- Configura numeración de documentos (ORD-202605-00001, COT-202605-00001)
- Configura formato de dirección (street_first)
- Seed de diccionarios CRM (tipos de dirección, fuentes, industrias VE)
- Subscriber IGTF: auto-aplica 3% en pagos en divisas via event bus

### Vertical Real Estate (8 módulos)

#### `properties` — Propiedades inmobiliarias
- Tipos: apartamento, casa, terreno, comercial, oficina, galpón, otro
- Operaciones: venta, alquiler, venta/alquiler
- Status lifecycle: draft → active → reserved → sold/rented/inactive
- Imágenes (max 10), links externos, GPS, comisión configurable

#### `transactions` — Cierres y comisiones
- Tipos: venta, alquiler (con campos de lease: canon, inicio, fin, meses)
- Auto-cálculo de comisión, auto-update status de propiedad
- Subscriber que cambia propiedad a sold/rented al completar

#### `matching` — Motor de cruce contacto ↔ propiedad
- Preferencias por contacto (tipo, ciudad, operación, presupuesto)
- Scoring engine con pesos configurables
- Score por propiedad y por contacto

#### `property_portal` — Página pública /p/[id]
- Carousel de fotos, specs, precio, botón WhatsApp
- Solo propiedades activas, sin auth

#### `property_docs` — Ficha PDF (data layer)
- API de datos para generación de PDF

#### `property_publishing` — Publicación asistida
- Texto pre-formateado + links directos (ML, FB, IG, TikTok, WhatsApp)

#### `mercadolibre_sync` — Sync de mercado
- Worker diario, tabla compartida (sin tenant_id)
- Solo lectura — no publica

#### `market_intelligence` — Tasación
- KPIs por zona, rango P25-P75, comparables
- Consume datos de mercadolibre_sync

---

## Resumen de módulos por vertical

### Base Venezuela (todos los tenants)
| Módulo | Propósito |
|---|---|
| `venezuela_rates` | Tasas de cambio (BCV + paralelo) |
| `payment_methods` | 7 métodos de pago locales |
| `ve_fiscal` | RIF/CI, IVA, IGTF, retenciones |
| `ve_tenant_defaults` | Auto-config al crear tenant |

### Real Estate (8 módulos)
| Módulo | Propósito |
|---|---|
| `properties` | CRUD propiedades + imágenes + links |
| `transactions` | Cierres + comisiones |
| `matching` | Cruce contacto ↔ propiedad |
| `property_portal` | Página pública /p/[id] |
| `property_docs` | Ficha PDF |
| `property_publishing` | Texto + links a portales |
| `mercadolibre_sync` | Sync diario ML |
| `market_intelligence` | Tasación + comparables |

### Education (9 módulos)
| Módulo | Propósito |
|---|---|
| `students` | Registro estudiantes + representantes |
| `enrollment` | Inscripciones + documentos |
| `tuition` | Mensualidades + pagos + morosos |
| `grades` | Notas + boletines |
| `attendance` | Asistencia diaria + resumen |
| `school_calendar` | Calendario escolar + feriados VE |
| `school_comms` | Circulares + avisos |
| `school_docs` | Constancias + plantillas |
| `parent_portal` | Portal del representante |

---

## Notas técnicas

### Patrones utilizados

Todos los módulos siguen los patrones documentados de Open Mercato v0.6.1:

| Patrón | Implementación |
|---|---|
| `@Property({ type: '...' })` | Siempre con type explícito (Turbopack) |
| `makeCrudRoute` | Con `mapToEntity` + `applyToEntity` + `indexer` |
| `createModuleEvents` | Con `moduleId:` + `category` |
| `ModuleSetupConfig` | `onTenantCreated` + `seedDefaults` + `defaultRoleFeatures` |
| Cross-module queries | `(em as any).getKysely()` — nunca imports directos |
| Seeds | `em.create(Entity, {...} as any)` |
| i18n | `es.json` + `en.json` por módulo |
| Search | `SearchModuleConfig` con `fieldPolicy` |
| Notifications | `NotificationTypeDefinition[]` |
| Dashboard widgets | `DashboardWidgetModule` con config + client component |

### Principios de arquitectura

- Open Mercato core NO se modifica — todo es aditivo
- Módulos son independientes y se pueden activar/desactivar por tenant
- Comunicación entre módulos via eventos y Kysely (no imports directos)
- Cada tenant tiene su propio pipeline, tags, configuración (aislado por tenant_id)
- La visibilidad se controla por feature toggles + role features
