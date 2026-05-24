/**
 * academy_certificates — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'academy_certificates.certificate.issued',
    module: 'academy_certificates',
    titleKey: 'academy_certificates.notif.certificate_issued.title',
    bodyKey: 'academy_certificates.notif.certificate_issued.body',
    icon: 'award',
    severity: 'success',
    actions: [],
    linkHref: '/backend/academy-certificates',
  },
]

export default notificationTypes
