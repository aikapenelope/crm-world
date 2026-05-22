/**
 * condo_comms — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 * Campos requeridos: type, module, titleKey, icon, severity, actions
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_comms.circular_published',
    module: 'condo_comms',
    titleKey: 'condo_comms.notif.circular_published.title',
    bodyKey: 'condo_comms.notif.circular_published.body',
    icon: 'mail',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-comms',
  },
  {
    type: 'condo_comms.vote_opened',
    module: 'condo_comms',
    titleKey: 'condo_comms.notif.vote_opened.title',
    bodyKey: 'condo_comms.notif.vote_opened.body',
    icon: 'vote',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-comms',
  },
  {
    type: 'condo_comms.vote_closing_soon',
    module: 'condo_comms',
    titleKey: 'condo_comms.notif.vote_closing_soon.title',
    bodyKey: 'condo_comms.notif.vote_closing_soon.body',
    icon: 'clock',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/condo-comms',
  },
  {
    type: 'condo_comms.assembly_scheduled',
    module: 'condo_comms',
    titleKey: 'condo_comms.notif.assembly_scheduled.title',
    bodyKey: 'condo_comms.notif.assembly_scheduled.body',
    icon: 'calendar',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-comms',
  },
]

export default notificationTypes
