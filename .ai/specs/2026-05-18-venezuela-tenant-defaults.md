# Venezuela Tenant Defaults — Auto-configuration on Tenant Creation

## Summary

When a new tenant is created in the Aika platform, automatically configure all Venezuelan regional defaults so the tenant is production-ready without manual setup.

## Motivation

Every tenant in Aika operates in Venezuela. Instead of requiring manual configuration of tax rates, address format, timezone, currencies, and payment methods after tenant creation, this module hooks into the `onTenantCreated` and `seedDefaults` lifecycle to pre-configure everything.

## What gets configured automatically

### 1. Tax Rates (Sales module integration)

Override the default Polish VAT rates with Venezuelan rates:

| Code | Name | Rate | Default | Notes |
|------|------|------|---------|-------|
| `iva-16` | IVA General | 16.00% | Yes | Standard rate for most goods/services |
| `iva-8` | IVA Reducido | 8.00% | No | Electronic payment incentive |
| `iva-15` | IVA Lujo | 15.00% | No | Luxury goods |
| `iva-0` | Exento | 0.00% | No | Food, medicine, education, health |
| `igtf-3` | IGTF | 3.00% | No | Foreign currency/crypto payments |

### 2. Address Format

Set to `street_first` (Venezuelan standard: street/avenue first, then building/apartment).

API: `PUT /api/customers/settings/address-format` with `{ addressFormat: "street_first" }`

### 3. Currencies

Handled by `venezuela_rates` module (already implemented):
- USD (base), VES, EUR, USDT with Venezuelan formatting (comma decimal, dot thousands)

### 4. Payment Methods

Handled by `payment_methods` module (already implemented):
- Pago Móvil, Zelle, Binance, Efectivo USD/VES, Transferencia, Débito

### 5. IGTF Auto-calculation (Event subscriber)

Subscribe to `sales.tax.calculate.before` to automatically apply IGTF (3%) when:
- The payment currency is not VES (i.e., USD, EUR, USDT)
- The tenant has `applies_igtf: true` in their fiscal config

This follows the documented pattern in `apps/docs/docs/framework/pricing-tax-overrides.mdx`.

### 6. Document Number Format

Configure Venezuelan-style document numbering:
- Orders: `ORD-{yyyy}{mm}-{seq:5}` → ORD-202605-00001
- Quotes: `COT-{yyyy}{mm}-{seq:5}` → COT-202605-00001
- Invoices: `FAC-{yyyy}{mm}-{seq:5}` → FAC-202605-00001

### 7. Dictionaries (CRM)

Seed Venezuelan-specific dictionary values:
- Address types: Casa, Apartamento, Oficina, Local Comercial
- Sources: Referido, Instagram, WhatsApp, Sitio Web, Otro
- Industries: Comercio, Servicios, Construcción, Alimentos, Tecnología, Salud, Educación

## Technical Approach

### Module: `ve_tenant_defaults`

Uses `setup.ts` with:
- `onTenantCreated`: Configure sales settings (number format), address format
- `seedDefaults`: Seed tax rates, dictionaries

Uses `subscribers/`:
- `on-bootstrap.ts`: Register IGTF event hook on `sales.tax.calculate.before`

### Integration Points

| What | How | Open Mercato pattern |
|------|-----|---------------------|
| Tax rates | Seed `SalesTaxRate` entities | Same as `sales/setup.ts` |
| Address format | Call command bus `customers.settings.upsert` | Same as `customers/commands/settings.ts` |
| Document numbers | Update `SalesSettings` entity | Same as `sales/setup.ts` `onTenantCreated` |
| IGTF hook | Subscribe to `sales.tax.calculate.before` | Documented in `pricing-tax-overrides.mdx` |
| Dictionaries | Seed dictionary entries | Same as `sales/lib/dictionaries.ts` |

### No core modifications required

All configuration is done through:
- Standard `ModuleSetupConfig` hooks (`onTenantCreated`, `seedDefaults`)
- Event bus subscriptions (documented extension point)
- API calls to existing endpoints

## Changelog

- 2026-05-18: Initial spec created
