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

---

## Next — Phase 6: Complete Real Estate for First Client

### PR 1: Transactions + Search (High Priority)
- [ ] Transactions create form (CrudForm — register closing)
- [ ] `search.ts` for properties module (Meilisearch indexing)
- [ ] Document type dictionary seed (contrato, escritura, avalúo, plano, factura)
- [ ] Property detail tabs (images, links, documents, matching results)

### PR 2: Dashboard + Notifications (High Priority)
- [ ] RE dashboard widgets (properties by status, pipeline summary, recent closings)
- [ ] RE notification types (lead inactivo 7+ días, propiedad sin actividad)
- [ ] Matching scoring engine implementation (weighted criteria)

### PR 3: Portal + PDF (Medium Priority)
- [ ] Agent portal page (/agente/[id] — public properties list)
- [ ] PDF renderer for property sheet (cover image, specs, branding, QR)
- [ ] Monthly report PDF (transactions, pipeline, inventory)
- [ ] Email sending integration (when Resend is configured)

### PR 4: Import + Polish (Medium Priority)
- [ ] CSV import adapter for contacts
- [ ] vCard import adapter for contacts
- [ ] Appointment link to property (custom field in planner)
- [ ] Social account settings page (just stores URLs)
- [ ] Branding settings (logo upload per tenant)

---

## Future Phases

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
- [ ] Upgrade to CX43 when Hetzner has stock (faster builds)
- [ ] Docker layer caching in Coolify (reduce build time)
- [ ] Remove `example` module from production
- [ ] Add integration tests for RE modules
