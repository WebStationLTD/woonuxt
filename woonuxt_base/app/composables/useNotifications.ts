export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

/**
 * @name useNotifications
 * @description A composable for managing global notifications
 */
export function useNotifications() {
  const notifications = useState<Notification[]>('notifications', () => []);

  // Добавяне на нотификация
  function addNotification(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      id,
      duration: 4000, // 4 секунди по подразбиране
      ...notification,
    };

    notifications.value.push(newNotification);

    // Автоматично премахване след определено време
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  // Премахване на нотификация
  function removeNotification(id: string): void {
    const index = notifications.value.findIndex((notification) => notification.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }

  // Изчистване на всички нотификации
  function clearNotifications(): void {
    notifications.value = [];
  }

  // Специализирани функции за различните типове нотификации
  function showSuccess(title: string, message?: string, duration?: number): string {
    return addNotification({
      type: 'success',
      title,
      message,
      duration,
      icon: 'ion:checkmark-circle',
    });
  }

  function showError(title: string, message?: string, duration?: number): string {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: duration || 6000, // По-дълго за грешки
      icon: 'ion:close-circle',
    });
  }

  function showWarning(title: string, message?: string, duration?: number): string {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration,
      icon: 'ion:warning',
    });
  }

  function showInfo(title: string, message?: string, duration?: number): string {
    return addNotification({
      type: 'info',
      title,
      message,
      duration,
      icon: 'ion:information-circle',
    });
  }

  // Специална функция за добавяне в количката
  function showCartSuccess(productName: string, quantity: number = 1): string {
    const title = 'Добавено в количката!';
    const message = quantity > 1 ? `${quantity} бр. ${productName} са добавени успешно` : `${productName} е добавен успешно`;

    return addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      icon: 'ion:cart',
    });
  }

  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCartSuccess,
  };
}
