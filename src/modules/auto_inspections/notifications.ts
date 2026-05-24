/**
 * auto_inspections — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'auto_inspections.inspection.completed',
    module: 'auto_inspections',
    titleKey: 'auto_inspections.notif.completed.title',
    bodyKey: 'auto_inspections.notif.completed.body',
    icon: 'clipboard-check',
    severity: 'success',
    actions: [],
    linkHref: '/backend/auto-inspections',
  },
]

export default notificationTypes
