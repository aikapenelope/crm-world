import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'
const icon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }))
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_energy.view'],
  pageTitle: 'Gestión de Energía', pageTitleKey: 'mfg_energy.nav.title',
  pageGroup: 'Manufactura', pageGroupKey: 'nav.group.mfg', pageOrder: 120, icon,
}
