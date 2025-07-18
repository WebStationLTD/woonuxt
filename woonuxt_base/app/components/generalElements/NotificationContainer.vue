<script setup lang="ts">
import type { Notification } from '#imports';

const { notifications, removeNotification } = useNotifications();

// Стилове за различните типове нотификации
const getNotificationClasses = (type: Notification['type']) => {
  const baseClasses = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-xl';

  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
    case 'error':
      return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
    case 'warning':
      return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
    case 'info':
      return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
    default:
      return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
  }
};

const getIconColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return '#16a34a'; // green-600
    case 'error':
      return '#dc2626'; // red-600
    case 'warning':
      return '#d97706'; // yellow-600
    case 'info':
      return '#2563eb'; // blue-600
    default:
      return '#4b5563'; // gray-600
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="notifications.length > 0" class="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[9999] space-y-3 max-w-sm md:w-full pointer-events-none">
      <TransitionGroup name="notification" tag="div" class="space-y-3">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="getNotificationClasses(notification.type)"
          class="pointer-events-auto transform">
          <!-- Икона -->
          <div class="flex-shrink-0 mt-0.5">
            <Icon v-if="notification.icon" :name="notification.icon" :color="getIconColor(notification.type)" size="20" />
          </div>

          <!-- Съдържание -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold leading-tight">
              {{ notification.title }}
            </h4>
            <p v-if="notification.message" class="text-xs mt-1 leading-relaxed opacity-90">
              {{ notification.message }}
            </p>
          </div>

          <!-- Бутон за затваряне -->
          <button
            @click="removeNotification(notification.id)"
            class="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
            aria-label="Затвори съобщението">
            <Icon name="ion:close" size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Анимации за нотификациите */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover ефект за цялата нотификация */
.notification-enter-active:hover,
.notification-leave-active:hover {
  transform: scale(1.02);
}

/* Прогрес бар за времето (опционален) */
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: currentColor;
  opacity: 0.3;
  animation: progress linear;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
