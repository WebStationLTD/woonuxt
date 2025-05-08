interface Post {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  content: string;
  seo?: {
    title?: string;
    metaDesc?: string;
    metaKeywords?: string;
    metaRobotsNoindex?: boolean;
    metaRobotsNofollow?: boolean;
    opengraphTitle?: string;
    opengraphDescription?: string;
    opengraphImage?: {
      sourceUrl?: string;
      altText?: string;
    };
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: {
      sourceUrl?: string;
      altText?: string;
    };
    canonical?: string;
    schema?: {
      raw?: string;
    };
  };
  featuredImage?: {
    node?: {
      sourceUrl: string;
      altText?: string;
    };
  };
  author?: {
    node?: {
      name?: string;
      avatar?: {
        url?: string;
      };
    };
  };
  categories?: {
    nodes?: {
      name: string;
      slug: string;
    }[];
  };
}
