/**
 * auto_reports — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'auto_reports.report.ready',
    module: 'auto_reports',
    titleKey: 'auto_reports.notif.report_ready.title',
    bodyKey: 'auto_reports.notif.report_ready.body',
    icon: 'bar-chart-2',
    severity: 'info',
    actions: [],
    linkHref: '/backend/auto-reports',
  },

export default notificationTypes
