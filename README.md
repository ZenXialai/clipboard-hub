# 剪贴板中转站 (Clipboard Hub)

> Windows 桌面看板式剪贴板管理器 —— 把复制过的文字、链接、代码、图片收进多栏看板，用完即走、自动过期。

纯本地运行，无账号、无后端、无网络请求，数据存在 `localStorage`。

---

## 功能

- **多栏看板**：任意新建 / 重命名 / 删除栏目，卡片跨栏拖拽（`dnd-kit`）
- **剪贴板监听**：开启后自动捕获新内容并塞进第一栏（临时栏）
- **临时栏 TTL**：第一栏的卡片按设定小时数倒计时，到点自动清理；拖到其他栏即变永久
- **内容类型识别**：链接 / 代码 / 文本 / 图片自动打标签，并按类型筛选
- **图片卡片**：从剪贴板读图，以 dataURL 存储，复制按钮可还原成图片写回剪贴板
- **拼音搜索**：输入 `jt` 也能搜到「剪贴板」（`pinyin-match`），命中处高亮
- **颜色 + 置顶**：5 色标记优先级，置顶卡片固定栏顶
- **阅后即焚**：复制一次后自动删除卡片
- **快捷键**：非输入框内 `Ctrl+V` 直接把剪贴板内容加成卡片

## 核心机制

| 机制 | 实现 |
| --- | --- |
| 临时栏判定 | 下标为 0 的栏目是「临时栏」，新卡片 `expiresAt = now + cardTTLHours`；其他栏为 `Number.MAX_SAFE_INTEGER`（永不过期）。跨栏拖拽时按目标栏重算 TTL。 |
| 过期清理 | `removeExpiredCards()` 每 60 秒执行一次，同时重排 `order`。 |
| 剪贴板监听 | Electron 的 `clipboard` 模块在 Windows 没有变更事件，因此主进程用 `ipcMain.handle('clipboard-read-snapshot')` 暴露快照，渲染进程每 1200ms 轮询一次，用内容的 `sha1` 做签名去重。 |
| 持久化 | `zustand/middleware` 的 `persist`，key 为 `clipboard-hub-storage`；自定义 `merge` 为旧数据补 `order`、回填 `expiresAt`。 |

## 技术栈

Electron 41 · React 18 · TypeScript 5.8 · Vite 6 · Tailwind CSS 3 · zustand 5 · @dnd-kit · lucide-react · electron-builder

## 目录结构

```
├─ electron/           主进程
│  ├─ main.ts          窗口创建、剪贴板快照 IPC、打开外部链接
│  └─ preload.ts       contextBridge 暴露 window.electronAPI
├─ src/
│  ├─ pages/Home.tsx   顶栏：搜索、类型筛选、TTL、阅后即焚、监听开关
│  ├─ components/
│  │  ├─ Board.tsx     DndContext、剪贴板轮询与 Ctrl+V 拦截、过期定时器
│  │  ├─ Column.tsx    栏目（改名、删除、加卡片）
│  │  └─ CardItem.tsx  卡片（复制、改色、置顶、删除、倒计时）
│  ├─ store/           useStore（持久化业务状态）、useUIStore（搜索/筛选）
│  ├─ utils/           detectContentType、formatRemaining
│  ├─ types/           Card / Column / AppState
│  └─ hooks/useTheme.ts
├─ docs/               PRD 与架构说明
└─ vite.config.ts      Vite + vite-plugin-electron
```

## 快速开始

```bash
npm install
npm run dev        # Vite 起渲染进程，自动拉起 Electron 窗口
npm run dev:web    # 只跑浏览器端（无 Electron API，剪贴板能力降级）
npm run check      # tsc --noEmit 类型检查
npm run build:win  # tsc + vite build + electron-builder，产物在 release/
```

安装包输出：`release/剪贴板中转站 Setup <version>.exe`。

## 已知限制

- 图片以 base64 存在 `localStorage`，多图会撞到浏览器 5–10MB 配额，写入是静默失败的；后续应改用 IndexedDB 或落盘。
- 剪贴板监听是 1.2s 轮询，不是系统事件，复制后最多约 1 秒才出现在临时栏。
- `main.ts` 中的 `titleBarStyle: 'hiddenInset'` 是 macOS 专用值，Windows 上不生效（顶栏拖拽由 CSS `-webkit-app-region: drag` 实现）。
- 设置按钮尚未实现，PRD 里的 `/settings` 页面（导入 / 导出 / 清空）未落地。
- 仅针对 Windows 打包，未做 macOS / Linux 产物配置。

## License

[MIT](LICENSE) © 2026 ZenXialai
