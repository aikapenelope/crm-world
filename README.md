# Aika Platform

> SaaS multi-vertical para Venezuela — un solo sistema, múltiples industrias.

Construido sobre [Open Mercato](https://github.com/open-mercato/open-mercato) v0.6.1. Cada tenant activa solo los módulos de su vertical. Infraestructura como código con Pulumi. Deploy automático en push a main.

---

## Verticales

### Real Estate — Inmobiliarias y Administradoras

| Módulo | Qué hace |
|--------|----------|
| `properties` | CRUD de propiedades: tipos, operaciones, status, imágenes, GPS |
| `transactions` | Cierres de venta/alquiler, comisiones, auto-update de status |
| `matching` | Motor de scoring: preferencias del cliente vs propiedades disponibles |
| `property_portal` | Página pública /p/[id] para compartir propiedades |
| `property_docs` | Ficha PDF con datos, imágenes y branding |
| `property_publishing` | Generador de texto para ML, Facebook, Instagram, WhatsApp |
| `mercadolibre_sync` | Worker de sincronización diaria con MercadoLibre |
| `market_intelligence` | Tasación automática, KPIs, comparables P25-P75 |

### Education — Colegios y Academias

| Módulo | Qué hace |
|--------|----------|
| `students` | Registro de estudiantes + representantes (15 grados VE) |
| `enrollment` | Inscripciones con documentos y workflow de aprobación |
| `tuition` | Mensualidades, pagos, morosos, cobro masivo por WhatsApp |
| `grades` | Notas y boletines (numérico + cualitativo) |
| `attendance` | Asistencia diaria + resumen mensual |
| `school_calendar` | Calendario escolar + feriados VE |
| `school_comms` | Circulares, avisos y tracking de lectura |
| `school_docs` | Constancias y plantillas (buena conducta, inscripción, etc.) |
| `parent_portal` | Portal del representante: notas, pagos, comunicados |
| `school_migration` | Importación CSV de datos desde sistema anterior |

### Distribuidoras — Mayoristas y Distribución B2B

| Módulo | Qué hace |
|--------|----------|
| `dist_credit` | Cuentas por cobrar, límites de crédito, aging, cobro WhatsApp |
| `dist_price_lists` | Listas de precios múltiples + asignación por cliente |
| `dist_inventory` | Stock por bodega, movimientos, alertas de reposición |
| `dist_routes` | Rutas por zona/día, paradas, visitas, "Mi Día" del vendedor |
| `dist_delivery` | Órdenes de despacho, entregas, devoluciones |
| `dist_reports` | Dashboard KPI: cuentas, inventario, entregas, rutas |
| `dist_commissions` | Comisiones vendedores (venta/cobranza/meta) |
| `dist_portal` | Portal self-service del cliente mayorista |

### Talleres Mecánicos — Automotive

| Módulo | Qué hace |
|--------|----------|
| `auto_vehicles` | Registro de vehículos: marca, modelo, placa, VIN, historial |
| `auto_service_orders` | Órdenes de servicio con workflow (recepción → entrega) |
| `auto_inspections` | Inspección digital DVI con checklist y fotos |
| `auto_parts` | Inventario de repuestos con costo y proveedor |
| `auto_estimates` | Presupuestos con aprobación del cliente |
| `auto_reports` | Dashboard: órdenes, ingresos, productividad por técnico |
| `auto_portal` | Portal del cliente: estado de su vehículo, historial |

### Retail / Comercio — Tiendas Multi-Sucursal *(Phase 11)*

| Módulo | Qué hace |
|--------|----------|
| `retail_branches` | Multi-sucursal: tiendas, bodegas, kioscos. Personal por branch. Transferencias de inventario con aprobación |
| `retail_inventory` | Inventario en tiempo real multi-branch. Conteo cíclico (completo/parcial/spot). Rotación por producto. Dead stock detection (90+ días) |
| `retail_loyalty` | Programa de puntos configurable. Niveles VIP con descuentos automáticos. Campañas de marketing por WhatsApp. Expiración automática |
| `retail_returns` | Devoluciones con políticas por categoría. Inspección de condición. Notas de crédito con saldo. Reingreso condicional al inventario |
| `retail_ecommerce` | Storefront público (/tienda/[slug]). Carrito + checkout. Pedidos con tracking de estado. Pagos VE. Publicador social (IG/WA/TikTok/FB) |
| `retail_purchasing` | Gestión de compras: proveedores, órdenes automáticas por reorden, recepción de mercancía, cuentas por pagar, notas débito/crédito |
| `retail_pricing` | Pricing y márgenes: reglas por categoría/canal, actualización masiva por dólar, precios regulados, alertas bajo costo/margen |

### Property Management / Condominios — Administradoras *(nuevo)*

| Módulo | Qué hace |
|--------|----------|
| `condo_properties` | Edificios, unidades con alícuota (5 decimales, suma=100%), propietarios/inquilinos, áreas comunes reservables |
| `condo_fees` | Cuotas ordinarias/extraordinarias, generación masiva de recibos por alícuota, multi-moneda USD/VES con tasa BCV automática |
| `condo_collections` | Morosidad (40-60% no paga a tiempo), aging por meses, cobro masivo por WhatsApp, acuerdos de pago en cuotas |
| `condo_maintenance` | Solicitudes con workflow (open→assigned→in_progress→completed), órdenes de trabajo, proveedores con rating 1-5 |
| `condo_accounting` | Ingresos/gastos por categoría, fondo de reserva automático (Art. 14 LPH, mín. 10%), presupuesto anual para asamblea |
| `condo_comms` | Circulares con tracking de lectura, votaciones ponderadas por alícuota (Art. 23 LPH), actas de asamblea con quórum |
| `condo_portal` | Portal del propietario: estado de cuenta, reportar pagos, solicitudes mantenimiento, circulares, votaciones, documentos |

---

## Módulos Fiscales Venezuela (transversales)

Aplican a todas las verticales. Cualquier tenant que facture los usa.

| Módulo | Qué hace |
|--------|----------|
| `venezuela_rates` | Tasas USD/VES/EUR/USDT en tiempo real (BCV + paralelo via DolarApi) |
| `payment_methods` | 7 métodos: Pago Móvil, Zelle, Binance, Efectivo USD/VES, Transferencia, Débito |
| `ve_fiscal` | Validación RIF/CI, configuración IVA 16%, IGTF 3%, contribuyente especial |
| `ve_tenant_defaults` | Auto-config al crear tenant: tasas, diccionarios, formato dirección, IGTF hook |
| `ve_tax_books` | Libros de compra/venta IVA (registro para declaración mensual) |
| `ve_withholdings` | Retenciones IVA 75% e ISLR (cálculo + comprobantes) |
| `ve_tax_reports` | Reportes fiscales con export CSV/Excel para el contador |
| `bank_reconciliation` | Conciliación bancaria: upload CSV multi-banco, cruce automático |

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                  OPEN MERCATO v0.6.1 (MIT)                        │
│                                                                    │
│  Auth · CRM · Catálogo · Ventas · Checkout · Workflows · AI      │
│  Search · Portal · Notificaciones · Currencies · Scheduler        │
│  Staff · Planner · Integrations · Webhooks · Feature Toggles      │
└───────────────────────────────┬──────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼─────┐    ┌──────────▼──────────┐    ┌─────▼──────┐
    │  Fiscal  │    │   6 Verticales      │    │   Infra    │
    │    VE    │    │                      │    │   Pulumi   │
    │ 8 módulos│    │  RE · Edu · Dist    │    │   Hetzner  │
    └────┬─────┘    │  Auto·Retail·Condo  │    └─────┬──────┘
         │          └──────────┬──────────┘          │
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               │
                    Feature Toggles por Tenant
                  (cada cliente ve solo su vertical)
```

**Total: 58 módulos custom + 40 módulos Open Mercato core = plataforma completa**

---

## Stack Técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Open Mercato | 0.6.1 |
| Frontend | Next.js + React | 16 / 19 |
| Backend | Node.js + TypeScript | 24 / strict |
| ORM | MikroORM | 7 |
| Validación | Zod | 4 |
| Base de datos | PostgreSQL + pgvector | 17 |
| Cache/Colas | Redis | 7 |
| Búsqueda | Meilisearch | 1.11 |
| Package Manager | Yarn | 4 |
| Infraestructura | Pulumi (TypeScript) | Hetzner Cloud |
| Deploy | Coolify 4.0 | Auto on push |
| TLS | Let's Encrypt | Automático |

---

## URLs

| Servicio | URL |
|----------|-----|
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
yarn typecheck              # TypeScript strict
yarn lint                   # ESLint
yarn test                   # Jest unit tests

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

## Qué Falta / Próximos Pasos

### Retail — Mejoras pendientes

| Mejora | Prioridad | Descripción |
|--------|-----------|-------------|
| POS Interface | Alta | Interfaz de punto de venta táctil para cajeros (barcode scanner, cobro rápido) |
| Inventario por lotes | Media | Tracking de lotes/vencimiento para farmacias y alimentos |
| Reportes de venta por sucursal | Alta | Dashboard comparativo entre branches (ventas, ticket promedio, conversión) |
| Integración con impresora fiscal | Baja | Conexión con impresoras fiscales VE (Bixolon, The Factory) |
| App móvil vendedor | Media | PWA para vendedores en piso (consultar stock, registrar venta) |
| Sincronización offline | Media | Cola de operaciones cuando no hay internet (común en VE) |
| Comparación de precios entre proveedores | Baja | Tabla comparativa automática al crear orden de compra |
| Auto-generación de OC por reorden | Media | Worker que detecta stock bajo y genera OC draft al proveedor preferido |

### Plataforma — Mejoras generales

| Mejora | Prioridad | Descripción |
|--------|-----------|-------------|
| Resend email integration | Alta | Emails transaccionales (confirmación pedido, cobro, bienvenida) |
| Wildcard domain | Media | Subdomains por tenant (cliente.aika.com.ve) |
| WhatsApp Business API | Alta | Mensajes automatizados (no solo wa.me links) |
| PDF renderer | Media | Facturas, recibos, reportes como PDF descargable |
| PWA + Service Worker | Media | Instalable en móvil, notificaciones push |
| Multi-moneda mejorada | Baja | Precios en USD con conversión automática a VES al momento del pago |

### Verticales futuras

| # | Vertical | Mercado VE | Complejidad |
|---|----------|-----------|-------------|
| 1 | **Services / Agencias** | Marketing, diseño, consultoría | Media (3 módulos) |
| 2 | **Healthcare / Clínicas** | Consultorios, laboratorios | Alta (5 módulos) |
| 3 | **Beauty / Salones** | Peluquerías, spas, barberías | Media (3 módulos) |
| 4 | **Restaurant / Food** | Restaurantes, delivery | Alta (4 módulos) |
| 5 | **Fitness / Gym** | Gimnasios, crossfit | Baja (3 módulos) |

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [ROADMAP.md](docs/ROADMAP.md) | Estado de todas las fases completadas y pendientes |
| [PATTERNS.md](docs/PATTERNS.md) | Chainlock — 13 reglas obligatorias para evitar errores |
| [COOKBOOK.md](docs/COOKBOOK.md) | Patrones de código con ejemplos |
| [RETAIL_VERTICAL_PLAN.md](docs/RETAIL_VERTICAL_PLAN.md) | Arquitectura completa de retail |
| [DISTRIBUTION_VERTICAL_PLAN.md](docs/DISTRIBUTION_VERTICAL_PLAN.md) | Plan de distribuidoras |
| [AUTOMOTIVE_VERTICAL_PLAN.md](docs/AUTOMOTIVE_VERTICAL_PLAN.md) | Plan de talleres mecánicos |
| [FOUNDATION.md](docs/FOUNDATION.md) | Decisiones regionales VE (monedas, impuestos, pagos) |
| [OPEN_MERCATO_REFERENCE.md](docs/OPEN_MERCATO_REFERENCE.md) | Fuentes de verdad del framework |

---

## Compatibilidad Open Mercato

Este proyecto consume Open Mercato como paquetes npm (`@open-mercato/*`). Los módulos custom siguen la API pública del framework:

- **Entidades**: `@mikro-orm/decorators/legacy` con `type:` explícito (Turbopack compatible)
- **API Routes**: `makeCrudRoute` con `mapToEntity` + `applyToEntity`
- **DI**: `export function register(_: AppContainer) {}` en cada módulo
- **Eventos**: `createModuleEvents({ moduleId: ... })`
- **UI**: `Page/PageBody`, `DataTable`, `CrudForm`, `apiCall`, `flash()`
- **Navegación**: `page.meta.ts` con `React.createElement('svg', ...)` para iconos
- **i18n**: `es.json` + `en.json` por módulo
- **Cross-module**: Kysely queries + event bus (no imports directos)

Compatible con Open Mercato 0.6.x. Actualizable a futuras versiones sin modificar módulos custom.

---

*Aika Platform — 2026. Hecho en Venezuela.*
