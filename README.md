# CRM World — Aika Platform

Plataforma SaaS multi-vertical construida sobre [Open Mercato](https://github.com/open-mercato/open-mercato) v0.6.1. Un solo sistema que sirve a múltiples industrias en Venezuela con módulos especializados por rubro.

## Verticales Implementadas

| Vertical | Módulos | Estado |
|----------|---------|--------|
| **Real Estate** | 8 módulos (propiedades, transacciones, matching, portal, docs, publishing, ML sync, market intel) | Completa |
| **Education / Colegios** | 10 módulos (students, enrollment, tuition, grades, attendance, calendar, comms, docs, portal, migration) | Completa |
| **Distribuidoras** | 8 módulos (crédito/CxC, listas de precios, inventario, rutas, despacho, reportes, comisiones, portal) | Completa |
| **Talleres Mecánicos** | 7 módulos (vehículos, órdenes de servicio, inspección digital DVI, repuestos, presupuestos, reportes, portal) | Completa |

## Módulos Transversales (aplican a todas las verticales)

| Módulo | Propósito |
|--------|-----------|
| `venezuela_rates` | Tasas de cambio BCV + paralelo (DolarApi) |
| `payment_methods` | 7 métodos de pago VE (Pago Móvil, Zelle, Binance, etc.) |
| `ve_fiscal` | RIF/CI, IVA 16%, IGTF 3%, retenciones |
| `ve_tenant_defaults` | Auto-configuración al crear tenant |
| `ve_tax_books` | Libros de compra/venta IVA |
| `ve_withholdings` | Retenciones IVA/ISLR |
| `ve_tax_reports` | Reportes fiscales + export CSV |
| `bank_reconciliation` | Conciliación bancaria (upload CSV multi-banco) |

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│            OPEN MERCATO v0.6.1 (core MIT)           │
│  Auth · CRM · Catálogo · Ventas · Workflows · AI   │
│  Search · Portal · Notificaciones · Currencies      │
└────────────────────────┬────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐  ┌───────────▼──────────┐  ┌─────▼──────┐
│ Fiscal │  │ Verticales Custom    │  │  Infra     │
│  VE    │  │ RE · Edu · Dist · Auto│  │  Pulumi   │
└───┬────┘  └───────────┬──────────┘  └─────┬──────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
              Feature Toggles por Tenant
              (cada cliente ve solo su vertical)
```

## Stack

| Componente | Tecnología |
|---|---|
| Framework | Open Mercato v0.6.1 (Next.js 16, TypeScript, MikroORM 7) |
| Base de datos | PostgreSQL 17 + pgvector |
| Cache/Colas | Redis 7 |
| Búsqueda | Meilisearch 1.11 |
| Infraestructura | Hetzner Cloud (Helsinki) via Pulumi |
| Deploy | Coolify 4.0 (git-push → auto-deploy) |
| TLS | Let's Encrypt automático |

## URLs

| Servicio | URL |
|---|---|
| Aplicación | https://mercato.novaincs.com |
| Panel de deploy | https://deploy.novaincs.com |
| Infra (Pulumi) | [mercatinfra](https://github.com/aikapenelope/mercatinfra) |

## Desarrollo

```bash
yarn dev              # Desarrollo local
yarn generate         # Regenerar módulos
yarn db:generate      # Crear migración
yarn db:migrate       # Aplicar migración
yarn typecheck        # Verificar tipos
git push origin main  # Deploy automático
```

Ver [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para la guía completa.

## Documentación

| Documento | Contenido |
|---|---|
| [ROADMAP.md](docs/ROADMAP.md) | Estado de todas las fases |
| [PATTERNS.md](docs/PATTERNS.md) | Chainlock — errores y soluciones |
| [COOKBOOK.md](docs/COOKBOOK.md) | Patrones de código |
| [DISTRIBUTION_VERTICAL_PLAN.md](docs/DISTRIBUTION_VERTICAL_PLAN.md) | Plan distribuidoras |
| [AUTOMOTIVE_VERTICAL_PLAN.md](docs/AUTOMOTIVE_VERTICAL_PLAN.md) | Plan talleres mecánicos |
| [FOUNDATION.md](docs/FOUNDATION.md) | Decisiones regionales VE |

## Licencia

El código propio de este repositorio es privado. Open Mercato core es MIT.
