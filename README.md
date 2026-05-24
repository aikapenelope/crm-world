# Aika Platform

> **SaaS multi-vertical para Venezuela** — un solo sistema, múltiples industrias.  
> Construido sobre [Open Mercato](https://github.com/open-mercato/open-mercato) v0.6.1.  
> Cada tenant activa solo los módulos de su vertical. Deploy automático en push a `main`.

---

## Estado de la Plataforma

| Métrica | Valor |
|---|---|
| Verticales activas en producción | **13** |
| Módulos custom totales | **~105** |
| AI Agents | **11** |
| Workflows de aprobación | **13** |
| PDFs generables | **13** |
| Portales de cliente | **5** |
| Índices DB compuestos | **8+** |
| Deploy URL | **mercato.novaincs.com** |

---

## Verticales

### Real Estate — Inmobiliarias y Administradoras
8 módulos · AI Agent · Search universal · PDF (ficha de propiedad)

| Módulo | Qué hace |
|---|---|
| `properties` | CRUD de propiedades: tipos, operaciones, status, imágenes, GPS |
| `transactions` | Cierres de venta/alquiler, comisiones, auto-update de status |
| `matching` | Motor de scoring: preferencias del cliente vs propiedades disponibles |
| `property_portal` | Página pública /p/[id] para compartir propiedades |
| `property_docs` | Ficha PDF con datos, imágenes y branding |
| `property_publishing` | Generador de texto para ML, Facebook, Instagram, WhatsApp |
| `mercadolibre_sync` | Worker de sincronización diaria con MercadoLibre |
| `market_intelligence` | Tasación automática, KPIs, comparables P25-P75 |

---

### Educación — Colegios y Academias de Formación
10 módulos escolares + 9 módulos academia · 2 AI Agents · 2 PDFs · Portal de padre/estudiante

| Módulo | Qué hace |
|---|---|
| `students` | Registro de estudiantes + representantes (15 grados VE) |
| `enrollment` | Inscripciones con documentos y workflow de aprobación |
| `tuition` | Mensualidades, pagos, morosos, cobro masivo por WhatsApp |
| `grades` | Notas y boletines (numérico + cualitativo) — PDF descargable |
| `attendance` | Asistencia diaria + resumen mensual |
| `school_calendar` | Calendario escolar + feriados VE |
| `school_comms` | Circulares, avisos y tracking de lectura |
| `school_docs` | Constancias y plantillas |
| `parent_portal` | Portal del representante: notas, pagos, comunicados |
| `academy_*` | 9 módulos: cursos, grupos, sesiones, pagos, certificados con QR |

---

### Distribución — Mayoristas y Distribución B2B
8 módulos · AI Agent · PDF (nota de entrega) · Portal del cliente

| Módulo | Qué hace |
|---|---|
| `dist_credit` | Cuentas por cobrar, límites de crédito, aging, cobro WhatsApp |
| `dist_price_lists` | Listas de precios múltiples + asignación por cliente |
| `dist_inventory` | Stock por bodega, movimientos, alertas de reposición |
| `dist_routes` | Rutas por zona/día, paradas, visitas, "Mi Día" del vendedor |
| `dist_delivery` | Órdenes de despacho, entregas, devoluciones |
| `dist_reports` | Dashboard KPI: cuentas, inventario, entregas, rutas |
| `dist_commissions` | Comisiones vendedores (venta/cobranza/meta) |
| `dist_portal` | Portal self-service del cliente mayorista |

---

### Automotriz — Talleres Mecánicos
7 módulos · AI Agent · Portal del cliente

| Módulo | Qué hace |
|---|---|
| `auto_vehicles` | Registro de vehículos: marca, modelo, placa, VIN, historial |
| `auto_service_orders` | Órdenes de servicio con workflow (recepción → entrega) |
| `auto_inspections` | Inspección digital DVI con checklist y fotos |
| `auto_parts` | Inventario de repuestos con costo y proveedor |
| `auto_estimates` | Presupuestos con aprobación del cliente |
| `auto_reports` | Dashboard: órdenes, ingresos, productividad por técnico |
| `auto_portal` | Portal del cliente: estado de su vehículo, historial |

---

### Retail — Comercio Multi-Sucursal
7 módulos · AI Agent · E-commerce público

| Módulo | Qué hace |
|---|---|
| `retail_branches` | Multi-sucursal: tiendas, bodegas, kioscos. Transferencias de inventario |
| `retail_inventory` | Stock en tiempo real multi-branch. Conteo cíclico. Dead stock detection |
| `retail_loyalty` | Puntos, niveles VIP, campañas WhatsApp, expiración automática |
| `retail_returns` | Devoluciones con política, notas de crédito, reingreso condicional |
| `retail_ecommerce` | Storefront público, carrito, checkout, pagos VE, publicador social |
| `retail_purchasing` | Proveedores, órdenes automáticas por reorden, cuentas por pagar |
| `retail_pricing` | Reglas por categoría/canal, actualización masiva por dólar, precios regulados |

---

### Condominios — Administración de Propiedad Horizontal
7 módulos · AI Agent · 2 PDFs · Portal del propietario

| Módulo | Qué hace |
|---|---|
| `condo_properties` | Edificios, unidades con alícuota (5 decimales, suma=100%) |
| `condo_fees` | Cuotas, recibos masivos por alícuota, multi-moneda USD/VES |
| `condo_collections` | Morosidad, aging, cobro masivo WhatsApp, acuerdos en cuotas |
| `condo_maintenance` | Solicitudes con workflow, órdenes de trabajo, proveedores |
| `condo_accounting` | Ingresos/gastos, fondo de reserva automático (Ley PH VE Art. 14) |
| `condo_comms` | Circulares, votaciones ponderadas por alícuota (Art. 23 LPH), actas PDF |
| `condo_portal` | Portal propietario: cuenta, pagos, mantenimiento, votaciones |

---

### Construcción — Constructoras e Ingeniería
8 módulos · AI Agent · PDF (valuación de obra)

| Módulo | Qué hace |
|---|---|
| `const_projects` | Proyectos con contrato, monto, avance global, KPIs en tiempo real |
| `const_budget` | APU (Análisis de Precios Unitarios): árbol de partidas, insumos, cómputos |
| `const_schedule` | Cronograma Gantt: dependencias, ruta crítica, hitos vinculados a pagos |
| `const_progress` | Valuaciones de obra: retenciones, anticipo, flujo de aprobación |
| `const_rfis` | RFIs y submittals: workflow aprobación, escalación automática |
| `const_daily` | Reporte Diario de Obra: personal, clima, actividades, incidentes |
| `const_subcon` | Subcontratistas con contratos, retenciones, pagos, rating |
| `const_materials` | OCs, recepción, inventario en obra, alertas de desvío vs. presupuesto |

---

### ISP — Telecomunicaciones Venezuela
9 módulos · Portal del abonado

| Módulo | Qué hace |
|---|---|
| `isp_plans` | Catálogo de planes: fiber/wireless, residential/PYME/corporate, perfil Radius |
| `isp_network` | Nodos de red con autonomía UPS, CPE inventory, report-outage endpoint |
| `isp_subscribers` | Lifecycle completo (pending→active↔suspended), PPPoE/IP, account number |
| `isp_billing` | Facturación mensual USD+VES, IVA 16%, IGTF 3%, worker detect-overdue |
| `isp_support` | Tickets técnicos + averías masivas, worker SLA breach automático |
| `isp_technicians` | Técnicos de campo, work orders, activación automática al completar |
| `isp_sales` | Pipeline leads, verificación cobertura por ciudad, comisiones |
| `isp_portal` | Portal abonado: factura, historial, reportar pago, solicitar soporte |

---

### Agroalimentario con Procesamiento — Phase 23
12 módulos · AI Agent Director de Producción · 4 workflows · 4 PDFs

**Tres capas: campo → planta → distribución**

| Módulo | Qué hace |
|---|---|
| `agri_units` | Fincas, galpones, flocks. KPIs: FCA, IEP, viabilidad, proyección día 42 |
| `agri_feed` | Fórmulas con recálculo automático al cambiar BCV. Editor inline con costo USD/Bs |
| `agri_vet` | Vacunación con calendario automático, medicación, bloqueo por retiro activo |
| `agri_inputs` | Inventario insumos con descuento automático al aplicar tratamientos |
| `agri_processing` | Planta de beneficio. Verificación de retiro antes de beneficiar. Workflow despacho sanitario |
| `agri_cold_chain` | Endpoint IoT batch sensores. Worker excursiones 15min (absorbe micro-cortes). Sparkline SVG |
| `agri_quality` | HACCP: editor PCCs, monitoreo con auto-NC al desviar, checklists BPM |
| `agri_traceability` | JOIN de 8 tablas via Kysely: producto→flock→alimentos→medicamentos. Recall con workflow |
| `agri_sales` | Ventas a cadenas/distribuidores. USD + IVA 16% VES + IGTF 3% |
| `agri_field` | Ciclos de cultivo (maíz, soya, sorgo) con costo real de MP propia |
| `agri_hr` | Nómina jornaleros LOTTT + liquidación productor integrado. Workflow liquidación |
| `agri_portal` | Portal del productor: ciclo activo (FCA/IEP en tiempo real), liquidaciones |

**PDFs:** informe semanal del lote · liquidación del productor · guía de despacho sanitaria · certificado de trazabilidad INSAI

---

### Manufactura Industrial — Phase 24
16 módulos · 2 AI Agents · 4 workflows · 4 PDFs

**Diferenciadores venezolanos:** OEE bipartido (sin CORPOELEC) · MRP con lead times reales importación (60d) · Costo bimoneda (USD+Bs BCV) · LOTTT en código · IGTF 3% en ventas industriales

#### Sprint A — Núcleo

| Módulo | Qué hace |
|---|---|
| `mfg_bom` | BOM multinivel process/discrete. Versiones. Materiales alternativos para escasez. Explosión Kysely. Workflow bom_approval |
| `mfg_inventory` | 4 tipos stock (MP/empaque/WIP/PT). FEFO con cuarentena QC. Movimientos atómicos |
| `mfg_orders` | Routing, reserva de materiales al liberar, `is_force_majeure` en paros. AI Agent Director Producción (6 tools). Workflow downtime_escalation |
| `mfg_quality` | LSL/USL/LCL/UCL. SPC carta X-R SVG. Auto-NC en PCCs. Costos de no-calidad. Workflow nc_disposition |

#### Sprint B — Inteligencia

| Módulo | Qué hace |
|---|---|
| `mfg_mrp` | Motor MRP: BOM explosion Kysely, necesidades netas, requisiciones automáticas, lead times 60d VE |
| `mfg_floor` | MES: OEE total vs. interno, worker close-shift, heatmap eléctrico |
| `mfg_planning` | MPS semanal + heatmap CORPOELEC SVG 24h×7d, carga de capacidad por línea |
| `mfg_costs` | Costeo bimoneda. `calculate-variances`: 3 variaciones (precio/cantidad/MO) al cierre |

#### Sprint C — Operaciones

| Módulo | Qué hace |
|---|---|
| `mfg_maintenance` | GMAO. `safety_stock = ceil(lead_time/MTBF)`. Worker genera WOs automáticamente |
| `mfg_procurement` | Pipeline importación 6 etapas, cálculo CIF real, tracking DAU. Workflow purchase_authorization |
| `mfg_subcontract` | Almacén virtual en maquilador. Merma real vs. contractual con `scrap_exceeded` |
| `mfg_energy` | kWh por turno, cortes CORPOELEC, `generator_premium_usd` = costo real de la intermitencia |

#### Sprint D — Comercial

| Módulo | Qué hace |
|---|---|
| `mfg_dispatch` | Pedidos industriales IVA 16% + IGTF 3%, guías de despacho, CoA obligatorio |
| `mfg_hr` | Operarios con LOTTT (+30%/+25%/+75%), bonos de producción por cuota |
| `mfg_reports` | KPI dashboard ejecutivo + AI Agent Gerente de Fábrica (6 tools cross-module) |
| `mfg_portal` | Portal cliente industrial: estado de pedidos + certificados de análisis |

**PDFs:** guía de despacho PT · Certificate of Analysis (CoA) · reporte de turno OEE · orden de trabajo de mantenimiento

---

## Módulos Fiscales Venezuela (transversales a todas las verticales)

| Módulo | Qué hace |
|---|---|
| `venezuela_rates` | Tasas USD/VES/EUR/USDT en tiempo real (BCV + paralelo via DolarApi) |
| `payment_methods` | 7 métodos: Pago Móvil, Zelle, Binance, Efectivo USD/VES, Transferencia, Débito |
| `ve_fiscal` | Validación RIF/CI, configuración IVA 16%, IGTF 3%, contribuyente especial |
| `ve_tenant_defaults` | Auto-config al crear tenant: tasas, diccionarios, formato dirección, IGTF hook |
| `ve_tax_books` | Libros de compra/venta IVA (registro para declaración mensual) |
| `ve_withholdings` | Retenciones IVA 75% e ISLR (cálculo + comprobantes) |
| `ve_tax_reports` | Reportes fiscales con export CSV/Excel para el contador |
| `bank_reconciliation` | Conciliación bancaria: upload CSV multi-banco, cruce automático |

---

## Workflows de Aprobación (13 definiciones)

Usando el motor de workflows de Open Mercato. Cada workflow es un JSON en `examples/` del módulo, activado por `seedModuleWorkflow` en `setup.ts`. El `WorkflowApprovalWidget` vive en la página `[id]` de la entidad.

| Vertical | Workflow | Caso de uso |
|---|---|---|
| Condominios | `gasto_extraordinario_v1` | Junta aprueba gastos fuera del presupuesto (Ley PH VE) |
| Construcción | `change_order_approval_v1` | Gerente aprueba change orders con impacto en costo |
| Distribución | `limite_credito_v1` | Gerencia autoriza cambios de límite de crédito |
| Educación | `inscripcion_escolar_v1` | Comité de admisiones decide solicitudes |
| Retail | `devolucion_fuera_politica_v1` | Gerente autoriza devoluciones fuera de política |
| Agri | `despacho_sanitario_v1` | QA firma antes de despachar lote de beneficio |
| Agri | `no_conformidad_ccp_v1` | Disposición de NC crítica HACCP (retrabajo/destrucción) |
| Agri | `recall_v1` | Gerente general aprueba retiro de mercado |
| Agri | `liquidacion_productor_v1` | Técnico propone → gerente aprueba pago al productor |
| Manufactura | `bom_approval_v1` | Cambio de versión BOM → aprobación de ingeniería |
| Manufactura | `nc_disposition_v1` | Disposición de NC crítica (BPF/HACCP) |
| Manufactura | `purchase_authorization_v1` | OC de importación → aprobación antes de comprometer divisas |
| Manufactura | `downtime_escalation_v1` | Paro activo > 2h → escalación a gerente de mantenimiento |

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                    OPEN MERCATO v0.6.1 (MIT)                          │
│                                                                        │
│  Auth · CRM · Catálogo · Ventas · Checkout · Workflows · AI           │
│  Search · Portal · Notificaciones · Currencies · Scheduler             │
│  Staff · Planner · Integrations · Webhooks · Feature Toggles           │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ consume como paquetes npm
         ┌──────────────────┼──────────────────────┐
         │                  │                       │
    ┌────▼─────┐   ┌────────▼─────────────┐  ┌────▼──────┐
    │  Fiscal  │   │  13 Verticales Custom │  │   Infra   │
    │    VE    │   │                       │  │  Pulumi   │
    │ 8 módulos│   │  RE · Edu · Dist      │  │  Hetzner  │
    └────┬─────┘   │  Auto·Retail·Condo    │  └────┬──────┘
         │         │  Const·ISP·Agri       │       │
         │         │  Manufactura+9 más    │       │
         │         └────────┬─────────────┘       │
         └─────────────────▼─────────────────────┘
                    Feature Toggles por Tenant
               (cada cliente ve solo su vertical)
```

**~105 módulos custom** + 11 AI Agents + 13 workflows + 13 PDFs + **40 módulos Open Mercato core** = plataforma completa.

---

## Stack Técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Open Mercato | 0.6.1 |
| Frontend | Next.js + React | 16 / 19 |
| Backend | Node.js + TypeScript | 24 / strict |
| ORM | MikroORM | 7 |
| Validación | Zod | 4 |
| Estilos | Tailwind CSS | 4 |
| Base de datos | PostgreSQL + pgvector | 17 |
| Cache/Colas | Redis | 7 |
| Búsqueda | Meilisearch | 1.11 |
| PDFs | @react-pdf/renderer | 4 |
| Package Manager | Yarn | 4 |
| Infraestructura | Pulumi (TypeScript) | Hetzner CX33 Helsinki |
| Deploy | Coolify 4.0 | Auto-deploy on push |
| TLS | Let's Encrypt | Automático |
| CI | GitHub Actions | typecheck + lint en cada PR |

---

## URLs

| Servicio | URL |
|---|---|
| App (producción) | https://mercato.novaincs.com |
| Deploy panel | https://deploy.novaincs.com |
| Infra repo | [mercatinfra](https://github.com/aikapenelope/mercatinfra) |

---

## Desarrollo

```bash
# Setup inicial
yarn install && yarn db:migrate && yarn generate

# Desarrollo
yarn dev                    # Dev server con splash (localhost:4000)
yarn dev:verbose            # Con logs completos

# Validación
yarn typecheck              # TypeScript strict (tsc --noEmit)
yarn lint                   # ESLint

# Base de datos
yarn db:generate            # Generar migración desde entidades
yarn db:migrate             # Aplicar migraciones pendientes
yarn db:greenfield          # Reset completo (dev only)

# Producción
yarn build                  # Build optimizado
yarn start                  # Servidor producción
git push origin main        # Deploy automático via Coolify
```

---

## Documentación interna

| Documento | Contenido |
|---|---|
| [ROADMAP.md](docs/ROADMAP.md) | Estado de todas las fases — 13 verticales, fase 1–24 |
| [CHANGELOG.md](CHANGELOG.md) | Historial detallado por PR con decisiones técnicas |
| [AGM.md](AGM.md) | Reglas obligatorias del proyecto (Chainlock + patrones OM) |
| [PORTAL_GUIDE.md](docs/PORTAL_GUIDE.md) | Patrón `[orgSlug]/portal/` para portales de cliente |
| [PATTERNS.md](docs/PATTERNS.md) | Chainlock — 13 reglas para evitar errores comunes |
| [COOKBOOK.md](docs/COOKBOOK.md) | Patrones de código con ejemplos |
| [FOUNDATION.md](docs/FOUNDATION.md) | Decisiones regionales VE (monedas, impuestos, pagos) |

---

## Compatibilidad Open Mercato

Este proyecto consume Open Mercato como paquetes npm (`@open-mercato/*`). Los módulos custom siguen la API pública del framework:

- **Entidades**: `@mikro-orm/decorators/legacy` con `type:` explícito en todo `@Property` (Turbopack compatible)
- **API Routes**: `makeCrudRoute` con `mapToEntity` + `applyToEntity`
- **DI**: `export function register(_: AppContainer) {}` en cada módulo
- **Eventos**: `createModuleEvents({ moduleId: ... })`
- **UI**: `Page/PageBody`, `DataTable`, `CrudForm`, `apiCall`, `flash()`
- **Workflows**: `WorkflowApprovalWidget` + `seedModuleWorkflow` + JSON en `examples/`
- **PDFs**: `renderToStream` + `@react-pdf/renderer` + `loadOrgBranding` + design system en `src/lib/pdf/`
- **Cross-module**: Kysely queries via `(em as any).getKysely()` — nunca imports directos entre módulos
- **Navegación**: `page.meta.ts` con `pageGroup: 'Vertical'` + `pageGroupKey: 'nav.group.x'`

Compatible con Open Mercato 0.6.x. Actualizable sin modificar módulos custom.

---

## Verticales Candidatas (no iniciadas)

| Vertical | Candidatos en Venezuela | Complejidad estimada |
|---|---|---|
| **Fitness / Gym** | Gimnasios PyME, crossfit, academias deportivas | ~8 módulos |
| **Beauty / Salones** | Peluquerías, spas, barberías, centros de estética | ~7 módulos |
| **Services / Agencias** | Publicidad, consultoría, agencias digitales, despachos | ~8 módulos |

---

*Aika Platform — 2026. Hecho en Venezuela.*
