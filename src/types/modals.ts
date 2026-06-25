import { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPosition = 'center' | 'top' | 'bottom';

export interface ModalConfig {
  id: string;
  title?: string;
  content: ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  closeButton?: boolean;
  backdrop?: boolean;
  onClose?: () => void;
  actions?: ModalAction[];
  className?: string;
  isDismissable?: boolean;
  isAsync?: boolean;
}

export interface ModalAction {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export interface ConfirmDialogConfig extends Omit<ModalConfig, 'content'> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isDangerous?: boolean;
}

export interface AsyncDialogConfig extends ModalConfig {
  loading?: boolean;
  error?: string;
}

export interface DrawerConfig {
  id: string;
  title?: string;
  content: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
  height?: string | number;
  closeButton?: boolean;
  backdrop?: boolean;
  onClose?: () => void;
  className?: string;
  isDismissable?: boolean;
}

export interface ModalStore {
  modals: ModalConfig[];
  addModal: (config: ModalConfig) => void;
  removeModal: (id: string) => void;
  updateModal: (id: string, config: Partial<ModalConfig>) => void;
  closeAll: () => void;
}

export interface DrawerStore {
  drawers: DrawerConfig[];
  addDrawer: (config: DrawerConfig) => void;
  removeDrawer: (id: string) => void;
  updateDrawer: (id: string, config: Partial<DrawerConfig>) => void;
  closeAll: () => void;
}

export interface UseModalReturn {
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  openConfirmDialog: (config: ConfirmDialogConfig) => Promise<boolean>;
  openAsyncDialog: (config: AsyncDialogConfig) => Promise<any>;
}

export interface UseDrawerReturn {
  openDrawer: (config: DrawerConfig) => void;
  closeDrawer: (id: string) => void;
}