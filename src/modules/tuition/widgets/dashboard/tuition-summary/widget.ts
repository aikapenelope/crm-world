import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type TuitionSummarySettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<TuitionSummarySettings> = {
  metadata: {
    id: 'tuition.dashboard.tuition_summary',
    title: 'Resumen de Cobros',
    description: 'Cobrado vs pendiente vs moroso del mes actual.',
    features: ['dashboards.view', 'tuition.view'],
    defaultSize: 'md',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ ...value }),
}

export default widget
