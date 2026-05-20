export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_loyalty.view'],
  pageTitle: 'Miembros',
  pageTitleKey: 'retail_loyalty.nav.members',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Fidelización', labelKey: 'retail_loyalty.nav.title', href: '/backend/retail_loyalty' },
    { label: 'Miembros', labelKey: 'retail_loyalty.nav.members' },
  ],
}
