export type RecentPaymentsSettings = { limit: number }
export const DEFAULT_SETTINGS: RecentPaymentsSettings = { limit: 5 }
export function hydrateSettings(raw: unknown): RecentPaymentsSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<RecentPaymentsSettings>
  return { limit: data.limit ?? DEFAULT_SETTINGS.limit }
}
