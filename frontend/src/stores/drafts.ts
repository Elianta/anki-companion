import { create } from 'zustand';
import { db } from '@/lib/db';

export type DraftCountState = {
  count: number;
  initCount: () => Promise<number>;
  increment: () => void;
  decrement: (by?: number) => void;
  setCount: (count: number) => void;
};

export const useDraftCountStore = create<DraftCountState>((set) => ({
  count: 0,
  initCount: async () => {
    try {
      const drafts = await db.drafts.toArray();
      const count = drafts.filter((draft) => !draft.exported).length;
      set({ count });
      return count;
    } catch (error) {
      console.warn('Failed to initialize draft count', error);
      return 0;
    }
  },
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: (by = 1) => set((state) => ({ count: Math.max(0, state.count - by) })),
  setCount: (count: number) => set({ count }),
}));
