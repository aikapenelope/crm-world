import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_loyalty',
  events: [
    { id: 'retail_loyalty.points.earned', label: 'Puntos acumulados', entity: 'account', category: 'lifecycle' },
    { id: 'retail_loyalty.points.redeemed', label: 'Puntos canjeados', entity: 'account', category: 'lifecycle' },
    { id: 'retail_loyalty.tier.upgraded', label: 'Nivel ascendido', entity: 'account', category: 'lifecycle' },
    { id: 'retail_loyalty.campaign.sent', label: 'Campaña enviada', entity: 'campaign', category: 'lifecycle' },
  ],
} as const)
