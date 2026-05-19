# Roadmap — Aika Platform

## Completed

### Phase 0 — Infrastructure
- [x] Hetzner CX33 (Helsinki) via Pulumi
- [x] Coolify 4.0 installed (deploy.novaincs.com)
- [x] HTTPS (Let's Encrypt)
- [x] Security (fail2ban, UFW, swap, backups)
- [x] Auto-deploy on push to main
- [x] Upgrade to CX43 (16 GB RAM) — resolved OOM during builds
- [x] GitHub App webhook for auto-deploy (mercato22)

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

#### Sprint 1 (PR #18 — merged)
- [x] Transactions create form (CrudForm — register closing)
- [x] `search.ts` for properties module (Meilisearch indexing)
- [x] Document type dictionary seed (12 tipos: contrato, escritura, avalúo, etc.)
- [x] Property detail tabs (General, Images, Links, Matching)
- [x] Fix all TypeScript/MikroORM type errors for production build
- [x] docs/PATTERNS.md — chainlock de errores y reglas
- [x] docs/OPEN_MERCATO_REFERENCE.md — fuentes de verdad

#### Sprint 2 (PR #19 — pending merge)
- [x] Dashboard widget: Propiedades por estado
- [x] Dashboard widget: Pipeline inmobiliario (valor total)
- [x] Dashboard widget: Cierres recientes
- [x] Notification types: lead inactivo, propiedad sin actividad, reservada, cierre completado
- [x] Matching scoring engine (tipo 30%, ciudad 25%, presupuesto 25%, operación 20%)

#### Sprint 3 (PR #19 — pending merge)
- [x] Agent portal page (/agente/[id] — public properties list)
- [x] PDF property sheet renderer (HTML-based, printable)
- [x] Property sheet API endpoint
- [x] Monthly report API (transactions, pipeline, inventory by month)

#### Sprint 4 (PR #19 — pending merge)
- [x] CSV import adapter for contacts (flexible column mapping ES/EN)
- [x] Social accounts + branding settings page (CrudForm)

---

## Pending (not yet built)

### Items deferred from Phase 6
- [ ] vCard import adapter for contacts
- [ ] Appointment link to property (custom field in planner)
- [ ] Email sending integration (Resend — needs API key + DNS)
- [ ] Logo upload per tenant (needs file storage config)

### Phase 7: Second Vertical (TBD)
- [ ] Choose vertical based on first client demand
- [ ] Retail, Education, Manufacturing, Logistics, or Agriculture

### Phase 8: Platform Features
- [ ] Wildcard domain for tenant subdomains
- [ ] Resend email integration (mail.aikalabs.cc)
- [ ] WhatsApp Business API integration
- [ ] MercadoLibre OAuth (publish from platform)

---

## Technical Debt
- [x] ~~Upgrade to CX43 when Hetzner has stock~~ (done 2026-05-19)
- [ ] Docker layer caching in Coolify (reduce build time)
- [ ] Remove `example` module from production
- [ ] Add integration tests for RE modules
- [ ] Upgrade Coolify to latest (fix intermittent "No such container" bug)
