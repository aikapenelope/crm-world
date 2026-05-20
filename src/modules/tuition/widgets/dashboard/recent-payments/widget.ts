import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type RecentPaymentsSettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<RecentPaymentsSettings> = {
  metadata: {
    id: 'tuition.dashboard.recent_payments',
    title: 'Pagos Recientes',
    description: 'Últimos pagos registrados con método y monto.',
    features: ['dashboards.view', 'tuition.view'],
    defaultSize: 'sm',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ ...value }),
}

export default widget
