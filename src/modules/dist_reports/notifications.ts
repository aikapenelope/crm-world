/**
 * dist_reports — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'dist_reports.report.ready',
    module: 'dist_reports',
    titleKey: 'dist_reports.notif.report_ready.title',
    bodyKey: 'dist_reports.notif.report_ready.body',
    icon: 'bar-chart-2',
    severity: 'info',
    actions: [],
    linkHref: '/backend/dist-reports',
  },

export default notificationTypes
