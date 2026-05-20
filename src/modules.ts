// Central place to enable modules and their source.
// Configured for: Aika Real Estate CRM (Venezuela)
// Only modules relevant to real estate operations are enabled.
import { parseBooleanWithDefault } from '@open-mercato/shared/lib/boolean'
import type { ModuleOverrides } from '@open-mercato/shared/modules/overrides'

export type ModuleEntry = {
  id: string
  from?: '@open-mercato/core' | '@app' | string
  overrides?: ModuleOverrides
}

export const enabledModules: ModuleEntry[] = [
  // --- Core platform (required) ---
  { id: 'dashboards', from: '@open-mercato/core' },
  { id: 'auth', from: '@open-mercato/core' },
  { id: 'directory', from: '@open-mercato/core' },
  { id: 'configs', from: '@open-mercato/core' },
  { id: 'query_index', from: '@open-mercato/core' },
  { id: 'audit_logs', from: '@open-mercato/core' },
  { id: 'entities', from: '@open-mercato/core' },
  { id: 'perspectives', from: '@open-mercato/core' },
  { id: 'api_keys', from: '@open-mercato/core' },
  { id: 'api_docs', from: '@open-mercato/core' },
  { id: 'events', from: '@open-mercato/events' },
  { id: 'translations', from: '@open-mercato/core' },
  { id: 'progress', from: '@open-mercato/core' },

  // --- CRM (contacts, deals, pipeline) ---
  { id: 'customers', from: '@open-mercato/core' },
  { id: 'attachments', from: '@open-mercato/core' },
  { id: 'dictionaries', from: '@open-mercato/core' },

  // --- Productivity ---
  { id: 'planner', from: '@open-mercato/core' },
  { id: 'notifications', from: '@open-mercato/core' },
  { id: 'search', from: '@open-mercato/search' },
  { id: 'currencies', from: '@open-mercato/core' },
  { id: 'scheduler', from: '@open-mercato/scheduler' },
  { id: 'workflows', from: '@open-mercato/core' },
  { id: 'messages', from: '@open-mercato/core' },

  // --- AI Assistant ---
  { id: 'ai_assistant', from: '@open-mercato/ai-assistant' },

  // --- Aika: Regional modules (Venezuela) ---
  { id: 'venezuela_rates', from: '@app' },
  { id: 'payment_methods', from: '@app' },
  { id: 've_fiscal', from: '@app' },
  { id: 've_tenant_defaults', from: '@app' },

  // --- Aika: Real Estate vertical ---
  { id: 'properties', from: '@app' },
  { id: 'transactions', from: '@app' },
  { id: 'matching', from: '@app' },
  { id: 'property_portal', from: '@app' },
  { id: 'property_docs', from: '@app' },
  { id: 'property_publishing', from: '@app' },
  { id: 'mercadolibre_sync', from: '@app' },
  { id: 'market_intelligence', from: '@app' },
]

// Enterprise modules (disabled by default)
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
