/**
 * CollectionPage Schema.org structured data
 * За категории и подкатегории
 */
export const useCollectionPageSchema = (
  categoryData: {
    name: string;
    description?: string | null;
    slug: string;
    parentSlug?: string | null;
    image?: string | null;
    count?: number | null;
  }
) => {
  const { addSchema } = useSchemaBase();
  const { frontEndUrl } = useHelpers();

  const baseUrl = frontEndUrl || 'https://leaderfitness.net';
  
  const categoryUrl = categoryData.parentSlug
    ? `${baseUrl}/produkt-kategoriya/${categoryData.parentSlug}/${categoryData.slug}`
    : `${baseUrl}/produkt-kategoriya/${categoryData.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryData.name,
    description: categoryData.description || `Разгледайте ${categoryData.name}`,
    url: categoryUrl,
    ...(categoryData.image && {
      image: categoryData.image,
    }),
    ...(categoryData.count && {
      numberOfItems: categoryData.count,
    }),
  };

  addSchema(schema);
};

