// Central place to enable modules and their source.
// - id: module id (plural snake_case; special cases: 'auth')
// - from: '@open-mercato/core' | '@app' | custom alias/path in future
// - overrides: optional unified per-app override surface — replace or
//   disable any contract a module presents. AI is wired today (Phase 1);
//   other domains are stubbed and emit a one-shot warning if used.
//   See `.ai/specs/2026-05-04-modules-ts-unified-overrides.md` and
//   `apps/docs/docs/framework/ai-assistant/overrides.mdx`.
import { parseBooleanWithDefault } from '@open-mercato/shared/lib/boolean'
import type { ModuleOverrides } from '@open-mercato/shared/modules/overrides'

export type ModuleEntry = {
  id: string
  from?: '@open-mercato/core' | '@app' | string
  overrides?: ModuleOverrides
}

export const enabledModules: ModuleEntry[] = [
  { id: 'dashboards', from: '@open-mercato/core' },
  { id: 'auth', from: '@open-mercato/core' },
  { id: 'directory', from: '@open-mercato/core' },
  { id: 'customers', from: '@open-mercato/core' },
  { id: 'perspectives', from: '@open-mercato/core' },
  { id: 'entities', from: '@open-mercato/core' },
  { id: 'configs', from: '@open-mercato/core' },
  { id: 'query_index', from: '@open-mercato/core' },
  { id: 'audit_logs', from: '@open-mercato/core' },
  { id: 'attachments', from: '@open-mercato/core' },
  { id: 'catalog', from: '@open-mercato/core' },
  { id: 'sales', from: '@open-mercato/core' },
  { id: 'api_keys', from: '@open-mercato/core' },
  { id: 'dictionaries', from: '@open-mercato/core' },
  { id: 'content', from: '@open-mercato/content' },
  { id: 'onboarding', from: '@open-mercato/onboarding' },
  { id: 'api_docs', from: '@open-mercato/core' },
  { id: 'business_rules', from: '@open-mercato/core' },
  { id: 'feature_toggles', from: '@open-mercato/core' },
  { id: 'workflows', from: '@open-mercato/core' },
  { id: 'search', from: '@open-mercato/search' },
  { id: 'currencies', from: '@open-mercato/core' },
  { id: 'planner', from: '@open-mercato/core' },
  { id: 'resources', from: '@open-mercato/core' },
  { id: 'staff', from: '@open-mercato/core' },
  { id: 'events', from: '@open-mercato/events' },
  { id: 'notifications', from: '@open-mercato/core' },
  { id: 'progress', from: '@open-mercato/core' },
  { id: 'integrations', from: '@open-mercato/core' },
  { id: 'data_sync', from: '@open-mercato/core' },
  { id: 'messages', from: '@open-mercato/core' },
  { id: 'ai_assistant', from: '@open-mercato/ai-assistant' },
  { id: 'translations', from: '@open-mercato/core' },
  { id: 'scheduler', from: '@open-mercato/scheduler' },
  { id: 'inbox_ops', from: '@open-mercato/core' },
  { id: 'payment_gateways', from: '@open-mercato/core' },
  { id: 'checkout', from: '@open-mercato/checkout' },
  { id: 'gateway_stripe', from: '@open-mercato/gateway-stripe' },
  { id: 'sync_akeneo', from: '@open-mercato/sync-akeneo' },
  { id: 'shipping_carriers', from: '@open-mercato/core' },
  { id: 'webhooks', from: '@open-mercato/webhooks' },
  { id: 'customer_accounts', from: '@open-mercato/core' },
  { id: 'portal', from: '@open-mercato/core' },
  // { id: 'example', from: '@app' }, // disabled in production — dev/demo module only
  { id: 'ratelimit_probe', from: '@app' },

  // Aika: Regional modules (apply to all tenants)
  { id: 'venezuela_rates', from: '@app' },
  { id: 'payment_methods', from: '@app' },
  { id: 've_fiscal', from: '@app' },
  { id: 've_tenant_defaults', from: '@app' },

  // Aika: Fiscal modules (transversal — apply to all verticals)
  { id: 've_tax_books', from: '@app' },
  { id: 've_withholdings', from: '@app' },
  { id: 've_tax_reports', from: '@app' },
  { id: 'bank_reconciliation', from: '@app' },

  // Aika: Distribution vertical
  { id: 'dist_credit', from: '@app' },
  { id: 'dist_price_lists', from: '@app' },
  { id: 'dist_inventory', from: '@app' },
  { id: 'dist_routes', from: '@app' },
  { id: 'dist_delivery', from: '@app' },
  { id: 'dist_reports', from: '@app' },
  { id: 'dist_commissions', from: '@app' },
  { id: 'dist_portal', from: '@app' },

  // Aika: Automotive vertical (talleres mecánicos)
  { id: 'auto_vehicles', from: '@app' },
  { id: 'auto_service_orders', from: '@app' },
  { id: 'auto_inspections', from: '@app' },
  { id: 'auto_parts', from: '@app' },
  { id: 'auto_estimates', from: '@app' },
  { id: 'auto_reports', from: '@app' },
  { id: 'auto_portal', from: '@app' },

  // Aika: Real Estate vertical
  { id: 'properties', from: '@app' },
  { id: 'transactions', from: '@app' },
  { id: 'matching', from: '@app' },
  { id: 'property_portal', from: '@app' },
  { id: 'property_docs', from: '@app' },
  { id: 'property_publishing', from: '@app' },
  { id: 'mercadolibre_sync', from: '@app' },
  { id: 'market_intelligence', from: '@app' },

  // Aika: Education vertical
  { id: 'students', from: '@app' },
  { id: 'enrollment', from: '@app' },
  { id: 'tuition', from: '@app' },
  { id: 'grades', from: '@app' },
  { id: 'attendance', from: '@app' },
  { id: 'school_calendar', from: '@app' },
  { id: 'school_comms', from: '@app' },
  { id: 'school_docs', from: '@app' },
  { id: 'parent_portal', from: '@app' },
  { id: 'school_migration', from: '@app' },

  // Aika: Retail/Comercio vertical
  { id: 'retail_branches', from: '@app' },
  { id: 'retail_inventory', from: '@app' },
  { id: 'retail_loyalty', from: '@app' },
  { id: 'retail_returns', from: '@app' },
  { id: 'retail_ecommerce', from: '@app' },
  { id: 'retail_purchasing', from: '@app' },
  { id: 'retail_pricing', from: '@app' },

  // Aika: Property Management / Condominios vertical
  { id: 'condo_properties', from: '@app' },
  { id: 'condo_fees', from: '@app' },
  { id: 'condo_collections', from: '@app' },
  { id: 'condo_maintenance', from: '@app' },
  { id: 'condo_accounting', from: '@app' },
  { id: 'condo_comms', from: '@app' },
  { id: 'condo_portal', from: '@app' },

  // Aika: Construction / Constructora vertical
  { id: 'const_projects', from: '@app' },
  { id: 'const_budget', from: '@app' },
  { id: 'const_schedule', from: '@app' },
  { id: 'const_progress', from: '@app' },
  { id: 'const_rfis', from: '@app' },
  { id: 'const_daily', from: '@app' },
  { id: 'const_subcon', from: '@app' },
  { id: 'const_materials', from: '@app' },

  // Aika: Academy / Academias y Centros de Formación vertical (Phase 20)
  { id: 'academy_courses', from: '@app' },
  { id: 'academy_instructors', from: '@app' },
  { id: 'academy_groups', from: '@app' },
  { id: 'academy_sessions', from: '@app' },
  { id: 'academy_enrollments', from: '@app' },
  { id: 'academy_attendance', from: '@app' },
  { id: 'academy_payments', from: '@app' },
  { id: 'academy_certificates', from: '@app' },
  { id: 'academy_portal', from: '@app' },

  // Aika: ISP / Telecomunicaciones vertical (Phase 22-A + 22-B)
  { id: 'isp_plans', from: '@app' },       // Catálogo de planes de servicio
  { id: 'isp_network', from: '@app' },     // Infraestructura: nodos, CPE, segmentos
  { id: 'isp_subscribers', from: '@app' }, // Abonados: lifecycle, plan, ubicación, corte
  { id: 'isp_billing', from: '@app' },     // Facturación recurrente: facturas, cobros, morosos
  { id: 'isp_support', from: '@app' },     // Tickets de soporte + averías masivas
  { id: 'isp_technicians', from: '@app' }, // Técnicos de campo + órdenes de trabajo
  { id: 'isp_sales', from: '@app' },       // Pipeline comercial + cobertura + comisiones
  { id: 'isp_portal', from: '@app' },      // Portal de autogestión del abonado

  // Aika: Manufactura Industrial vertical (Phase 24)
  // Sprint A — Núcleo productivo
  { id: 'mfg_bom', from: '@app' },         // Bill of Materials multinivel + versiones + alternativos
  { id: 'mfg_inventory', from: '@app' },   // Almacén 4-tier MP/WIP/empaque/PT + lotes FEFO
  { id: 'mfg_orders', from: '@app' },      // Órdenes de producción + routing + AI Agent
  { id: 'mfg_quality', from: '@app' },     // Control de calidad industrial + SPC + NCs
  // Sprint B — Inteligencia productiva
  { id: 'mfg_mrp', from: '@app' },         // Motor MRP con lead times de importación venezolanos
  { id: 'mfg_floor', from: '@app' },       // Piso de planta MES: OEE, paros eléctricos vs. internos
  { id: 'mfg_planning', from: '@app' },    // MPS: capacidad vs. demanda + ventanas energéticas
  { id: 'mfg_costs', from: '@app' },       // Contabilidad de costos bimoneda + variaciones
  // Sprint C — Operaciones completas
  { id: 'mfg_maintenance', from: '@app' }, // GMAO: preventivo + correctivo + repuestos críticos
  { id: 'mfg_procurement', from: '@app' }, // Compras industriales + importaciones + costo CIF
  { id: 'mfg_subcontract', from: '@app' }, // Maquila y subcontratación con control de merma
  { id: 'mfg_energy', from: '@app' },      // Energía eléctrica: consumo, cortes CORPOELEC, planificación
  // Sprint D — Capa comercial e inteligencia
  { id: 'mfg_dispatch', from: '@app' },    // Despacho PT: lotes reservados + Certificate of Analysis
  { id: 'mfg_hr', from: '@app' },          // RRHH manufactura: turnos + HH por orden + bonos
  { id: 'mfg_reports', from: '@app' },     // KPI Dashboard + AI Agent Director de Producción
  { id: 'mfg_portal', from: '@app' },      // Portal cliente industrial: pedidos + CoA + facturas
]

if (enabledModules.some((entry) => entry.id === 'example')) {
  enabledModules.push({ id: 'example_customers_sync', from: '@app' })
}

const enterpriseModulesEnabled = parseBooleanWithDefault(process.env.OM_ENABLE_ENTERPRISE_MODULES, false)
const enterpriseSsoEnabled = parseBooleanWithDefault(process.env.OM_ENABLE_ENTERPRISE_MODULES_SSO, false)
const enterpriseSecurityEnabled = parseBooleanWithDefault(process.env.OM_ENABLE_ENTERPRISE_MODULES_SECURITY, false)

if (enterpriseModulesEnabled) {
  enabledModules.push(
    { id: 'record_locks', from: '@open-mercato/enterprise' },
    { id: 'system_status_overlays', from: '@open-mercato/enterprise' },
  )
}

if (enterpriseModulesEnabled && enterpriseSsoEnabled) {
  enabledModules.push({ id: 'sso', from: '@open-mercato/enterprise' })
}

if (enterpriseModulesEnabled && enterpriseSecurityEnabled) {
  enabledModules.push({ id: 'security', from: '@open-mercato/enterprise' })
}
