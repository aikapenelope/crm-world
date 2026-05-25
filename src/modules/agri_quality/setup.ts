import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import ncCcpDef from '../examples/no-conformidad-ccp.json'

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
      ncCcpDef,
    )
  },
}

export default setup
