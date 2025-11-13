/**
 * App configuration.
 * This file is used to configure the app settings.
 * Below are the default values.
 */
export default defineAppConfig({
  siteName: 'Leaderfitness',
  shortDescription: 'Leaderfitness - Онлайн магазин за професионално спортно оборудване и фитнес уреди с високо качество и конкурентни цени.',
  description: `Leaderfitness предлага широка гама от професионално спортно оборудване, фитнес уреди, бойни спортове екипировка и аксесоари. Високо качество, конкурентни цени и бърза доставка в цялата страна.`,
  baseUrl: 'https://leaderfitness.net',
  siteImage: 'https://user-images.githubusercontent.com/5116925/218879668-f4c1f9fd-bef4-44b0-bc7f-e87d994aa3a1.png',
  storeSettings: {
    autoOpenCart: false,
    showReviews: true,
    showFilters: true,
    showOrderByDropdown: true,
    showSKU: true,
    showRelatedProducts: true,
    showProductCategoriesOnSingleProduct: true,
    showBreadcrumbOnSingleProduct: true,
    showMoveToWishlist: true,
    hideBillingAddressForVirtualProducts: false,
    initStoreOnUserActionToReduceServerLoad: true,
    saleBadge: 'percent', // 'percent', 'onSale' or 'hidden'
    socialLoginsDisplay: 'buttons', // 'buttons' or 'icons'
  },
});
