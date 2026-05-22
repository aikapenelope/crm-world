/**
 * attendance — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'attendance.report.generated',
    module: 'attendance',
    titleKey: 'attendance.notif.report_generated.title',
    bodyKey: 'attendance.notif.report_generated.body',
    icon: 'clipboard-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/attendance',
  },

export default notificationTypes
