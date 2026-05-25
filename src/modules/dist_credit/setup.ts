import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import { limiteCreditoApproval as limiteCreditoDef } from '@/lib/workflows/definitions'

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
      limiteCreditoDef,
    )
  },
}

export default setup
