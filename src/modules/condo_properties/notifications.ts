/**
 * condo_properties — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_properties.unit.owner_changed',
    module: 'condo_properties',
    titleKey: 'condo_properties.notif.owner_changed.title',
    bodyKey: 'condo_properties.notif.owner_changed.body',
    icon: 'home',
    severity: 'info',
    actions: [],
    linkHref: '/backend/condo-properties',
  },

export default notificationTypes
