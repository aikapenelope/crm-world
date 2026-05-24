/**
 * market_intelligence — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'market_intelligence.analysis.completed',
    module: 'market_intelligence',
    titleKey: 'market_intelligence.notif.analysis_completed.title',
    bodyKey: 'market_intelligence.notif.analysis_completed.body',
    icon: 'bar-chart-2',
    severity: 'info',
    actions: [],
    linkHref: '/backend/market-intelligence',
  },
]

export default notificationTypes
