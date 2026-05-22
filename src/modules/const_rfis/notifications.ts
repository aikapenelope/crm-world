/**
 * const_rfis — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_rfis.rfi_overdue',
    module: 'const_rfis',
    titleKey: 'const_rfis.notif.rfi_overdue.title',
    bodyKey: 'const_rfis.notif.rfi_overdue.body',
    icon: 'clock',
    severity: 'error',
    actions: [],
    linkHref: '/backend/const-rfis',
  },
  {
    type: 'const_rfis.rfi_answered',
    module: 'const_rfis',
    titleKey: 'const_rfis.notif.rfi_answered.title',
    bodyKey: 'const_rfis.notif.rfi_answered.body',
    icon: 'message-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-rfis',
  },
  {
    type: 'const_rfis.submittal_approved',
    module: 'const_rfis',
    titleKey: 'const_rfis.notif.submittal_approved.title',
    bodyKey: 'const_rfis.notif.submittal_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-rfis',
  },
]

export default notificationTypes
