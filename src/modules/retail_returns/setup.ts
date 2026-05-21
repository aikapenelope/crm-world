import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_returns.*'],
    employee: ['retail_returns.view', 'retail_returns.create'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/devolucion-fuera-politica.json', import.meta.url),
    )
  },
}

export default setup
