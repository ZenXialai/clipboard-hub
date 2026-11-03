export type CardContentType = 'link' | 'code' | 'text' | 'image';

export type CardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

export interface Card {
  id: string;
  content: string;
  type: CardContentType;
  color: CardColor;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  order: number;
  expiresAt: number;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  createdAt: number;
  order: number;
}

export interface AppState {
  columns: Column[];
  settings: {
    theme: 'light' | 'dark';
    autoDetectType: boolean;
    burnAfterCopy: boolean;
    cardTTLHours: number;
    clipboardListening: boolean;
  };
  version: string;
}
