/**
 * school_docs — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'school_docs.document.generated',
    module: 'school_docs',
    titleKey: 'school_docs.notif.document_generated.title',
    bodyKey: 'school_docs.notif.document_generated.body',
    icon: 'file-text',
    severity: 'success',
    actions: [],
    linkHref: '/backend/school-docs',
  },
]

export default notificationTypes
