/**
 * useWorkflowApproval — shared React hook for workflow approval widgets.
 *
 * Handles the full approval lifecycle on any entity detail page:
 * 1. Polls for an active workflow instance linked to the entity
 * 2. Fetches the pending USER_TASK if the instance is PAUSED
 * 3. Exposes `startWorkflow()` (manual trigger) and `submitDecision()` (approve/reject)
 *
 * Usage:
 *   const wf = useWorkflowApproval({
 *     workflowId: 'gasto_extraordinario_v1',
 *     entityId: entry.id,
 *     entityType: 'CondoAccountingEntry',
 *   })
 */
'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

export type WorkflowStatus =
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'WAITING_FOR_ACTIVITIES'

export type WorkflowInstance = {
  id: string
  workflowId: string
  status: WorkflowStatus
  currentStepId: string
  metadata: { entityId?: string; entityType?: string } | null
}

export type UserTask = {
  id: string
  taskName: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  workflowInstanceId: string
  claimedBy: string | null
  formSchema: Record<string, unknown> | null
  dueDate: string | null
}

export type WorkflowApprovalState = {
  // Current instance (null = no workflow running)
  instance: WorkflowInstance | null
  // Active pending task (null = no task waiting)
  pendingTask: UserTask | null
  // Loading + submitting flags
  isLoading: boolean
  isStarting: boolean
  isSubmitting: boolean
  // Error message
  error: string | null
  // Actions
  startWorkflow: (initialContext?: Record<string, unknown>) => Promise<void>
  submitDecision: (decision: string, comments?: string) => Promise<void>
  reload: () => void
}

export function useWorkflowApproval({
  workflowId,
  entityId,
  entityType,
}: {
  workflowId: string
  entityId: string | null | undefined
  entityType: string
}): WorkflowApprovalState {
  const [instance, setInstance] = React.useState<WorkflowInstance | null>(null)
  const [pendingTask, setPendingTask] = React.useState<UserTask | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isStarting, setIsStarting] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  // Load active instance + pending task
  React.useEffect(() => {
    if (!entityId) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      // 1. Find active instance for this entity
      const instancesRes = await apiCall<{ items: WorkflowInstance[] }>(
        `/api/workflows/instances?entityId=${entityId}&entityType=${entityType}&limit=1`,
        undefined,
        { fallback: { items: [] } },
      )
      const instances = instancesRes.result?.items ?? []
      // Prefer running/paused instance
      const active = instances.find(i =>
        ['RUNNING', 'PAUSED', 'WAITING_FOR_ACTIVITIES'].includes(i.status)
      ) ?? instances[0] ?? null

      if (cancelled) return
      setInstance(active)

      // 2. If paused (USER_TASK), find the pending task
      if (active && ['PAUSED', 'RUNNING'].includes(active.status)) {
        const tasksRes = await apiCall<{ items: UserTask[] }>(
          `/api/workflows/tasks?workflowInstanceId=${active.id}&status=PENDING&limit=1`,
          undefined,
          { fallback: { items: [] } },
        )
        const task = tasksRes.result?.items?.[0] ?? null
        if (!cancelled) setPendingTask(task)
      } else {
        if (!cancelled) setPendingTask(null)
      }

      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [entityId, entityType, tick])

  const reload = React.useCallback(() => setTick(t => t + 1), [])

  // Start a new workflow instance (manual trigger)
  const startWorkflow = React.useCallback(async (initialContext: Record<string, unknown> = {}) => {
    if (!entityId) return
    setIsStarting(true)
    setError(null)

    const res = await apiCall('/api/workflows/instances', {
      method: 'POST',
      body: JSON.stringify({
        workflowId,
        initialContext: { entityId, entityType, ...initialContext },
        metadata: { entityId, entityType },
      }),
    })

    if (!res.ok) {
      setError('Error al iniciar el flujo de aprobación.')
    }
    setIsStarting(false)
    reload()
  }, [entityId, entityType, workflowId, reload])

  // Submit a USER_TASK decision (approve / reject)
  const submitDecision = React.useCallback(async (decision: string, comments = '') => {
    if (!pendingTask) return
    setIsSubmitting(true)
    setError(null)

    // Claim the task first (if not already claimed)
    if (!pendingTask.claimedBy) {
      await apiCall(`/api/workflows/tasks/${pendingTask.id}/claim`, { method: 'POST' })
    }

    // Complete the task with the decision
    const res = await apiCall(`/api/workflows/tasks/${pendingTask.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ outputData: { decision, comments } }),
    })

    if (!res.ok) {
      setError('Error al enviar la decisión.')
    }
    setIsSubmitting(false)
    reload()
  }, [pendingTask, reload])

  return {
    instance,
    pendingTask,
    isLoading,
    isStarting,
    isSubmitting,
    error,
    startWorkflow,
    submitDecision,
    reload,
  }
}
