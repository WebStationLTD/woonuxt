export const useBlogPagination = () => {
  const allPosts = ref<Post[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const postsPerPage = 12;
  
  // Зарежда всички публикации веднъж
  const loadAllPosts = async () => {
    if (allPosts.value.length > 0) {
      return; // Вече са заредени
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore
      const { data } = await useAsyncGql('GetBlogPosts', {
        first: 200, // Зареждаме всички наведнъж
      });
      
      if (data.value?.posts?.nodes) {
        allPosts.value = data.value.posts.nodes;
      }
    } catch (err: any) {
      error.value = err.message || 'Грешка при зареждане на публикации';
    } finally {
      isLoading.value = false;
    }
  };
  
  // Връща публикациите за дадена страница
  const getPostsForPage = (page: number) => {
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    return allPosts.value.slice(start, end);
  };
  
  // Общ брой страници
  const getTotalPages = () => {
    return Math.ceil(allPosts.value.length / postsPerPage);
  };
  
  // Общ брой публикации
  const getTotalPosts = () => {
    return allPosts.value.length;
  };
  
  return {
    allPosts,
    isLoading,
    error,
    postsPerPage,
    loadAllPosts,
    getPostsForPage,
    getTotalPages,
    getTotalPosts,
  };
};

