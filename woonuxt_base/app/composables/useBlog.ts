import { ref, reactive } from 'vue';

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
      console.log('Задаване на публикации:', newPosts.length);
      posts.value = newPosts;
    } else {
      console.warn('Опит за задаване на празен масив от публикации');
    }
  };

  // Добавяне на още публикации (при пагинация)
  const addPosts = (newPosts: Post[]) => {
    if (newPosts && newPosts.length > 0) {
      console.log('Добавяне на публикации:', newPosts.length);
      posts.value = [...posts.value, ...newPosts];
    }
  };

  // Задаване на текуща публикация
  const setCurrentPost = (post: Post) => {
    console.log('Задаване на текуща публикация:', post.title);
    currentPost.value = post;
  };

  // Зареждане на още публикации
  const loadMorePosts = async () => {
    if (!pageInfo.hasNextPage) return;

    loading.value = true;
    error.value = null;

    try {
      // @ts-ignore
      const { data } = await useAsyncGql('getPosts', {
        first: 12,
        after: pageInfo.endCursor,
      });

      console.log('Резултат от loadMorePosts:', JSON.stringify(data.value, null, 2));

      if (data.value?.posts?.nodes) {
        addPosts(data.value.posts.nodes);
        pageInfo.hasNextPage = data.value.posts.pageInfo.hasNextPage;
        pageInfo.endCursor = data.value.posts.pageInfo.endCursor;
      }
    } catch (err: any) {
      error.value = err.message || 'Грешка при зареждане на публикации';
      console.error('Грешка при зареждане на още публикации:', err);
    } finally {
      loading.value = false;
    }
  };

  // Зареждане на публикация по slug
  const loadPostBySlug = async (slug: string) => {
    console.log('Зареждане на публикация със slug:', slug);
    loading.value = true;
    error.value = null;

    try {
      // @ts-ignore
      const { data } = await useAsyncGql('getPost', {
        id: slug,
        idType: 'SLUG',
      });

      console.log('Резултат от loadPostBySlug:', JSON.stringify(data.value, null, 2));

      if (data.value?.post) {
        setCurrentPost(data.value.post);
        return data.value.post;
      } else {
        console.warn('Публикацията не е намерена:', slug);
      }

      return null;
    } catch (err: any) {
      error.value = err.message || 'Грешка при зареждане на публикацията';
      console.error('Грешка при зареждане на публикация:', err);
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
