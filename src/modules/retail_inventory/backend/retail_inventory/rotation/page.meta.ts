export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_inventory.reports'],
  pageTitle: 'Rotación',
  pageTitleKey: 'retail_inventory.nav.rotation',
  navHidden: true,
  breadcrumb: [
    { label: 'Inventario Retail', labelKey: 'retail_inventory.nav.title', href: '/backend/retail_inventory' },
    { label: 'Rotación', labelKey: 'retail_inventory.nav.rotation' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 220,
}