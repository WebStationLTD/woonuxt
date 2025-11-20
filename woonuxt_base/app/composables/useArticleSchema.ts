/**
 * Article Schema.org structured data
 * За blog постове и новини
 */
export const useArticleSchema = (
  postData: {
    title: string;
    excerpt?: string;
    content?: string;
    slug: string;
    date: string;
    modified?: string;
    author?: any;
    featuredImage?: any;
    categories?: any[];
  }
) => {
  const { addSchema } = useSchemaBase();
  const { frontEndUrl } = useHelpers();

  const baseUrl = frontEndUrl || 'https://leaderfitness.net';
  
  const publishedDate = new Date(postData.date).toISOString();
  const modifiedDate = postData.modified 
    ? new Date(postData.modified).toISOString() 
    : publishedDate;
  
  const authorName = postData.author?.node?.name || 'Лидерфитнес';
  
  const keywords = postData.categories?.map((cat: any) => cat.name).join(', ');
  
  const imageUrl = postData.featuredImage?.node?.sourceUrl;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postData.title,
    description: postData.excerpt || '',
    url: `${baseUrl}/${postData.slug}`,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Лидерфитнес',
      url: 'https://leaderfitness.net',
    },
    ...(imageUrl && {
      image: imageUrl,
    }),
    ...(keywords && {
      keywords: keywords,
    }),
  };

  addSchema(schema);
};

