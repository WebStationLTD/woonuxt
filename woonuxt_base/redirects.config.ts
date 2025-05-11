export default [
  // Редиректи от стари към нови URL-и
  { from: '/product/:slug', to: '/produkt/:slug', statusCode: 301 },
  { from: '/product-category/:slug', to: '/produkt-kategoriya/:slug', statusCode: 301 },
  { from: '/product-category/:slug/page/:page', to: '/produkt-kategoriya/:slug/page/:page', statusCode: 301 },
];
