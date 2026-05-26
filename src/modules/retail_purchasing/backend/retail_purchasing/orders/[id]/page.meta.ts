export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.view'],
  pageTitle: 'Detalle Orden de Compra',
  navHidden: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Detalle' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
}