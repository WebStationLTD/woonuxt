/**
 * Proxy за Pazaruvaj.bg Product Feed
 * URL: https://leaderfitness.net/feed/pazaruvaj.xml
 * 
 * Взима feed-а от WordPress backend и автоматично фиксва Product URLs
 */
export default defineEventHandler(async (event) => {
  try {
    // Fetch feed-а от WordPress backend
    const response = await fetch(
      'https://admin.leaderfitness.net/wp-content/uploads/woo-feed/custom/xml/feed-for-pazaruvaj-com.xml',
      {
        headers: {
          'User-Agent': 'LeaderFitness-FeedProxy/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.status}`);
    }

    let xml = await response.text();

    // Fix САМО Product URLs, запазваме Image URLs на admin subdomain
    xml = xml.replace(
      /<ProductUrl>https:\/\/admin\.leaderfitness\.net\/produkt\//gi,
      '<ProductUrl>https://leaderfitness.net/produkt/'
    );

    // Set правилни XML headers
    setHeader(event, 'Content-Type', 'application/xml; charset=UTF-8');
    setHeader(event, 'Cache-Control', 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=3600'); // Кеш 2 часа, stale-while-revalidate 1 час
    
    // SEO: Блокираме индексиране от търсачки
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    
    setHeader(event, 'X-Feed-Source', 'wordpress-proxy');

    return xml;
  } catch (error) {
    console.error('Feed proxy error:', error);
    
    setResponseStatus(event, 503);
    setHeader(event, 'Content-Type', 'application/xml; charset=UTF-8');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Feed temporarily unavailable</message>
  <details>${error.message || 'Unknown error'}</details>
</error>`;
  }
});

