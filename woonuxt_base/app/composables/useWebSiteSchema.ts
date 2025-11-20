/**
 * WebSite Schema.org structured data
 * Добавя Sitelinks Search Box в Google резултатите
 */
export const useWebSiteSchema = () => {
  const { addSchema } = useSchemaBase();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://leaderfitness.net/#website',
    name: 'Лидерфитнес',
    url: 'https://leaderfitness.net',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://leaderfitness.net/magazin?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  addSchema(schema);
};

