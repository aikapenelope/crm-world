/**
 * const_daily — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_daily.incident_reported',
    module: 'const_daily',
    titleKey: 'const_daily.notif.incident_reported.title',
    bodyKey: 'const_daily.notif.incident_reported.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/const-daily',
  },
  {
    type: 'const_daily.report_approved',
    module: 'const_daily',
    titleKey: 'const_daily.notif.report_approved.title',
    bodyKey: 'const_daily.notif.report_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-daily',
  },
]

export default notificationTypes
