/**
 * Dynamic robots.txt за SEO оптимизация
 * Блокира индексиране на feed-ове и технически endpoints
 */
export default defineEventHandler((event) => {
  const robotsTxt = `# LeaderFitness.net robots.txt

User-agent: *
Allow: /

# Блокираме feed-ове (само за external platforms като Pazaruvaj)
Disallow: /feed/
Disallow: /api/feed/

# Блокираме административни/технически endpoints
Disallow: /api/
Disallow: /_nuxt/

# Sitemap
Sitemap: https://leaderfitness.net/sitemap.xml
`;

  setHeader(event, 'Content-Type', 'text/plain; charset=UTF-8');
  setHeader(event, 'Cache-Control', 'public, max-age=86400'); // Кеш 24 часа

  return robotsTxt;
});

