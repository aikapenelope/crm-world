# Context Document — Aika Platform (for continuation)

## What This Project Is

**Aika** is a multi-vertical SaaS platform built on [Open Mercato](https://github.com/open-mercato/open-mercato) (v0.6.1). It serves businesses in Venezuela with industry-specific CRM modules. The first vertical is **Real Estate**.

Each client (tenant) gets a pre-configured system with their branding. It's not self-service — you create and configure each tenant manually.

## Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| **crm-world** | Application code (Open Mercato standalone + custom modules) | https://github.com/aikapenelope/crm-world |
| **mercatinfra** | Infrastructure as Code (Pulumi + Hetzner) | https://github.com/aikapenelope/mercatinfra |

## Infrastructure

| Component | Detail |
|-----------|--------|
| Server | Hetzner CX33, Helsinki, `65.108.61.137` |
| PaaS | Coolify 4.0 at `http://65.108.61.137:8000` |
| App URL | `https://mercato.novaincs.com/backend` |
| Deploy | Auto on push to `main` in crm-world |
| DB | PostgreSQL 17 (pgvector) — inside Docker |
| Cache | Redis 7 — inside Docker |
| Search | Meilisearch 1.11 — inside Docker |
| Secrets | Pulumi ESC (`aikapenelope-org/mercato-secrets`) |
| SSH Key | Stored in Pulumi stack output (`sshPrivateKey`) |
| Coolify API Token | `4|2O6ohJUzdZwEBcZCGK5l1A5VgCot9ChJT2SVRhav` |
| App UUID in Coolify | `dnts5dsaufpulbz33dp7vwmp` |
| Project UUID | `lbh56n04lb72ri3mujl4as81` (Mercato SaaS) |

## Admin Access

- URL: `https://mercato.novaincs.com/backend`
- Email: `admin@mercato-saas.com`
- Password: `M3rc4t0-Adm1n-2026!`

## Architecture

```
Open Mercato core (npm packages, not modified)
    ↓ consumed by
crm-world/src/modules/ (our custom code)
    ↓ deployed via
Coolify (docker-compose.fullapp.yml)
    ↓ running on
Hetzner CX33 (65.108.61.137)
```

## Custom Modules Built

### Base Venezuela (all tenants)
| Module | What it does |
|--------|-------------|
| `venezuela_rates` | Exchange rates via DolarApi (BCV + paralelo) |
| `payment_methods` | 7 local payment methods (pago móvil, zelle, binance, etc.) |
| `ve_fiscal` | RIF/CI validation, IVA 16%, IGTF 3%, withholdings |
| `ve_tenant_defaults` | Auto-configures tax rates, address format, dictionaries, IGTF hook on tenant creation |

### Real Estate Vertical
| Module | What it does |
|--------|-------------|
| `properties` | Property listings (CRUD, types, operations, status lifecycle, images, links, GPS) |
| `transactions` | Closings + commissions (sale/lease, auto-updates property status) |
| `matching` | Contact preferences vs active properties scoring |
| `property_portal` | Public page /p/[id] (no auth) |
| `property_docs` | PDF sheet data layer |
| `property_publishing` | Pre-formatted text + links to portals |
| `mercadolibre_sync` | Daily sync of ML Venezuela listings (shared, no tenant_id) |
| `market_intelligence` | Valuation API (KPIs, P25-P75, comparables) |

## Key Technical Decisions

1. **No fork of Open Mercato** — standalone app consuming npm packages
2. **No cross-module entity imports** — Turbopack can't resolve them. Use Kysely queries (`em.getKysely()`) for reading other modules' tables
3. **Modules communicate via events and DI** — not direct imports
4. **All modules follow Open Mercato patterns**: `makeCrudRoute`, `ModuleSetupConfig`, `RateProvider` interface, event bus subscribers
5. **Single PostgreSQL database** — all tenants share it, isolated by `tenant_id`
6. **MercadoLibre data is shared** — `market_listings` table has no `tenant_id` (public market data)
7. **Builds take ~15 min** on CX33 due to Next.js compilation. Swap (4GB) prevents OOM.

## Workflow

1. Work on a branch (`neo/...`)
2. Open PR against `main`
3. Review and merge
4. Coolify auto-deploys from `main`

## Regional Config (Venezuela)

- Currency base: USD
- Currencies: USD, VES, EUR, USDT
- Rates: DolarApi (ve.dolarapi.com/v1) — BCV oficial + paralelo
- Timezone: America/Caracas (UTC-4)
- Date format: DD/MM/YYYY
- Decimal separator: comma (1.000,50)
- Phone prefix: +58
- Tax: IVA 16%, IGTF 3% on foreign currency payments
- RIF format: X-XXXXXXXX-X (J/V/E/G/P/C + 8 digits + check)

## What's Next (see docs/ROADMAP.md)

Priority for next PR:
1. Transactions create form
2. Properties search config (Meilisearch)
3. Document type dictionary
4. Property detail tabs
5. Dashboard widgets for RE

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/modules.ts` | Central module registry — add/remove modules here |
| `docker-compose.fullapp.yml` | Production Docker stack |
| `Dockerfile` | Multi-stage build (has NODE_OPTIONS fix for OOM) |
| `docs/ROADMAP.md` | What's next |
| `docs/PROPI_FEATURES_MAP.md` | Feature parity tracking vs original Propi |
| `docs/REAL_ESTATE_PLAN.md` | Full RE vertical plan |
| `docs/FOUNDATION.md` | Regional decisions (Venezuela) |
| `docs/DEVELOPMENT.md` | How to create modules |
| `.ai/specs/` | Spec-driven development specs |
| `CHANGELOG.md` | What's been done |

## Important Constraints

- No Meta API (Instagram/Facebook/WhatsApp messaging) — deferred
- No payment gateway — payments registered manually
- No self-service signup — tenants pre-configured by admin
- Email (Resend) not yet configured — needs API key + DNS
- MercadoLibre sync needs `MERCADOLIBRE_ACCESS_TOKEN` in Coolify env vars
- Domain wildcard for tenant subdomains not yet configured
