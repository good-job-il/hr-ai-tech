import { create } from 'zustand';
import { DrawerConfig, DrawerStore } from '@/types/modals';

export const useDrawerStore = create<DrawerStore>((set) => ({
  drawers: [],

  addDrawer: (config: DrawerConfig) => {
    set(state => ({
      drawers: [...state.drawers, config]
    }));
  },

  removeDrawer: (id: string) => {
    set(state => ({
      drawers: state.drawers.filter(d => d.id !== id)
    }));
  },

  updateDrawer: (id: string, config: Partial<DrawerConfig>) => {
    set(state => ({
      drawers: state.drawers.map(d => d.id === id ? { ...d, ...config } : d)
    }));
  },

  closeAll: () => {
    set({ drawers: [] });
  }
}));