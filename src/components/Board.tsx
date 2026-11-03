import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import Column from './Column';
import CardItem from './CardItem';
import { ClipboardPlus, Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card } from '@/types';
import { detectContentType } from '@/utils';

export default function Board() {
  const columns = useStore((state) => state.columns);
  const addColumn = useStore((state) => state.addColumn);
  const moveCard = useStore((state) => state.moveCard);
  const addCardToTop = useStore((state) => state.addCardToTop);
  const removeExpiredCards = useStore((state) => state.removeExpiredCards);
  const clipboardListening = useStore((state) => state.settings.clipboardListening);
  const setClipboardListening = useStore((state) => state.setClipboardListening);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const lastClipboardSignatureRef = useRef('');
  const isPollingClipboardRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddColumn = () => {
    setIsAddingColumn(true);
  };

  const handleAddColumnSubmit = () => {
    const title = newColumnTitle.trim();
    if (!title) {
      setIsAddingColumn(false);
      setNewColumnTitle('');
      return;
    }
    addColumn(title);
    setIsAddingColumn(false);
    setNewColumnTitle('');
  };

  const readImageAsDataUrl = useCallback((blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleClipboardImport = useCallback(async () => {
    const defaultColumnId = columns[0]?.id;
    if (!defaultColumnId) return;

    if (window.electronAPI?.readClipboardSnapshot) {
      const snapshot = await window.electronAPI.readClipboardSnapshot();
      if (snapshot.type === 'empty' || !snapshot.content.trim()) return;
      lastClipboardSignatureRef.current = snapshot.signature;
      if (snapshot.type === 'image') {
        addCardToTop(defaultColumnId, snapshot.content, 'image');
        return;
      }
      addCardToTop(defaultColumnId, snapshot.content, detectContentType(snapshot.content));
      return;
    }

    const clipboardWithItems = navigator.clipboard as Clipboard & {
      read?: () => Promise<ClipboardItem[]>;
    };

    try {
      if (clipboardWithItems.read) {
        const items = await clipboardWithItems.read();
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const dataUrl = await readImageAsDataUrl(blob);
            if (dataUrl) {
              lastClipboardSignatureRef.current = `image-${dataUrl.slice(0, 128)}`;
              addCardToTop(defaultColumnId, dataUrl, 'image');
              return;
            }
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      lastClipboardSignatureRef.current = `text-${text.trim()}`;
      addCardToTop(defaultColumnId, text.trim(), detectContentType(text));
    } catch {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      lastClipboardSignatureRef.current = `text-${text.trim()}`;
      addCardToTop(defaultColumnId, text.trim(), detectContentType(text));
    }
  }, [addCardToTop, columns, readImageAsDataUrl]);

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const tagName = element.tagName?.toLowerCase();
    return element.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }, []);

  const handlePasteImport = useCallback(
    async (event: ClipboardEvent) => {
      const defaultColumnId = columns[0]?.id;
      if (!defaultColumnId) return;
      if (isEditableTarget(event.target)) return;

      const data = event.clipboardData;
      if (!data) return;

      const imageItem = Array.from(data.items).find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          event.preventDefault();
          const dataUrl = await readImageAsDataUrl(file);
          if (dataUrl) {
            lastClipboardSignatureRef.current = `image-${dataUrl.slice(0, 128)}`;
            addCardToTop(defaultColumnId, dataUrl, 'image');
            return;
          }
        }
      }

      const text = data.getData('text/plain').trim();
      if (!text) return;
      event.preventDefault();
      lastClipboardSignatureRef.current = `text-${text}`;
      addCardToTop(defaultColumnId, text, detectContentType(text));
    },
    [addCardToTop, columns, isEditableTarget, readImageAsDataUrl]
  );

  const pollClipboardIfChanged = useCallback(async () => {
    if (!clipboardListening || !window.electronAPI?.readClipboardSnapshot) return;
    if (isPollingClipboardRef.current) return;
    const defaultColumnId = columns[0]?.id;
    if (!defaultColumnId) return;
    isPollingClipboardRef.current = true;
    try {
      const snapshot = await window.electronAPI.readClipboardSnapshot();
      if (snapshot.type === 'empty' || !snapshot.signature) return;
      if (snapshot.signature === lastClipboardSignatureRef.current) return;
      lastClipboardSignatureRef.current = snapshot.signature;
      if (snapshot.type === 'image') {
        addCardToTop(defaultColumnId, snapshot.content, 'image');
        return;
      }
      addCardToTop(defaultColumnId, snapshot.content, detectContentType(snapshot.content));
    } finally {
      isPollingClipboardRef.current = false;
    }
  }, [addCardToTop, clipboardListening, columns]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      removeExpiredCards();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [removeExpiredCards]);

  useEffect(() => {
    if (!clipboardListening || !window.electronAPI?.readClipboardSnapshot) return;
    const timer = window.setInterval(() => {
      void pollClipboardIfChanged();
    }, 1200);
    return () => window.clearInterval(timer);
  }, [clipboardListening, pollClipboardIfChanged]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'v' && !event.altKey && !event.metaKey) {
        if (!event.shiftKey && isEditableTarget(event.target)) {
          return;
        }
        event.preventDefault();
        void handleClipboardImport();
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      void handlePasteImport(event);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [handleClipboardImport, handlePasteImport, isEditableTarget]);

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Card') {
      setActiveCard(event.active.data.current.card);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveCard) return;

    // Dropping a card over another card
    if (isActiveCard && isOverCard) {
      const activeColumnId =
        active.data.current?.columnId ||
        columns.find((col) => col.cards.some((card) => card.id === activeId))?.id ||
        '';
      const overColumnId = over.data.current?.columnId;
      
      const overCol = columns.find(c => c.id === overColumnId);
      if (!overCol) return;

      const overIndex = overCol.cards.findIndex(c => c.id === overId);
      
      // We do not commit to store on DragOver, but we might need to if we want real-time preview across columns.
      // For simpler implementation, we'll only handle real move in onDragEnd.
      // Wait, dnd-kit usually requires state updates in onDragOver for cross-container moves.
      // Let's implement moveCard in store to handle both.
      
      moveCard(activeId as string, overId as string, activeColumnId, overColumnId, overIndex);
    }

    // Dropping a card over an empty column
    if (isActiveCard && isOverColumn) {
      const activeColumnId =
        active.data.current?.columnId ||
        columns.find((col) => col.cards.some((card) => card.id === activeId))?.id ||
        '';
      const overColumnId = over.id as string;

      if (activeColumnId === overColumnId) return;

      const overCol = columns.find(c => c.id === overColumnId);
      if (!overCol) return;

      moveCard(activeId as string, overId as string, activeColumnId, overColumnId, overCol.cards.length);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';

    if (isActiveCard && isOverCard) {
      const activeColumnId = active.data.current?.columnId;
      const overColumnId = over.data.current?.columnId;
      
      // If it's the same column, reorder
      if (activeColumnId === overColumnId) {
        const col = columns.find(c => c.id === activeColumnId);
        if (!col) return;
        const overIndex = col.cards.findIndex(c => c.id === overId);
        moveCard(activeId as string, overId as string, activeColumnId, overColumnId, overIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full w-full overflow-x-auto p-4 gap-4 items-start bg-gray-50">
        {columns.map((col) => (
          <Column key={col.id} column={col} />
        ))}
        {isAddingColumn ? (
          <div className="flex-shrink-0 w-80 bg-white border-2 border-blue-300 rounded-lg p-3 shadow-sm">
            <input
              autoFocus
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddColumnSubmit();
                }
                if (e.key === 'Escape') {
                  setIsAddingColumn(false);
                  setNewColumnTitle('');
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-blue-500"
              placeholder="输入栏目名称"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnTitle('');
                }}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleAddColumnSubmit}
                className="px-3 py-1.5 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                新建
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddColumn}
            className="flex-shrink-0 w-80 h-12 bg-gray-200/50 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>添加新栏目</span>
          </button>
        )}
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeCard ? <CardItem card={activeCard} columnId="" /> : null}
      </DragOverlay>
      <button
        onClick={() => setClipboardListening(!clipboardListening)}
        className={`fixed bottom-6 right-6 z-40 rounded-full w-16 h-16 text-white shadow-xl flex items-center justify-center ${
          clipboardListening ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={clipboardListening ? '关闭监听剪贴板' : '开启监听剪贴板'}
      >
        <ClipboardPlus className="w-7 h-7" />
      </button>
    </DndContext>
  );
}
