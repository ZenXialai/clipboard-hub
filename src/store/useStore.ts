import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Card, Column } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState extends AppState {
  addColumn: (title: string) => void;
  deleteColumn: (id: string) => void;
  renameColumn: (id: string, title: string) => void;
  addCard: (columnId: string, content: string, type: Card['type']) => void;
  addCardToTop: (columnId: string, content: string, type: Card['type']) => void;
  deleteCard: (columnId: string, cardId: string) => void;
  updateCard: (columnId: string, cardId: string, updates: Partial<Card>) => void;
  moveCard: (activeId: string, overId: string, activeColumnId: string, overColumnId: string, newIndex: number) => void;
  removeExpiredCards: () => void;
  setBurnAfterCopy: (enabled: boolean) => void;
  setCardTTLHours: (hours: number) => void;
  setClipboardListening: (enabled: boolean) => void;
}

const DEFAULT_COLUMNS: Column[] = [
  {
    id: 'col-default-1',
    title: '待处理',
    cards: [],
    createdAt: Date.now(),
    order: 0,
  },
  {
    id: 'col-default-2',
    title: '已完成',
    cards: [],
    createdAt: Date.now(),
    order: 1,
  },
];

const createCard = (
  content: string,
  type: Card['type'],
  order: number,
  expiresAt: number
): Card => {
  const now = Date.now();
  return {
    id: `card-${uuidv4()}`,
    content,
    type,
    color: 'blue',
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    order,
    expiresAt,
  };
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,
      settings: {
        theme: 'light',
        autoDetectType: true,
        burnAfterCopy: false,
        cardTTLHours: 24,
        clipboardListening: false,
      },
      version: '1.0.0',

      addColumn: (title) =>
        set((state) => ({
          columns: [
            ...state.columns,
            {
              id: `col-${uuidv4()}`,
              title,
              cards: [],
              createdAt: Date.now(),
              order: state.columns.length,
            },
          ],
        })),

      deleteColumn: (id) =>
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== id),
        })),

      renameColumn: (id, title) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, title } : col
          ),
        })),

      addCard: (columnId, content, type) =>
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id !== columnId) return col;
            const temporaryColumnId = state.columns[0]?.id;
            const expiresAt =
              col.id === temporaryColumnId
                ? Date.now() + state.settings.cardTTLHours * 60 * 60 * 1000
                : Number.MAX_SAFE_INTEGER;
            const newCard = createCard(content, type, col.cards.length, expiresAt);
            return {
              ...col,
              cards: [...col.cards, newCard],
            };
          }),
        })),

      addCardToTop: (columnId, content, type) =>
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id !== columnId) return col;
            const temporaryColumnId = state.columns[0]?.id;
            const expiresAt =
              col.id === temporaryColumnId
                ? Date.now() + state.settings.cardTTLHours * 60 * 60 * 1000
                : Number.MAX_SAFE_INTEGER;
            const newCard = createCard(content, type, 0, expiresAt);
            const nextCards = [newCard, ...col.cards].map((card, index) => ({
              ...card,
              order: index,
            }));
            return {
              ...col,
              cards: nextCards,
            };
          }),
        })),

      deleteCard: (columnId, cardId) =>
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              cards: col.cards.filter((card) => card.id !== cardId),
            };
          }),
        })),

      updateCard: (columnId, cardId, updates) =>
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              cards: col.cards.map((card) =>
                card.id === cardId
                  ? { ...card, ...updates, updatedAt: Date.now() }
                  : card
              ),
            };
          }),
        })),

      moveCard: (activeId, overId, activeColumnId, overColumnId, newIndex) =>
        set((state) => {
          const sourceColIndex = state.columns.findIndex((col) =>
            col.cards.some((card) => card.id === activeId)
          );
          const targetColIndex = state.columns.findIndex((col) => col.id === overColumnId);

          if (sourceColIndex === -1 || targetColIndex === -1) return state;

          const sourceCol = state.columns[sourceColIndex];
          const targetCol = state.columns[targetColIndex];
          const movingCard = sourceCol.cards.find((card) => card.id === activeId);
          const isSourceTemporary = sourceColIndex === 0;
          const isTargetTemporary = targetColIndex === 0;
          const ttlMs = state.settings.cardTTLHours * 60 * 60 * 1000;

          if (!movingCard) return state;
          const nextMovingCard = {
            ...movingCard,
            expiresAt: isTargetTemporary
              ? isSourceTemporary
                ? movingCard.expiresAt
                : Date.now() + ttlMs
              : Number.MAX_SAFE_INTEGER,
          };

          const sourceCardsWithoutMoving = sourceCol.cards.filter((card) => card.id !== activeId);
          const isSameColumn = sourceCol.id === targetCol.id;

          if (isSameColumn) {
            const insertIndex = Math.max(0, Math.min(newIndex, sourceCardsWithoutMoving.length));
            const reorderedCards = [...sourceCardsWithoutMoving];
            reorderedCards.splice(insertIndex, 0, nextMovingCard);
            const normalizedCards = reorderedCards.map((card, index) => ({ ...card, order: index }));

            return {
              columns: state.columns.map((col, index) =>
                index === sourceColIndex ? { ...col, cards: normalizedCards } : col
              ),
            };
          }

          const targetCards = [...targetCol.cards];
          const insertIndex = Math.max(0, Math.min(newIndex, targetCards.length));
          targetCards.splice(insertIndex, 0, nextMovingCard);

          const normalizedSourceCards = sourceCardsWithoutMoving.map((card, index) => ({
            ...card,
            order: index,
          }));
          const normalizedTargetCards = targetCards.map((card, index) => ({
            ...card,
            order: index,
          }));

          return {
            columns: state.columns.map((col, index) => {
              if (index === sourceColIndex) {
                return { ...col, cards: normalizedSourceCards };
              }
              if (index === targetColIndex) {
                return { ...col, cards: normalizedTargetCards };
              }
              return col;
            }),
          };
        }),

      removeExpiredCards: () =>
        set((state) => {
          const now = Date.now();
          const temporaryColumnId = state.columns[0]?.id;
          return {
            columns: state.columns.map((col) => {
              if (col.id !== temporaryColumnId) {
                return {
                  ...col,
                  cards: col.cards.map((card, index) => ({ ...card, order: index })),
                };
              }
              return {
                ...col,
                cards: col.cards
                  .filter((card) => card.expiresAt > now)
                  .map((card, index) => ({ ...card, order: index })),
              };
            }),
          };
        }),

      setBurnAfterCopy: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            burnAfterCopy: enabled,
          },
        })),

      setCardTTLHours: (hours) =>
        set((state) => ({
          settings: {
            ...state.settings,
            cardTTLHours: Math.max(1, Math.min(168, Math.floor(hours || 24))),
          },
        })),

      setClipboardListening: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            clipboardListening: enabled,
          },
        })),
    }),
    {
      name: 'clipboard-hub-storage',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<StoreState>) || {};
        const mergedSettings = {
          ...currentState.settings,
          ...(persisted.settings || {}),
        };
        const ttl = mergedSettings.cardTTLHours || 24;
        const mergedColumns = (persisted.columns || currentState.columns).map((col, colIndex) => {
          const isTemporary = colIndex === 0;
          return {
            ...col,
            cards: col.cards.map((card, index) => ({
              ...card,
              order: typeof card.order === 'number' ? card.order : index,
              expiresAt: isTemporary
                ? card.expiresAt || card.createdAt + ttl * 60 * 60 * 1000
                : Number.MAX_SAFE_INTEGER,
            })),
          };
        });
        return {
          ...currentState,
          ...persisted,
          settings: mergedSettings,
          columns: mergedColumns,
        } as StoreState;
      },
    }
  )
);
