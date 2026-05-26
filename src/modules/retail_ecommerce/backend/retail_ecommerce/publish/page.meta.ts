export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_ecommerce.publish'],
  pageTitle: 'Publicar en Redes',
  pageTitleKey: 'retail_ecommerce.nav.publish',
  navHidden: true,
  breadcrumb: [
    { label: 'E-commerce', labelKey: 'retail_ecommerce.nav.title', href: '/backend/retail_ecommerce' },
    { label: 'Publicar', labelKey: 'retail_ecommerce.nav.publish' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 220,
}