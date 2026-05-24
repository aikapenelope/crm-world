/**
 * ve_withholdings — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 've_withholdings.record.declared',
    module: 've_withholdings',
    titleKey: 've_withholdings.notif.declared.title',
    bodyKey: 've_withholdings.notif.declared.body',
    icon: 'file-check',
    severity: 'success',
    actions: [],
    linkHref: '/backend/ve-withholdings',
  },
]

export default notificationTypes
