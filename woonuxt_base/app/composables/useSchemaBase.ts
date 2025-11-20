/**
 * Base helper за Schema.org structured data
 * Използва се от другите schema composables
 */
export const useSchemaBase = () => {
  const addSchema = (schema: object) => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(schema),
          tagPriority: 'high',
        },
      ],
    });
  };

  return { addSchema };
};

