/**
 * isp_technicians — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_technicians.work_order.assigned',
    module: 'isp_technicians',
    titleKey: 'isp_technicians.notif.work_order_assigned.title',
    bodyKey: 'isp_technicians.notif.work_order_assigned.body',
    icon: 'user-check',
    severity: 'info',
    actions: [],
    linkHref: '/backend/isp-technicians/work-orders',
  },
  {
    type: 'isp_technicians.work_order.completed',
    module: 'isp_technicians',
    titleKey: 'isp_technicians.notif.work_order_completed.title',
    bodyKey: 'isp_technicians.notif.work_order_completed.body',
    icon: 'check-circle',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-technicians/work-orders',
  },
  {
    type: 'isp_technicians.installation.done',
    module: 'isp_technicians',
    titleKey: 'isp_technicians.notif.installation_done.title',
    bodyKey: 'isp_technicians.notif.installation_done.body',
    icon: 'zap',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-technicians/work-orders',
  },

export default notificationTypes
