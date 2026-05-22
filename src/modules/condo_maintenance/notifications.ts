/**
 * condo_maintenance — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_maintenance.request_created',
    module: 'condo_maintenance',
    titleKey: 'condo_maintenance.notif.request_created.title',
    bodyKey: 'condo_maintenance.notif.request_created.body',
    icon: 'tool',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-maintenance',
  },
  {
    type: 'condo_maintenance.request_assigned',
    module: 'condo_maintenance',
    titleKey: 'condo_maintenance.notif.request_assigned.title',
    bodyKey: 'condo_maintenance.notif.request_assigned.body',
    icon: 'user-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-maintenance',
  },
  {
    type: 'condo_maintenance.request_completed',
    module: 'condo_maintenance',
    titleKey: 'condo_maintenance.notif.request_completed.title',
    bodyKey: 'condo_maintenance.notif.request_completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/condo-maintenance',
  },
  {
    type: 'condo_maintenance.emergency',
    module: 'condo_maintenance',
    titleKey: 'condo_maintenance.notif.emergency.title',
    bodyKey: 'condo_maintenance.notif.emergency.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/condo-maintenance',
  },
]

export default notificationTypes
