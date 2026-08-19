export type NotificationType = "success" | "error" | "warning" | "info"
export type NotificationCategory = "toast" | "persistent" | "banner"

export interface NotificationAction {
  label: string
  handler: () => void
}

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message?: string
  duration?: number
  action?: NotificationAction
  isRead: boolean
  createdAt: number
  dismissable?: boolean
  icon?: React.ReactNode
}

export interface NotificationState {
  toasts: Notification[]
  notifications: Notification[]
  unreadCount: number
}

export interface NotificationStore {
  toasts: Notification[]
  notifications: Notification[]
  unreadCount: number
  addToast: (notification: Omit<Notification, "id" | "createdAt" | "isRead" | "category">) => void
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead" | "category">,
  ) => void
  removeToast: (id: string) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export interface UseNotificationReturn {
  showSuccess: (title: string, options?: Partial<Notification>) => void
  showError: (title: string, options?: Partial<Notification>) => void
  showWarning: (title: string, options?: Partial<Notification>) => void
  showInfo: (title: string, options?: Partial<Notification>) => void
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead" | "category">,
  ) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  notifications: Notification[]
  unreadCount: number
}
