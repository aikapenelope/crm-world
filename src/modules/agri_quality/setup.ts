import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_quality.*'],
    employee: ['agri_quality.view', 'agri_quality.create'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: No-Conformidad Crítica de PCC
    // Desviación de PCC → investigación de causa raíz → decisión del gerente de calidad
    // (retrabajo / destrucción / liberar con excepción / cuarentena)
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/no-conformidad-ccp.json', import.meta.url),
    )
  },
}

export default setup
