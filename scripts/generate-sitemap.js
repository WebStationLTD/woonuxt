const fs = require("fs");
const path = require("path");

// Конфигурация
const GRAPHQL_URL = "https://admin.leaderfitness.net/graphql";
const FRONTEND_URL = "https://leaderfitness.net";
const PRODUCT_CATEGORY_PERMALINK = "/produkt-kategoriya/";
const PRODUCT_TAG_PERMALINK = "/produkt-etiket/";
const PRODUCT_BRAND_PERMALINK = "/marka-produkt/";
const PRODUCT_PERMALINK = "/produkt/";
const BLOG_PERMALINK = "/blog/";

// Зареждане на GraphQL queries
const queriesPath = path.join(__dirname, "../woonuxt_base/app/queries");

function loadQuery(filename) {
  const filePath = path.join(queriesPath, filename);
  return fs.readFileSync(filePath, "utf8");
}

// КЛЮЧОВА ФУНКЦИЯ: Node.js fetch с Origin/Referer headers за заобикаляне на Headless WP блокирането
async function fetchGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${FRONTEND_URL}/`,
        Origin: FRONTEND_URL,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Error executing GraphQL query:", error.message);
    return null;
  }
}

// Fetch с pagination support
async function fetchAllPages(query, dataKey, first = 100) {
  const results = [];
  let hasNextPage = true;
  let endCursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`Fetching ${dataKey} page ${pageCount}...`);

    const data = await fetchGraphQL(query, { first, after: endCursor });

    if (!data || !data[dataKey]) {
      console.error(`No data returned for ${dataKey}`);
      break;
    }

    const nodes = data[dataKey].nodes || [];
    results.push(...nodes);

    hasNextPage = data[dataKey].pageInfo?.hasNextPage || false;
    endCursor = data[dataKey].pageInfo?.endCursor || null;

    console.log(
      `Fetched ${nodes.length} items (Total so far: ${results.length})`
    );

    if (!hasNextPage) {
      break;
    }
  }

  return results;
}

// URL encoder за кирилица - енкодва само не-ASCII символи, запазва протокол и домейн
function encodeURL(url) {
  // Разделяме на protocol://domain и path
  const urlParts = url.match(/^(https?:\/\/[^\/]+)(.*)$/);

  if (!urlParts) {
    return url; // Ако не е валиден URL, връщаме както е
  }

  const baseUrl = urlParts[1]; // https://leaderfitness.net
  const path = urlParts[2]; // /доставка или /produkt/slug

  // Енкодваме само path частта, сегмент по сегмент
  const encodedPath = path
    .split("/")
    .map((segment) => {
      // Празни сегменти или вече енкоднати - не пипаме
      if (!segment || segment.match(/%[0-9A-F]{2}/i)) {
        return segment;
      }

      // Проверяваме дали има кирилица или други non-ASCII символи
      if (/[^\x00-\x7F]/.test(segment)) {
        return encodeURIComponent(segment);
      }

      // ASCII сегменти остават както са
      return segment;
    })
    .join("/");

  return baseUrl + encodedPath;
}

// Генериране на sitemap URL entries
function generateURLEntry(
  loc,
  lastmod = null,
  changefreq = "weekly",
  priority = 0.8,
  images = []
) {
  const encodedLoc = encodeURL(loc);

  let entry = `  <url>\n`;
  entry += `    <loc>${encodedLoc}</loc>\n`;

  if (lastmod) {
    const date = new Date(lastmod);
    entry += `    <lastmod>${date.toISOString().split("T")[0]}</lastmod>\n`;
  }

  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;

  // Добавяне на image tags ако има
  if (images && images.length > 0) {
    images.forEach((img) => {
      if (img.sourceUrl) {
        entry += `    <image:image>\n`;
        entry += `      <image:loc>${img.sourceUrl}</image:loc>\n`;
        if (img.title) {
          entry += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
        }
        if (img.altText) {
          entry += `      <image:caption>${escapeXml(img.altText)}</image:caption>\n`;
        }
        entry += `    </image:image>\n`;
      }
    });
  }

  entry += `  </url>\n`;
  return entry;
}

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateSitemap() {
  console.log("🚀 Starting sitemap generation...\n");

  const urls = [];

  // 1. Статични страници
  console.log("📄 Adding static pages...");
  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "daily" },
    { url: "/magazin", priority: 0.9, changefreq: "daily" },
    { url: "/categories", priority: 0.8, changefreq: "weekly" },
    { url: "/etiketi", priority: 0.7, changefreq: "weekly" },
    { url: "/marki-produkti", priority: 0.7, changefreq: "weekly" },
    { url: "/blog", priority: 0.8, changefreq: "daily" },
    { url: "/contact", priority: 0.5, changefreq: "monthly" },
    { url: "/доставка", priority: 0.6, changefreq: "monthly" },
    { url: "/за-нас", priority: 0.6, changefreq: "monthly" },
    { url: "/общи-условия", priority: 0.5, changefreq: "monthly" },
    {
      url: "/политика-за-поверителност-и-защита-на",
      priority: 0.5,
      changefreq: "monthly",
    },
    { url: "/нови-продукти", priority: 0.7, changefreq: "daily" },
  ];

  staticPages.forEach((page) => {
    urls.push(
      generateURLEntry(
        `${FRONTEND_URL}${page.url}`,
        null,
        page.changefreq,
        page.priority
      )
    );
  });

  console.log(`✓ Added ${staticPages.length} static pages\n`);

  // 2. Продукти
  console.log("🛍️ Fetching products...");
  const productsQuery = loadQuery("getAllProductsForSitemap.gql");
  const products = await fetchAllPages(productsQuery, "products");

  products.forEach((product) => {
    const images = product.image ? [product.image] : [];
    urls.push(
      generateURLEntry(
        `${FRONTEND_URL}${PRODUCT_PERMALINK}${product.slug}`,
        product.modified,
        "daily", // Продуктите се променят по-често (цени, наличност)
        0.9, // Продуктите са най-важни след home page
        images
      )
    );
  });

  console.log(`✓ Added ${products.length} products\n`);

  // 3. Категории
  console.log("📂 Fetching categories...");
  const categoriesQuery = loadQuery("getAllCategoriesForSitemap.gql");
  const categories = await fetchAllPages(categoriesQuery, "productCategories");

  categories.forEach((category) => {
    let categoryUrl = "";
    if (category.parent?.node?.slug) {
      // Child category
      categoryUrl = `${FRONTEND_URL}${PRODUCT_CATEGORY_PERMALINK}${category.parent.node.slug}/${category.slug}`;
    } else {
      // Parent category
      categoryUrl = `${FRONTEND_URL}${PRODUCT_CATEGORY_PERMALINK}${category.slug}`;
    }

    urls.push(generateURLEntry(categoryUrl, null, "weekly", 0.9));
  });

  console.log(`✓ Added ${categories.length} categories\n`);

  // 4. Тагове
  console.log("🏷️ Fetching tags...");
  const tagsQuery = loadQuery("getAllTagsForSitemap.gql");
  const tags = await fetchAllPages(tagsQuery, "productTags");

  tags.forEach((tag) => {
    urls.push(
      generateURLEntry(
        `${FRONTEND_URL}${PRODUCT_TAG_PERMALINK}${tag.slug}`,
        null,
        "weekly",
        0.7
      )
    );
  });

  console.log(`✓ Added ${tags.length} tags\n`);

  // 5. Марки
  console.log("🏢 Fetching brands...");
  const brandsQuery = loadQuery("getAllBrandsForSitemap.gql");
  const brands = await fetchAllPages(brandsQuery, "terms");

  brands.forEach((brand) => {
    urls.push(
      generateURLEntry(
        `${FRONTEND_URL}${PRODUCT_BRAND_PERMALINK}${brand.slug}`,
        null,
        "weekly",
        0.8
      )
    );
  });

  console.log(`✓ Added ${brands.length} brands\n`);

  // 6. Блог постове
  console.log("📝 Fetching blog posts...");
  const postsQuery = loadQuery("getAllPostsForSitemap.gql");
  const posts = await fetchAllPages(postsQuery, "posts");

  posts.forEach((post) => {
    const images = post.featuredImage?.node ? [post.featuredImage.node] : [];
    urls.push(
      generateURLEntry(
        `${FRONTEND_URL}${BLOG_PERMALINK}${post.slug}`,
        post.modified,
        "monthly",
        0.6,
        images
      )
    );
  });

  console.log(`✓ Added ${posts.length} blog posts\n`);

  // Генериране на XML
  console.log("📝 Generating sitemap XML...");

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml +=
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  xml += urls.join("");
  xml += "</urlset>\n";

  // Запис във файл
  const outputPath = path.join(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");

  const totalURLs =
    staticPages.length +
    products.length +
    categories.length +
    tags.length +
    brands.length +
    posts.length;

  console.log("\n✅ Sitemap generated successfully!");
  console.log(`📊 Total URLs: ${totalURLs}`);
  console.log(`📁 Location: ${outputPath}`);
  console.log("\nBreakdown:");
  console.log(`  - Static pages: ${staticPages.length}`);
  console.log(`  - Products: ${products.length}`);
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Tags: ${tags.length}`);
  console.log(`  - Brands: ${brands.length}`);
  console.log(`  - Blog posts: ${posts.length}`);
}

// Стартиране
generateSitemap().catch((error) => {
  console.error("❌ Error generating sitemap:", error);
  process.exit(1);
});
