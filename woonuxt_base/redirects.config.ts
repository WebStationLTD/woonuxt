export default [
  // Редиректи от стари към нови URL-и
  { from: '/product/:slug', to: '/produkt/:slug', statusCode: 301 },
  { from: '/products', to: '/magazin', statusCode: 301 },
  { from: '/products/page/:page', to: '/magazin/page/:page', statusCode: 301 },
  
  // Редирект от стара категория "фитнес-уреди" към начална страница
  { from: '/фитнес-уреди', to: '/', statusCode: 301 },
  { from: '/фитнес-уреди/', to: '/', statusCode: 301 },
];
