import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'
export const notificationTypes: NotificationTypeDefinition[] = [
  { type: 'mfg_energy.outage_started',  module: 'mfg_energy', titleKey: 'mfg_energy.notif.outage.title',    bodyKey: 'mfg_energy.notif.outage.body',    icon: 'zap-off',      severity: 'error',   actions: [], linkHref: '/backend/mfg-energy' },
  { type: 'mfg_energy.outage_ended',    module: 'mfg_energy', titleKey: 'mfg_energy.notif.restored.title',  bodyKey: 'mfg_energy.notif.restored.body',  icon: 'zap',          severity: 'success', actions: [], linkHref: '/backend/mfg-energy' },
  { type: 'mfg_energy.generator_on',    module: 'mfg_energy', titleKey: 'mfg_energy.notif.generator.title', bodyKey: 'mfg_energy.notif.generator.body', icon: 'battery-charging', severity: 'warning', actions: [], linkHref: '/backend/mfg-energy' },
]
export default notificationTypes
