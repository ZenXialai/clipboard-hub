import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useUIStore } from '@/store/useUIStore';
import { Card } from '@/types';
import { Copy, Trash2, Pin, Edit3, Type, Link, Code, GripVertical, ExternalLink, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatRemaining } from '@/utils';
import PinyinMatch from 'pinyin-match';

interface CardItemProps {
  card: Card;
  columnId: string;
}

const colorMap = {
  blue: 'bg-white border-blue-200 hover:border-blue-400',
  green: 'bg-green-50 border-green-200 hover:border-green-400',
  yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
  red: 'bg-red-50 border-red-200 hover:border-red-400',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
};

const badgeColorMap = {
  link: 'bg-blue-100 text-blue-700',
  code: 'bg-green-100 text-green-700',
  text: 'bg-gray-100 text-gray-700',
  image: 'bg-purple-100 text-purple-700',
};

export default function CardItem({ card, columnId }: CardItemProps) {
  const deleteCard = useStore((state) => state.deleteCard);
  const updateCard = useStore((state) => state.updateCard);
  const burnAfterCopy = useStore((state) => state.settings.burnAfterCopy);
  const temporaryColumnId = useStore((state) => state.columns[0]?.id || '');
  const isTemporaryCard = columnId === temporaryColumnId;

  const { searchQuery, filterType } = useUIStore();

  const [showColors, setShowColors] = useState(false);
  const [, setTick] = useState(0);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
      columnId,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    if (!isTemporaryCard) return;
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [isTemporaryCard]);

  const isTypeMatch = filterType === 'all' || card.type === filterType;
  const matchResult = searchQuery ? PinyinMatch.match(card.content, searchQuery) : null;
  const isSearchMatch = !searchQuery || matchResult !== false;
  const isMatch = isTypeMatch && isSearchMatch;

  const handleCopy = async () => {
    if (card.type === 'image' && card.content.startsWith('data:image/')) {
      try {
        const response = await fetch(card.content);
        const blob = await response.blob();
        const mimeType = blob.type || 'image/png';
        await navigator.clipboard.write([
          new ClipboardItem({
            [mimeType]: blob,
          }),
        ]);
      } catch {
        await navigator.clipboard.writeText(card.content);
      }
    } else {
      await navigator.clipboard.writeText(card.content);
    }
    if (burnAfterCopy) {
      deleteCard(columnId, card.id);
    }
  };

  const TypeIcon =
    card.type === 'link' ? Link : card.type === 'code' ? Code : card.type === 'image' ? ImageIcon : Type;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, display: isMatch ? 'block' : 'none' }}
        className="opacity-50 border-2 border-dashed border-blue-400 rounded-lg h-[100px] bg-blue-50"
      />
    );
  }

  const renderContent = () => {
    if (card.type === 'image') {
      return <img src={card.content} alt="clipboard" className="w-full max-h-52 object-contain rounded-md bg-white/60" />;
    }

    if (card.type === 'code') {
      return (
        <pre className="text-xs bg-gray-900 text-green-400 font-mono p-3 rounded-md whitespace-pre-wrap break-words overflow-hidden max-h-56 overflow-y-auto">
          {card.content}
        </pre>
      );
    }

    if (searchQuery && matchResult && Array.isArray(matchResult)) {
      const start = matchResult[0];
      const end = matchResult[1];
      const before = card.content.slice(0, start);
      const match = card.content.slice(start, end + 1);
      const after = card.content.slice(end + 1);
      return (
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-hidden line-clamp-4">
          {before}
          <mark className="bg-yellow-300 text-gray-900 rounded-sm px-0.5">{match}</mark>
          {after}
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-hidden line-clamp-4">
        {card.content}
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={{ ...style, display: isMatch ? 'block' : 'none' }}
      className={clsx(
      "relative group rounded-lg p-3 border shadow-sm transition-all flex flex-col",
      colorMap[card.color]
    )}>
      {card.isPinned && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-0.5"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className={clsx("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", badgeColorMap[card.type])}>
            <TypeIcon className="w-3 h-3" />
            {card.type.toUpperCase()}
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button onClick={handleCopy} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="复制">
            <Copy className="w-3.5 h-3.5" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowColors(!showColors)}
              className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded" 
              title="颜色"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {showColors && (
              <div className="absolute right-0 top-full mt-1 bg-white border shadow-lg rounded p-1 flex gap-1 z-10">
                {(Object.keys(colorMap) as Card['color'][]).map(c => (
                  <button
                    key={c}
                    className={clsx("w-4 h-4 rounded-full border", colorMap[c].split(' ')[0])}
                    onClick={() => {
                      updateCard(columnId, card.id, { color: c });
                      setShowColors(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => updateCard(columnId, card.id, { isPinned: !card.isPinned })}
            className={clsx("p-1 rounded", card.isPinned ? "text-yellow-500 bg-yellow-50" : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50")}
            title={card.isPinned ? "取消置顶" : "置顶"}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => deleteCard(columnId, card.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="删除">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {renderContent()}

      {/* Magic Extraction Bottom Actions */}
      {card.type === 'link' && (
        <div className="mt-3 flex">
          <button
            onClick={() => window.electronAPI ? window.electronAPI.send('open-external', card.content) : window.open(card.content, '_blank', 'noopener,noreferrer')}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded-md text-xs font-medium transition-colors border border-blue-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ↗️ 浏览器打开
          </button>
        </div>
      )}

      {isTemporaryCard && (
        <div className="mt-2 text-[11px] text-gray-500">
          生存倒计时：{formatRemaining(card.expiresAt)}
        </div>
      )}
    </div>
  );
}
