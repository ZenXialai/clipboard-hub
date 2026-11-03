import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Column as ColumnType } from '@/types';
import CardItem from './CardItem';
import { MoreHorizontal, Plus, Trash2, Edit2 } from 'lucide-react';
import { detectContentType } from '@/utils';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  column: ColumnType;
}

export default function Column({ column }: ColumnProps) {
  const deleteColumn = useStore((state) => state.deleteColumn);
  const renameColumn = useStore((state) => state.renameColumn);
  const addCard = useStore((state) => state.addCard);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const sortedCards = useMemo(() => {
    return [...column.cards].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // maintain relative order
    });
  }, [column.cards]);

  const cardIds = useMemo(() => sortedCards.map((c) => c.id), [sortedCards]);

  useEffect(() => {
    if (isAddingCard && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAddingCard]);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      renameColumn(column.id, editTitle.trim());
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleAddCardSubmit = () => {
    if (newCardContent.trim()) {
      const type = detectContentType(newCardContent);
      addCard(column.id, newCardContent.trim(), type);
      setNewCardContent('');
      setIsAddingCard(false);
    } else {
      setIsAddingCard(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg flex flex-col max-h-full">
      {/* Column Header */}
      <div className="p-3 flex justify-between items-center group relative">
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 px-2 py-1 text-sm font-semibold rounded border-blue-500 outline-none"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsEditing(true)}>
            <h3 className="font-semibold text-gray-700 truncate">{column.title}</h3>
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
              {column.cards.length}
            </span>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-100 z-20 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                >
                  <Edit2 className="w-3.5 h-3.5" /> 重命名
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={() => { deleteColumn(column.id); setShowMenu(false); }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除栏目
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-3 pt-0 flex flex-col gap-3 min-h-[100px]" ref={setNodeRef}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <CardItem key={card.id} card={card} columnId={column.id} />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <div className="p-3 pt-0">
        {isAddingCard ? (
          <div className="bg-white rounded-lg p-2 border border-blue-400 shadow-sm flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              className="w-full text-sm outline-none resize-none min-h-[60px]"
              placeholder="粘贴或输入内容..."
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCardSubmit();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded"
                onClick={() => { setIsAddingCard(false); setNewCardContent(''); }}
              >
                取消
              </button>
              <button
                className="text-xs px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded"
                onClick={handleAddCardSubmit}
              >
                添加
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full py-2 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-md transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加卡片
          </button>
        )}
      </div>
    </div>
  );
}
