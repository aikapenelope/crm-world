import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: { admin: ['mfg_procurement.*'], employee: ['mfg_procurement.view', 'mfg_procurement.track'] },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Autorización de OC de Importación
    // Comprador propone con CIF completo → Gerente General aprueba antes de comprometer divisas.
    // Crítico en Venezuela: cada importación compromete divisas escasas.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/purchase-authorization-v1.json', import.meta.url),
    )
  },
}
export default setup
