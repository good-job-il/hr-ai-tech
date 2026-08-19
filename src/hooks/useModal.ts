import { useCallback } from "react"
import { useModalStore } from "@/lib/dialogs/modalStore"
import { ModalConfig, ConfirmDialogConfig, AsyncDialogConfig, UseModalReturn } from "@/types/modals"

export const useModal = (): UseModalReturn => {
  const store = useModalStore()

  const openModal = useCallback(
    (config: ModalConfig) => {
      store.addModal(config)
    },
    [store],
  )

  const closeModal = useCallback(
    (id: string) => {
      store.removeModal(id)
    },
    [store],
  )

  const openConfirmDialog = useCallback(
    async (config: ConfirmDialogConfig): Promise<boolean> => {
      return store.confirmDialog(config)
    },
    [store],
  )

  const openAsyncDialog = useCallback(
    async (config: AsyncDialogConfig): Promise<any> => {
      return store.asyncDialog(config)
    },
    [store],
  )

  return {
    openModal,
    closeModal,
    openConfirmDialog,
    openAsyncDialog,
  }
}
