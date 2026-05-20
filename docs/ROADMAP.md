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

---

## Next — Phase 7: Production Polish & Second Vertical

### PR 1: Remaining Polish (Medium Priority)
- [ ] PDF renderer for property sheet (cover image, specs, branding, QR)
- [ ] Monthly report PDF (transactions, pipeline, inventory)
- [ ] Email sending integration (Resend — needs API key + DNS)
- [ ] vCard import adapter for contacts
- [ ] Social account settings page (just stores URLs)
- [ ] Branding settings (logo upload per tenant)

### PR 2: Second Vertical
- [ ] Choose vertical based on first client demand
- [ ] Create vertical module structure (same pattern as RE)
- [ ] Vertical-specific seedDefaults in new module's setup.ts

---

## Future Phases

### Phase 8: Platform Features
- [ ] Wildcard domain for tenant subdomains
- [ ] Resend email integration (mail.aikalabs.cc)
- [ ] WhatsApp Business API integration
- [ ] MercadoLibre OAuth (publish from platform)
- [ ] Self-service tenant onboarding (optional)

---

## Technical Debt
- [ ] Upgrade to CX43 when Hetzner has stock (faster builds)
- [ ] Docker layer caching in Coolify (reduce build time)
- [ ] Remove `example` module from production
- [ ] Add integration tests for RE modules
