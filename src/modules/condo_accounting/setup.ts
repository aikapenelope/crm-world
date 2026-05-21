import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_accounting.*'],
    employee: ['condo_accounting.view'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/gasto-extraordinario.json', import.meta.url),
    )
  },
}

export default setup
