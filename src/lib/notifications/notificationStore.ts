import { create } from 'zustand';
import { Notification, NotificationStore } from '@/types/notifications';

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  toasts: [],
  notifications: [],
  unreadCount: 0,

  addToast: (notification) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      isRead: true,
      category: 'toast',
    };

    set(state => ({
      toasts: [...state.toasts, toast]
    }));

    // Auto-dismiss
    const duration = notification.duration || 4000;
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, duration);
  },

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const notif: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      isRead: false,
      category: 'persistent',
    };

    set(state => ({
      notifications: [...state.notifications, notif],
      unreadCount: state.unreadCount + 1,
    }));

    // Persist to storage
    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([...existing, notif]));
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  removeNotification: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      const newUnreadCount = notification && !notification.isRead
        ? state.unreadCount - 1
        : state.unreadCount;

      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: newUnreadCount,
      };
    });

    // Update storage
    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify(existing.filter((n: any) => n.id !== id)));
  },

  markAsRead: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.isRead) {
        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    });

    // Update storage
    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify(
      existing.map((n: any) => n.id === id ? { ...n, isRead: true } : n)
    ));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    // Update storage
    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify(
      existing.map((n: any) => ({ ...n, isRead: true }))
    ));
  },

  clearAll: () => {
    set({
      toasts: [],
      notifications: [],
      unreadCount: 0,
    });
    localStorage.removeItem('notifications');
  },
}));