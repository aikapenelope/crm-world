import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import ncDispositionDef from '../examples/nc-disposition-v1.json'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['mfg_quality.*'],
    employee: ['mfg_quality.view', 'mfg_quality.inspect'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Disposición de No-Conformidad
    // Especialista investiga causa raíz y propone disposición →
    // Gerente de calidad aprueba o rechaza la disposición del material.
    // Requerido por BPF/HACCP para NC críticas.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      ncDispositionDef,
    )
  },
}
export default setup
