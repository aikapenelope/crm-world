import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type PipelineSummarySettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<PipelineSummarySettings> = {
  metadata: {
    id: 'properties.dashboard.pipeline_summary',
    title: 'Pipeline inmobiliario',
    description: 'Valor total del inventario activo y reservado, con conteo por operación.',
    features: ['dashboards.view', 'properties.view'],
    defaultSize: 'lg',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
    icon: 'trending-up',
    category: 'real-estate',
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ showValue: value.showValue }),
}

export default widget
