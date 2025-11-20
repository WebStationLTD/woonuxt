/**
 * LocalBusiness Schema.org structured data
 * Показва физически магазин в Google Maps и Knowledge Panel
 */
export const useLocalBusinessSchema = () => {
  const { addSchema } = useSchemaBase();
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://leaderfitness.net/#organization',
    name: 'Лидерфитнес',
    alternateName: 'Лидерфитнес',
    legalName: '"Лидерфитнес" ЕООД',
    description: 'Водещ вносител и представител на голямо разнообразие от бойна екипировка, фитнес уреди и аксесоари',
    taxID: '203659417',
    url: 'https://leaderfitness.net',
    telephone: '+359877277595',
    email: 'office@leaderfitness.net',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'бул. Христо Ботев 67',
      addressLocality: 'София',
      postalCode: '1303',
      addressCountry: 'BG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 42.69965246220605,
      longitude: 23.315732615252898,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '11:00',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '00:00',
        closes: '00:00',
      },
    ],
    sameAs: [
      'https://www.facebook.com/www.leaderfitness.net/',
      'https://www.instagram.com/liderfitness/',
      'https://www.tiktok.com/@leaderfitness',
      'https://www.youtube.com/@Leaderfitnes',
    ],
  };

  addSchema(schema);
};

