import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['mfg_bom.*'],
    employee: ['mfg_bom.view'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Aprobación de Cambio de BOM
    // Ingeniero propone → gerente de ingeniería aprueba/rechaza.
    // Sin aprobación, la nueva versión no puede activarse para producción.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/bom-approval-v1.json', import.meta.url),
    )
  },
}
export default setup
