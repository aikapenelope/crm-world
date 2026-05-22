/**
 * ve_tax_reports — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 've_tax_reports.report.generated',
    module: 've_tax_reports',
    titleKey: 've_tax_reports.notif.report_generated.title',
    bodyKey: 've_tax_reports.notif.report_generated.body',
    icon: 'file-text',
    severity: 'info',
    actions: [],
    linkHref: '/backend/ve-tax-reports',
  },

export default notificationTypes
