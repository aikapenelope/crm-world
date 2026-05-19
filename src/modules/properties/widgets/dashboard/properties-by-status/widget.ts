import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type PropertiesByStatusSettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<PropertiesByStatusSettings> = {
  metadata: {
    id: 'properties.dashboard.properties_by_status',
    title: 'Propiedades por estado',
    description: 'Resumen de propiedades agrupadas por estado (activa, reservada, vendida, etc.)',
    features: ['dashboards.view', 'properties.view'],
    defaultSize: 'md',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
    icon: 'building-2',
    category: 'real-estate',
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ showInactive: value.showInactive }),
}

export default widget
