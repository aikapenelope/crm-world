import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('rect', { x: 2, y: 7, width: 20, height: 14, rx: 2 }),
  React.createElement('path', { d: 'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' }),
  React.createElement('line', { x1: 12, y1: 12, x2: 12, y2: 16 }),
  React.createElement('line', { x1: 10, y1: 14, x2: 14, y2: 14 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_orders.view'],
  pageTitle: 'Órdenes de Producción',
  pageTitleKey: 'mfg_orders.nav.title',
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  pageOrder: 30,
  icon,
}
