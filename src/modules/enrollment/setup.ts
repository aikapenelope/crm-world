import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import { inscripcionEscolar as inscripcionDef } from '@/lib/workflows/definitions'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['enrollment.*'],
    employee: ['enrollment.view', 'enrollment.manage_applications', 'enrollment.manage_documents'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Inscripción Escolar
    // Comité de admisiones revisa documentos y cupo → aprueba / lista de espera / rechaza
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      inscripcionDef,
    )
  },
}

export default setup
