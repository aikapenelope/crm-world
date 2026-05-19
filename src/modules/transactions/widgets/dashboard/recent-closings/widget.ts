import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type RecentClosingsSettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<RecentClosingsSettings> = {
  metadata: {
    id: 'transactions.dashboard.recent_closings',
    title: 'Cierres recientes',
    description: 'Últimas transacciones completadas o pendientes de cierre.',
    features: ['dashboards.view', 'transactions.view'],
    defaultSize: 'md',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
    icon: 'handshake',
    category: 'real-estate',
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ pageSize: value.pageSize, showPending: value.showPending }),
}

export default widget
