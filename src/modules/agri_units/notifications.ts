/**
 * agri_units — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_units.flock_started',
    module: 'agri_units',
    titleKey: 'agri_units.notif.flock_started.title',
    bodyKey: 'agri_units.notif.flock_started.body',
    icon: 'egg',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-units/flocks',
  },
  {
    type: 'agri_units.weekly_recorded',
    module: 'agri_units',
    titleKey: 'agri_units.notif.weekly_recorded.title',
    bodyKey: 'agri_units.notif.weekly_recorded.body',
    icon: 'clipboard-list',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-units/flocks',
  },
  {
    type: 'agri_units.flock_completed',
    module: 'agri_units',
    titleKey: 'agri_units.notif.flock_completed.title',
    bodyKey: 'agri_units.notif.flock_completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/agri-units/flocks',
  },
  {
    type: 'agri_units.mortality_alert',
    module: 'agri_units',
    titleKey: 'agri_units.notif.mortality_alert.title',
    bodyKey: 'agri_units.notif.mortality_alert.body',
    icon: 'alert-triangle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-units/flocks',
  },
  {
    type: 'agri_units.weight_below_target',
    module: 'agri_units',
    titleKey: 'agri_units.notif.weight_below_target.title',
    bodyKey: 'agri_units.notif.weight_below_target.body',
    icon: 'trending-down',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-units/flocks',
  },
]

export default notificationTypes
