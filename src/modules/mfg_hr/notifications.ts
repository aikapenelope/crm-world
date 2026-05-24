import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_hr.bonus_approved', module: 'mfg_hr', titleKey: 'mfg_hr.notif.bonus_approved.title', bodyKey: 'mfg_hr.notif.bonus_approved.body', icon: 'award', severity: 'success', actions: [], linkHref: '/backend/mfg-hr' },
]
export default notificationTypes
