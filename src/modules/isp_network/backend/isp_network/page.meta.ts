import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('circle', { cx: 12, cy: 12, r: 2 }),
  React.createElement('path', { d: 'M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_network.view'],
  pageTitle: 'Infraestructura',
  pageTitleKey: 'isp_network.nav.nodes',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 20,
  icon,
}
