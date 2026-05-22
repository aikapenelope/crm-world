/**
 * condo_collections — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'condo_collections.debtor.detected',
    module: 'condo_collections',
    titleKey: 'condo_collections.notif.debtor_detected.title',
    bodyKey: 'condo_collections.notif.debtor_detected.body',
    icon: 'alert-circle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/condo-collections',
  },
  {
    type: 'condo_collections.agreement.defaulted',
    module: 'condo_collections',
    titleKey: 'condo_collections.notif.agreement_defaulted.title',
    bodyKey: 'condo_collections.notif.agreement_defaulted.body',
    icon: 'x-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/condo-collections',
  },

export default notificationTypes
