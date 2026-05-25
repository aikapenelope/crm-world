/**
 * Workflow seed helper for Aika Platform custom modules.
 *
 * Mirrors the pattern in Open Mercato's packages/core/src/modules/workflows/lib/seeds.ts:
 * reads a workflow definition JSON and upserts the WorkflowDefinition entity
 * for the current tenant/org scope.
 *
 * Usage in a module's setup.ts:
 *
 *   import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
 *   import workflowDef from '../examples/my-workflow.json'
 *
 *   export const setup: ModuleSetupConfig = {
 *     seedDefaults: async (ctx) => {
 *       const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
 *       await seedModuleWorkflow(ctx.em, scope, workflowDef)
 *     },
 *   }
 */
import type { EntityManager } from '@mikro-orm/postgresql'

export type WorkflowSeedScope = {
  tenantId: string
  organizationId: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkflowDefinitionJson = Record<string, any>

/**
 * Seed a single workflow definition from a statically-imported JSON object.
 *
 * @param em    MikroORM EntityManager
 * @param scope Tenant + org scope
 * @param seed  Parsed workflow definition JSON — use `import def from '../examples/workflow.json'`
 */
export async function seedModuleWorkflow(
  em: EntityManager,
  scope: WorkflowSeedScope,
  seed: WorkflowDefinitionJson,
): Promise<void> {
  // Dynamically import WorkflowDefinition to avoid bundling OM internals at module load time
  const { WorkflowDefinition } = await import(
    '@open-mercato/core/modules/workflows/data/entities'
  )

  const workflowId: string = seed.workflowId
  if (!workflowId) {
    throw new Error(`[workflow-seed] Missing workflowId in workflow definition`)
  }

  const existing = await em.findOne(WorkflowDefinition, {
    workflowId,
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
  } as any)

  if (existing) {
    // Update if step/transition count changed (same heuristic as OM seeds.ts)
    const seedSteps = seed.definition?.steps?.length ?? 0
    const existingSteps = existing.definition?.steps?.length ?? 0
    const seedTransitions = seed.definition?.transitions?.length ?? 0
    const existingTransitions = existing.definition?.transitions?.length ?? 0

    if (seedSteps !== existingSteps || seedTransitions !== existingTransitions) {
      console.log(
        `[workflow-seed] Updating ${workflowId} (steps: ${existingSteps}→${seedSteps}, transitions: ${existingTransitions}→${seedTransitions})`,
      )
      ;(existing as any).definition = seed.definition
      ;(existing as any).workflowName = seed.workflowName ?? existing.workflowName
      ;(existing as any).description = seed.description ?? existing.description
      ;(existing as any).metadata = seed.metadata ?? existing.metadata
      ;(existing as any).updatedAt = new Date()
      await em.flush()
    }
    return
  }

  // Create new definition
  const now = new Date()
  const entity = em.create(WorkflowDefinition, {
    workflowId,
    workflowName: seed.workflowName ?? workflowId,
    description: seed.description ?? null,
    version: seed.version ?? 1,
    enabled: seed.enabled ?? true,
    definition: seed.definition,
    metadata: seed.metadata ?? null,
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    createdAt: now,
    updatedAt: now,
  } as any)

  em.persist(entity)
  await em.flush()
  console.log(`[workflow-seed] Seeded workflow: ${workflowId}`)
}
