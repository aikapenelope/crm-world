import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import { despachoSanitario as despachoDef } from '@/lib/workflows/definitions'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_processing.*'],
    employee: ['agri_processing.view', 'agri_processing.create', 'agri_processing.edit'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Despacho Sanitario
    // Jefe de calidad firma antes de despachar un lote beneficiado.
    // 3 outcomes: aprobado / en espera / rechazado.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      despachoDef,
    )
  },
}

export default setup
