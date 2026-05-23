import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['dist_credit.*'],
    employee: ['dist_credit.view', 'dist_credit.view_aging', 'dist_credit.cobro'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Límite de Crédito
    // Agente solicita aumento → gerencia financiera aprueba/condiciona/rechaza
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/limite-credito-approval.json', import.meta.url),
    )
  },
}

export default setup
