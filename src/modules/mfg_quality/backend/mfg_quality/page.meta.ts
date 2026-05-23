import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('polyline', { points: '9 11 12 14 22 4' }),
  React.createElement('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_quality.view'],
  pageTitle: 'Control de Calidad',
  pageTitleKey: 'mfg_quality.nav.title',
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  pageOrder: 40,
  icon,
}
