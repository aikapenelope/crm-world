import React from 'react'

const commsIcon = React.createElement(
  'svg',
  {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  // Megaphone icon
  React.createElement('path', { d: 'm3 11 18-5v12L3 13v-2z' }),
  React.createElement('path', { d: 'M11.6 16.8a3 3 0 1 1-5.8-1.6' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['condo_comms.view'],
  pageTitle: 'Comunicaciones',
  pageTitleKey: 'condo_comms.nav.title',
  icon: commsIcon,
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  pageOrder: 60,
}
