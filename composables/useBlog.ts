import { ref, reactive } from "vue";

export const useBlog = () => {
  const posts = ref<Post[]>([]);
  const currentPost = ref<Post | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pageInfo = reactive({
    hasNextPage: false,
    endCursor: null as string | null,
  });

  // Задаване на публикации
  const setPosts = (newPosts: Post[]) => {
    if (newPosts && newPosts.length > 0) {
      posts.value = newPosts;
    }
  };

  // Добавяне на още публикации (при пагинация)
  const addPosts = (newPosts: Post[]) => {
    if (newPosts && newPosts.length > 0) {
      posts.value = [...posts.value, ...newPosts];
    }
  };

  // Задаване на текуща публикация
  const setCurrentPost = (post: Post) => {
    currentPost.value = post;
  };

  // Зареждане на още публикации
  const loadMorePosts = async () => {
    if (!pageInfo.hasNextPage) return;

    loading.value = true;
    error.value = null;

    try {
      // @ts-ignore
      const { data } = await useAsyncGql("GetBlogPosts", {
        first: 12,
        after: pageInfo.endCursor,
      });

      if (data.value?.posts?.nodes) {
        addPosts(data.value.posts.nodes as Post[]);
        pageInfo.hasNextPage = data.value.posts.pageInfo.hasNextPage;
        pageInfo.endCursor = data.value.posts.pageInfo.endCursor || null;
      }
    } catch (err: any) {
      error.value = err.message || "Грешка при зареждане на публикации";
    } finally {
      loading.value = false;
    }
  };

  // Зареждане на публикация по slug
  const loadPostBySlug = async (slug: string) => {
    loading.value = true;
    error.value = null;

    try {
      // Първо получаваме всички публикации
      // @ts-ignore
      const { data: allPostsData } = await useAsyncGql("GetBlogPosts", {
        first: 100,
      });

      // Намираме ID на публикацията със съответния slug
      const targetPost = allPostsData.value?.posts?.nodes?.find(
        (p: any) => p.slug === slug
      );

      if (targetPost) {
        // @ts-ignore
        const { data } = await useAsyncGql("GetBlogPost", {
          id: targetPost.id,
        });

        if (data.value?.post) {
          setCurrentPost(data.value.post as Post);
          return data.value.post as Post;
        }
      }

      return null;
    } catch (err: any) {
      error.value = err.message || "Грешка при зареждане на публикацията";
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    posts,
    currentPost,
    loading,
    error,
    pageInfo,
    setPosts,
    addPosts,
    setCurrentPost,
    loadMorePosts,
    loadPostBySlug,
  };
};
