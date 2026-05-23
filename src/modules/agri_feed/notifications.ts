/**
 * agri_feed — Notification type definitions
 *
 * Schema: NotificationTypeDefinition from @open-mercato/shared/modules/notifications/types
 */
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'agri_feed.formula_cost_updated',
    module: 'agri_feed',
    titleKey: 'agri_feed.notif.formula_cost_updated.title',
    bodyKey: 'agri_feed.notif.formula_cost_updated.body',
    icon: 'refresh-cw',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-feed/formulas',
  },
  {
    type: 'agri_feed.batch_produced',
    module: 'agri_feed',
    titleKey: 'agri_feed.notif.batch_produced.title',
    bodyKey: 'agri_feed.notif.batch_produced.body',
    icon: 'package',
    severity: 'info',
    actions: [],
    linkHref: '/backend/agri-feed/batches',
  },
  {
    type: 'agri_feed.batch_rejected',
    module: 'agri_feed',
    titleKey: 'agri_feed.notif.batch_rejected.title',
    bodyKey: 'agri_feed.notif.batch_rejected.body',
    icon: 'x-circle',
    severity: 'error',
    actions: [],
    linkHref: '/backend/agri-feed/batches',
  },
  {
    type: 'agri_feed.stock_low',
    module: 'agri_feed',
    titleKey: 'agri_feed.notif.stock_low.title',
    bodyKey: 'agri_feed.notif.stock_low.body',
    icon: 'alert-triangle',
    severity: 'warning',
    actions: [],
    linkHref: '/backend/agri-feed/batches',
  },
]

export default notificationTypes
