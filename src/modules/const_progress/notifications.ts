/**
 * const_progress — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'const_progress.valuation_submitted',
    module: 'const_progress',
    titleKey: 'const_progress.notif.valuation_submitted.title',
    bodyKey: 'const_progress.notif.valuation_submitted.body',
    icon: 'send',
    severity: 'info',
    actions: [],
    linkHref: '/backend/const-progress',
  },
  {
    type: 'const_progress.valuation_approved',
    module: 'const_progress',
    titleKey: 'const_progress.notif.valuation_approved.title',
    bodyKey: 'const_progress.notif.valuation_approved.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/const-progress',
  },
]

export default notificationTypes
