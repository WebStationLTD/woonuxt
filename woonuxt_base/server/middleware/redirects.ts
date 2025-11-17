export default defineEventHandler((event) => {
  const url = event.node.req.url || '';
  
  // Вземи само path-а без query string
  const path = url.split('?')[0];
  
  // Decode URL за да хванем и encoded и plain версиите
  let decodedPath = path;
  try {
    decodedPath = decodeURIComponent(path);
  } catch (e) {
    // Ignore decode errors
  }
  
  // Normalize - премахни trailing slash за сравнение
  const normalizedPath = decodedPath.replace(/\/$/, '');
  
  // Проверка за фитнес-уреди (всички варианти)
  if (normalizedPath === '/фитнес-уреди') {
    console.log('🔄 Redirecting from:', url, 'to: /');
    return sendRedirect(event, '/', 301);
  }
});

