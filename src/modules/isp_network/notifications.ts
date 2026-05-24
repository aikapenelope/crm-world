/**
 * isp_network — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 * Fuente oficial: packages/shared/src/modules/notifications/types.ts §58
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'isp_network.node.outage_reported',
    module: 'isp_network',
    titleKey: 'isp_network.notif.outage_reported.title',
    bodyKey: 'isp_network.notif.outage_reported.body',
    icon: 'wifi-off',
    severity: 'error',
    actions: [],
    linkHref: '/backend/isp-network',
  },
  {
    type: 'isp_network.node.restored',
    module: 'isp_network',
    titleKey: 'isp_network.notif.node_restored.title',
    bodyKey: 'isp_network.notif.node_restored.body',
    icon: 'wifi',
    severity: 'success',
    actions: [],
    linkHref: '/backend/isp-network',
  },
  {
    type: 'isp_network.node.capacity_alert',
    module: 'isp_network',
    titleKey: 'isp_network.notif.capacity_alert.title',
    bodyKey: 'isp_network.notif.capacity_alert.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/isp-network',
  },
]

export default notificationTypes
