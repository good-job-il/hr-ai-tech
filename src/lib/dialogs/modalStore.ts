import { create } from "zustand"
import { ModalConfig, ModalStore, ConfirmDialogConfig, AsyncDialogConfig } from "@/types/modals"

export const useModalStore = create<
  ModalStore & {
    confirmDialog: (config: ConfirmDialogConfig) => Promise<boolean>
    asyncDialog: (config: AsyncDialogConfig) => Promise<any>
  }
>((set, get) => ({
  modals: [],

  addModal: (config: ModalConfig) => {
    set((state) => ({
      modals: [...state.modals, config],
    }))
  },

  removeModal: (id: string) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }))
  },

  updateModal: (id: string, config: Partial<ModalConfig>) => {
    set((state) => ({
      modals: state.modals.map((m) => (m.id === id ? { ...m, ...config } : m)),
    }))
  },

  closeAll: () => {
    set({ modals: [] })
  },

  confirmDialog: (config: ConfirmDialogConfig) => {
    return new Promise((resolve) => {
      const modalId = `confirm-${Date.now()}`
      const confirmAction = async () => {
        try {
          await config.onConfirm()
          get().removeModal(modalId)
          resolve(true)
        } catch (error) {
          console.error("Confirm action failed:", error)
          resolve(false)
        }
      }

      get().addModal({
        id: modalId,
        title: config.title || "Confirm",
        content: config.message,
        size: "md",
        closeButton: true,
        onClose: () => resolve(false),
        actions: [
          {
            id: "cancel",
            label: config.cancelLabel || "Cancel",
            onClick: () => {
              get().removeModal(modalId)
              resolve(false)
            },
            variant: "secondary",
          },
          {
            id: "confirm",
            label: config.confirmLabel || "Confirm",
            onClick: confirmAction,
            variant: config.isDangerous ? "danger" : "primary",
          },
        ],
      })
    })
  },

  asyncDialog: (config: AsyncDialogConfig) => {
    return new Promise((resolve) => {
      const modalId = `async-${Date.now()}`

      get().addModal({
        id: modalId,
        ...config,
        onClose: () => {
          get().removeModal(modalId)
          resolve(null)
        },
      })
    })
  },
}))
