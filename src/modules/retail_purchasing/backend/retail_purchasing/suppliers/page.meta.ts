export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.suppliers'],
  pageTitle: 'Proveedores',
  pageTitleKey: 'retail_purchasing.nav.suppliers',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Proveedores', labelKey: 'retail_purchasing.nav.suppliers' },
  ],
}
