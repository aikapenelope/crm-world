export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_inventory.count'],
  pageTitle: 'Conteos',
  pageTitleKey: 'retail_inventory.nav.counts',
  navHidden: true,
  breadcrumb: [
    { label: 'Inventario Retail', labelKey: 'retail_inventory.nav.title', href: '/backend/retail_inventory' },
    { label: 'Conteos', labelKey: 'retail_inventory.nav.counts' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 210,
}