export type RecentClosingsSettings = {
  pageSize: number
  showPending: boolean
}

export const DEFAULT_SETTINGS: RecentClosingsSettings = {
  pageSize: 5,
  showPending: true,
}

export function hydrateSettings(raw: unknown): RecentClosingsSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<RecentClosingsSettings>
  const pageSize = Number(data.pageSize)
  return {
    pageSize: Number.isFinite(pageSize) && pageSize >= 1 && pageSize <= 20 ? Math.floor(pageSize) : DEFAULT_SETTINGS.pageSize,
    showPending: data.showPending ?? DEFAULT_SETTINGS.showPending,
  }
}
