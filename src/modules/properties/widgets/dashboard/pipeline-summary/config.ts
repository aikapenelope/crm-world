export type PipelineSummarySettings = {
  showValue: boolean
}

export const DEFAULT_SETTINGS: PipelineSummarySettings = {
  showValue: true,
}

export function hydrateSettings(raw: unknown): PipelineSummarySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<PipelineSummarySettings>
  return {
    showValue: data.showValue ?? DEFAULT_SETTINGS.showValue,
  }
}
