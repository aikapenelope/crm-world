import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['enrollment.*'],
    employee: ['enrollment.view', 'enrollment.manage_applications', 'enrollment.manage_documents'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/inscripcion-escolar.json', import.meta.url),
    )
  },
}

export default setup
