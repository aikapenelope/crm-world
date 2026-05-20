import React from 'react'

const withholdingsIcon = React.createElement(
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
  // Receipt icon (lucide "receipt")
  React.createElement('path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }),
  React.createElement('path', { d: 'M14 8H8' }),
  React.createElement('path', { d: 'M16 12H8' }),
  React.createElement('path', { d: 'M13 16H8' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['ve_withholdings.view'],
  pageTitle: 'Retenciones',
  pageTitleKey: 've_withholdings.nav.title',
  icon: withholdingsIcon,
  pageGroup: 'Fiscal',
  pageGroupKey: 'fiscal',
  pageOrder: 20,
}
