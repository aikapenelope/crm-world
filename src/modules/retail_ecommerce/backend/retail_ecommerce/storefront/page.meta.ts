export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_ecommerce.config'],
  pageTitle: 'Configurar Tienda',
  pageTitleKey: 'retail_ecommerce.nav.storefront',
  navHidden: true,
  breadcrumb: [
    { label: 'E-commerce', labelKey: 'retail_ecommerce.nav.title', href: '/backend/retail_ecommerce' },
    { label: 'Configurar', labelKey: 'retail_ecommerce.nav.storefront' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 210,
}