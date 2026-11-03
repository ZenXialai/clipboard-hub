import { create } from 'zustand';
import { CardContentType } from '@/types';

interface UIState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: CardContentType | 'all';
  setFilterType: (type: CardContentType | 'all') => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  filterType: 'all',
  setFilterType: (type) => set({ filterType: type }),
}));
