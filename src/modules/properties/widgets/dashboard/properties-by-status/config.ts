export type PropertiesByStatusSettings = {
  showInactive: boolean
}

export const DEFAULT_SETTINGS: PropertiesByStatusSettings = {
  showInactive: false,
}

export function hydrateSettings(raw: unknown): PropertiesByStatusSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<PropertiesByStatusSettings>
  return {
    showInactive: data.showInactive ?? DEFAULT_SETTINGS.showInactive,
  }
}
