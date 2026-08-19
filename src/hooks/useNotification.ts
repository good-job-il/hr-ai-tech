import { useCallback } from "react"
import { useNotificationStore } from "@/lib/notifications/notificationStore"
import { UseNotificationReturn, Notification } from "@/types/notifications"

export const useNotification = (): UseNotificationReturn => {
  const store = useNotificationStore()

  const showSuccess = useCallback(
    (title: string, options?: Partial<Notification>) => {
      store.addToast({
        type: "success",
        title,
        duration: 4000,
        ...options,
      })
    },
    [store],
  )

  const showError = useCallback(
    (title: string, options?: Partial<Notification>) => {
      store.addToast({
        type: "error",
        title,
        duration: 6000,
        ...options,
      })
    },
    [store],
  )

  const showWarning = useCallback(
    (title: string, options?: Partial<Notification>) => {
      store.addToast({
        type: "warning",
        title,
        duration: 5000,
        ...options,
      })
    },
    [store],
  )

  const showInfo = useCallback(
    (title: string, options?: Partial<Notification>) => {
      store.addToast({
        type: "info",
        title,
        duration: 4000,
        ...options,
      })
    },
    [store],
  )

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "isRead" | "category">) => {
      store.addNotification(notification)
    },
    [store],
  )

  const removeNotification = useCallback(
    (id: string) => {
      store.removeNotification(id)
    },
    [store],
  )

  const markAsRead = useCallback(
    (id: string) => {
      store.markAsRead(id)
    },
    [store],
  )

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addNotification,
    removeNotification,
    markAsRead,
    notifications: store.notifications,
    unreadCount: store.unreadCount,
  }
}
