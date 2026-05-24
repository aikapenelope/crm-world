/**
 * emitLifecycle — Utility for emitting clientBroadcast lifecycle events
 * from custom API route handlers and workers.
 *
 * Background
 * ----------
 * Open Mercato's `makeCrudRoute` automatically emits CRUD events
 * (entity.created, entity.updated, entity.deleted) via the event bus.
 * However, custom routes that use Kysely directly — such as payment
 * registration, valuation approval, or vote casting — must emit their
 * lifecycle events explicitly.
 *
 * If the event has `clientBroadcast: true` in its EventDefinition, the
 * framework SSE endpoint (/api/events/stream) will push it to every
 * browser connection scoped to the same tenantId + organizationId.
 * The browser reacts via `useAppEvent('module.event', handler)` —
 * no polling required.
 *
 * Usage
 * -----
 * ```typescript
 * import { emitLifecycle } from '@/lib/emit-lifecycle'
 * import { eventsConfig } from '../../events'
 *
 * // Inside a custom POST/PUT handler, after the DB mutation succeeds:
 * await emitLifecycle(eventsConfig, 'condo_fees.receipt.paid', scope, {
 *   id: receipt_id,
 * })
 * ```
 *
 * Convention
 * ----------
 * - Always call AFTER the DB write is committed (Kysely execute() resolves).
 * - Never call inside a try/catch that swallows emit errors silently —
 *   let the caller decide whether a failed emit is fatal.
 * - Pass the minimal payload: tenantId + organizationId (from scope) +
 *   the entity id. Extra fields are fine but keep payloads under 4 KB
 *   (SSE hard limit per event).
 * - For workers, pass tenantId + organizationId from the job payload.
 *
 * Tenant scoping
 * --------------
 * The SSE endpoint filters by tenantId BEFORE pushing to the browser.
 * A user on Tenant A never sees events from Tenant B, even if both
 * have the same browser open. No extra work needed for multi-tenancy.
 *
 * Customisation per tenant
 * ------------------------
 * Tenants cannot override which events fire (that's code). They CAN
 * control the UI reaction: each page component decides independently
 * which events it listens to via useAppEvent(). A specific tenant's
 * custom page can listen to any subset of events, or ignore them all.
 * See docs/REALTIME.md for the full catalogue and UI integration guide.
 */

/**
 * Minimal scope object — every authenticated request has this available
 * as `ctx.scope` in Open Mercato route handlers.
 */
export interface LifecycleScope {
  tenantId: string
  organizationId: string
}

/**
 * EventsConfig shape returned by `createModuleEvents()`.
 * Using a minimal interface so this helper stays import-free of domain modules.
 */
export interface ModuleEventsConfig {
  emit: (
    eventId: string,
    payload: Record<string, unknown>,
    options?: { persistent?: boolean },
  ) => Promise<void>
}

/**
 * Emit a lifecycle event from a custom route handler or background worker.
 *
 * @param eventsConfig  The module's `eventsConfig` export from `events.ts`
 * @param eventId       The declared event id (must exist in the module's events array)
 * @param scope         Tenant + organization scope (ctx.scope in route handlers)
 * @param extra         Optional additional payload fields (entity id, status, etc.)
 */
export async function emitLifecycle(
  eventsConfig: ModuleEventsConfig,
  eventId: string,
  scope: LifecycleScope,
  extra?: Record<string, unknown>,
): Promise<void> {
  await eventsConfig.emit(eventId, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    ...extra,
  })
}

/**
 * Build a LifecycleScope from a raw ctx object (Open Mercato route context).
 * Convenience wrapper so callers don't need to destructure ctx.scope manually.
 */
export function scopeFromCtx(ctx: { scope: LifecycleScope }): LifecycleScope {
  return { tenantId: ctx.scope.tenantId, organizationId: ctx.scope.organizationId }
}
