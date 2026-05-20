export type TuitionSummarySettings = {
  showOverdueOnly: boolean
}

export const DEFAULT_SETTINGS: TuitionSummarySettings = {
  showOverdueOnly: false,
}

export function hydrateSettings(raw: unknown): TuitionSummarySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<TuitionSummarySettings>
  return {
    showOverdueOnly: data.showOverdueOnly ?? DEFAULT_SETTINGS.showOverdueOnly,
  }
}
