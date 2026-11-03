import Board from '@/components/Board';
import { Settings, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';

export default function Home() {
  const burnAfterCopy = useStore((state) => state.settings.burnAfterCopy);
  const cardTTLHours = useStore((state) => state.settings.cardTTLHours);
  const clipboardListening = useStore((state) => state.settings.clipboardListening);
  const setBurnAfterCopy = useStore((state) => state.setBurnAfterCopy);
  const setCardTTLHours = useStore((state) => state.setCardTTLHours);
  const setClipboardListening = useStore((state) => state.setClipboardListening);
  
  const { searchQuery, setSearchQuery, filterType, setFilterType } = useUIStore();
  
  const [ttlInput, setTtlInput] = useState(String(cardTTLHours));

  useEffect(() => {
    setTtlInput(String(cardTTLHours));
  }, [cardTTLHours]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 select-none drag-region">
        <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2 whitespace-nowrap">
          <span className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-sm">C</span>
          剪贴板中转站
        </h1>

        <div className="no-drag-region flex-1 max-w-xl mx-8 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索卡片内容 (支持拼音)..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 hover:bg-gray-200/80 focus:bg-white border-2 border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-all shadow-sm focus:shadow-md"
            />
          </div>
          <div className="relative">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="appearance-none bg-gray-100 hover:bg-gray-200/80 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm pl-4 pr-10 py-2 outline-none transition-all shadow-sm focus:shadow-md cursor-pointer text-gray-700 font-medium"
            >
              <option value="all">🏷️ 全部</option>
              <option value="text">📝 文本</option>
              <option value="link">🔗 链接</option>
              <option value="code">💻 代码</option>
              <option value="image">🖼️ 图片</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div className="no-drag-region flex items-center gap-3">
          <label className="text-xs text-gray-600 flex items-center gap-2">
            倒计时(小时)
            <input
              value={ttlInput}
              onChange={(event) => setTtlInput(event.target.value)}
              onBlur={() => setCardTTLHours(Number(ttlInput))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setCardTTLHours(Number(ttlInput));
                }
              }}
              className="w-14 px-2 py-1 border border-gray-200 rounded-md outline-none focus:border-blue-500"
            />
          </label>
          <button
            onClick={() => setBurnAfterCopy(!burnAfterCopy)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              burnAfterCopy ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            阅后即焚 {burnAfterCopy ? '开' : '关'}
          </button>
          <button
            onClick={() => setClipboardListening(!clipboardListening)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              clipboardListening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            监听剪贴板 {clipboardListening ? '开' : '关'}
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Board />
      </main>
    </div>
  );
}
