export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.env.SSR) {
    const { storeSettings } = useAppConfig();
    const { clearAllCookies, clearAllLocalStorage, getDomain } = useHelpers();
    const sessionToken = useCookie('woocommerce-session', { domain: getDomain(window.location.href) });
    if (sessionToken.value) useGqlHeaders({ 'woocommerce-session': `Session ${sessionToken.value}` });

    // Wait for the user to interact with the page before refreshing the cart, this is helpful to prevent excessive requests to the server
    let initialised = false;
    const eventsToFireOn = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click', 'resize', 'mousemove', 'mouseover'];

    async function initStore() {
      if (initialised) {
        // We only want to execute this code block once, so we return if initialised is truthy and remove the event listeners
        eventsToFireOn.forEach((event) => {
          window.removeEventListener(event, initStore);
        });
        return;
      }

      initialised = true;

      const { refreshCart } = useCart();
      const success: boolean = await refreshCart();

      useGqlError((err: any) => {
        const serverErrors = ['The iss do not match with this server', 'Invalid session token'];
        if (serverErrors.includes(err?.gqlErrors?.[0]?.message)) {
          clearAllCookies();
          clearAllLocalStorage();
          window.location.reload();
        }
      });

      if (!success) {
        clearAllCookies();
        clearAllLocalStorage();

        // Add a new cookie to prevent infinite reloads
        const reloadCount = useCookie('reloadCount');
        if (!reloadCount.value) {
          reloadCount.value = '1';
        } else {
          return;
        }

        // Log out the user
        const { logoutUser } = useAuth();
        await logoutUser();

        if (!reloadCount.value) window.location.reload();
      }
    }

    // If we are in development mode, we want to initialise the store immediately
    const isDev = process.env.NODE_ENV === 'development';

    // ⚡ ФАЗА 1.3: РАЗШИРЕНА SKIP LIST - повече страници които НЕ се нуждаят от cart веднага
    // Check if the current route path is one of the pages that need immediate initialization
    const pagesToInitializeRightAway = ['/checkout', '/my-account', '/order-summary'];
    const isPathThatRequiresInit = pagesToInitializeRightAway.some((page) => useRoute().path.includes(page));
    
    // Страници които НЕ се нуждаят от cart при първоначално зареждане
    // (cart ще се зареди при първа потребителска интеракция)
    const pagesToSkipInitialization = [
      '/produkt-kategoriya/', // Всички категории
      '/magazin',             // Главен магазин
      '/marka-produkt/',      // Всички марки
      '/produkt-etiket/',     // Всички етикети
    ];
    const shouldSkipInit = pagesToSkipInitialization.some((page) => useRoute().path.includes(page));

    // ⚡ ФАЗА 1.3: Подобрена логика - skip init за определени страници дори в dev mode
    const shouldInit = (isDev && !shouldSkipInit) || isPathThatRequiresInit || !storeSettings.initStoreOnUserActionToReduceServerLoad;

    if (shouldInit) {
      initStore();
    } else {
      // Отлагаме инициализацията до първа потребителска интеракция
      console.log('⏳ Cart init deferred until user interaction (PHASE 1.3 optimization)');
      eventsToFireOn.forEach((event) => {
        window.addEventListener(event, initStore, { once: true });
      });
    }
  }
});
