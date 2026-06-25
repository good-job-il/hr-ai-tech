import { useCallback } from 'react';
import { useDrawerStore } from '@/lib/dialogs/drawerStore';
import { DrawerConfig, UseDrawerReturn } from '@/types/modals';

export const useDrawer = (): UseDrawerReturn => {
  const store = useDrawerStore();

  const openDrawer = useCallback((config: DrawerConfig) => {
    store.addDrawer(config);
  }, [store]);

  const closeDrawer = useCallback((id: string) => {
    store.removeDrawer(id);
  }, [store]);

  return {
    openDrawer,
    closeDrawer,
  };
};