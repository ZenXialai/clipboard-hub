# 剪贴板中转站 · Clipboard Hub

> 一块专门放「临时内容」的看板。复制过的文字、链接、代码、图片自动落进第一栏，设定的小时数一到就自己消失；要留住的，往别的栏一拖即可。

![version](https://img.shields.io/github/v/release/ZenXialai/clipboard-hub?label=release)
![license](https://img.shields.io/badge/license-MIT-blue)
![platform](https://img.shields.io/badge/platform-Windows%2010%2F11-lightgrey)
![stack](https://img.shields.io/badge/Electron-41%20%2B%20React%2018-1f6feb)

纯本地运行：无账号、无后端、无网络请求，所有数据保存在本机 `localStorage`。

---

## 目录

- [它解决什么问题](#它解决什么问题)
- [下载安装](#下载安装)
- [功能特性](#功能特性)
- [界面速览](#界面速览)
- [使用指南](#使用指南)
- [快捷键](#快捷键)
- [数据与隐私](#数据与隐私)
- [实现说明](#实现说明)
- [目录结构](#目录结构)
- [开发与构建](#开发与构建)
- [常见问题](#常见问题)
- [已知限制](#已知限制)
- [Roadmap](#roadmap)
- [License](#license)

## 它解决什么问题

Windows 自带的剪贴板历史（`Win + V`）只记得「最近 25 条」，一律平铺、不能分类、不能着色、不能只清一部分。真正的痛点是：你从网页复制的内容**本来就是临时的**——一段要粘到终端的命令、一个待会儿要打开的链接、一张要贴进文档的截图。它们混在你所有剪贴板内容里，越堆越多，最后你既不敢清空（怕丢东西），也懒得清理。

这个项目把「临时」变成一等公民：

1. **采集自动化**：开着监听，复制即入栏，不用切窗口、不用点任何按钮。
2. **时效自动化**：默认 24 小时（可调 1–168 小时）自动过期，第一栏是「漏斗」，只有值得留的才被你拖进长期栏。
3. **整理可视化**：多栏看板 + 5 种颜色 + 置顶，比一列平铺的列表更像「待办」而不是「垃圾堆」。

## 下载安装

到 [Releases](https://github.com/ZenXialai/clipboard-hub/releases) 下载最新安装包：

| 文件 | 说明 |
| --- | --- |
| `clipboard-hub-Setup-<version>.exe` | NSIS 安装包，双击安装，安装后生成桌面快捷方式 |

安装包未做代码签名，首次运行 Windows SmartScreen 可能提示「已保护你的电脑」——点「更多信息 → 仍要运行」即可。

卸载：设置 → 应用 → 剪贴板中转站 → 卸载，或在安装目录运行 `Uninstall 剪贴板中转站.exe`。

> 应用数据（卡片内容）不会被卸载程序清空，需要手动删除，见[数据与隐私](#数据与隐私)。

## 功能特性

**采集**

- **剪贴板监听**：右下角悬浮按钮一键开关，开着时每 1.2 秒检查一次剪贴板，新内容自动进第一栏顶部
- **文本 / 链接 / 代码 / 图片** 四种内容自动识别并打标签（识别规则见[实现说明](#实现说明)）
- **图片卡片**：从剪贴板读到位图就以 dataURL 存成卡片，点复制还原成真正的图片写回剪贴板
- **手动粘贴导入**：监听关着也能用——在页面空白处按 `Ctrl + V` 直接建卡
- **手动添加**：每个栏目底部有输入框，写点东西按回车就是一张卡片

**组织**

- **多栏看板**：新建 / 重命名 / 删除栏目，横向滚动，卡片跨栏拖拽（`@dnd-kit`，指针移动 5px 才触发拖动，不会误触）
- **临时栏 TTL**：下标为 0 的栏目是临时栏，卡片自带倒计时；拖到别的栏立刻变永久，拖回临时栏重新起算
- **颜色标记**：蓝 / 绿 / 黄 / 红 / 紫 5 色，一眼分优先级
- **置顶**：钉住的卡片永远排在该栏最上面
- **阅后即焚**：开启后，复制过的卡片自动删除，适合放密码、验证码这类一次性内容

**查找**

- **实时搜索**：标题栏搜索框即时过滤，命中片段用 `<mark>` 高亮
- **拼音搜索**：输入 `jqb` 也能找到「剪贴板中转站」（`pinyin-match`，支持全拼与首字母）
- **类型筛选**：全部 / 文本 / 链接 / 代码 / 图片

**自动清理**

- 每 60 秒扫一次过期卡片，移除后自动重排 `order`，不留空洞
- 临时栏卡片上实时显示剩余时间（如「3小时25分钟」），过期瞬间变「已过期」

## 界面速览

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▣ 剪贴板中转站   [🔍 搜索卡片内容 (支持拼音)...] [🏷️ 全部 ▾]  TTL[24]h  │
│                                        阅后即焚 关   监听剪贴板 关        │
├──────────────────┬──────────────────┬────────────────────┬───────────────┤
│ 待处理 (临时栏)   │ 已完成            │ + 新建栏目          │               │
│ ┌──────────────┐ │ ┌──────────────┐ │                    │               │
│ │ 🔗 链接       │ │ │ 📝 文本       │ │                    │               │
│ │ example.com  │ │ │ 会议纪要…     │ │                    │               │
│ │ ⏳ 23小时12分 │ │ │ 📌 已置顶     │ │                    │               │
│ └──────────────┘ │ └──────────────┘ │                    │               │
│ ┌──────────────┐ │                  │                    │               │
│ │ 💻 代码       │ │                  │                    │               │
│ └──────────────┘ │                  │                    │               │
│ [+ 添加卡片]      │ [+ 添加卡片]      │                    │      ◉ 监听中  │
└──────────────────┴──────────────────┴────────────────────┴───────────────┘
```

顶栏：

| 控件 | 作用 |
| --- | --- |
| 搜索框 | 内容过滤，支持中文 + 全拼 + 首字母拼音 |
| 类型下拉 | 按卡片类型过滤（与搜索是「与」关系） |
| `TTL [__] h` | 临时栏卡片的存活小时数，输入即生效，范围 1–168，失焦回填 |
| 阅后即焚 | 复制后删除卡片 |
| 监听剪贴板 | 等价于右下角悬浮按钮 |
| 设置图标 | 占位，见[已知限制](#已知限制) |

## 使用指南

### 第一次用，建议这样上手

1. 启动后默认有两栏：**待处理**（即临时栏，左侧）和**已完成**。
2. 点右下角蓝色悬浮按钮开启监听（变绿）——之后你在任何地方复制的内容都会自动出现在「待处理」顶部。
3. 顶栏 `TTL` 改成你习惯的小时数（默认 24）。**从此刻起新进临时栏的卡片**按新值计时，已存在的卡片不会重算。
4. 值得留下的卡片拖到「已完成」或你自建的其他栏，它就变成永久卡片。
5. 想长期分类就在右边点「+ 新建栏目」，例如「命令片段」「待读链接」「工单号」。

### 临时栏（TTL）的完整规则

| 场景 | `expiresAt` 怎么算 |
| --- | --- |
| 新卡片进临时栏（第一栏） | `now + cardTTLHours × 3600000` |
| 新卡片进其他栏 | `Number.MAX_SAFE_INTEGER`（永不过期） |
| 从其他栏拖入临时栏 | 按当前 TTL **重新起算** |
| 从临时栏拖出到其他栏 | 变为永不过期 |
| 在同一栏内拖拽排序 | 不变 |
| 修改 TTL 数值 | 只影响**之后**创建的卡片，不追溯已有卡片 |
| 删除临时栏 | 第一栏变成原来的第二栏，它随即成为新的临时栏 |

> 临时栏的身份由**下标**决定，不是由名字决定：把第一栏改名成「命令」它依然是临时栏；删掉它，第二栏自动接棒。

### 跨栏拖拽

按住卡片拖动，指针移动超过 5px 才开始拖，所以点击、双击不会误拖。拖到目标栏的空白处是插到末尾，拖到某张卡片上是插到那张卡片的位置；拖动时原位置保留虚线占位，被拖卡片变半透明。

### 图片卡片

图片在卡片里按等比缩放到最大 52px 高显示，多余部分不裁剪。点复制按钮时先把 dataURL 转成 Blob，再用 `ClipboardItem` 写回系统剪贴板——粘到 Word / 微信里是真正的图片，而不是一串 base64。写图片失败（个别环境不支持）会退化成复制文本。

### 阅后即焚

开启后，任何一次「复制」成功都会删掉那张卡片。它和临时栏 TTL 是两套独立机制，可以叠加：既会到期消失，也会复制即消失。

## 快捷键

| 快捷键 | 位置 | 行为 |
| --- | --- | --- |
| `Ctrl + V` | 页面空白处（焦点不在输入框/文本域/下拉框/可编辑区） | 读系统剪贴板，建一张卡片到临时栏顶部 |
| `Ctrl + V` | 输入框内 | 不拦截，正常粘贴文字 |
| `Ctrl + Shift + V` | 任意位置 | 强制走「建卡片」逻辑 |
| `Enter` | 新建栏目输入框 | 确认创建 |
| `Esc` | 新建栏目输入框 | 取消创建 |

> `Ctrl + V` 的拦截只发生在页面层：对输入框内的普通粘贴完全放行，不会抢走原生行为。

## 数据与隐私

- **没有任何网络请求**：应用不含上报、不含自动更新、不含第三方字体/CDN，断网可完整使用。
- **数据位置**：`localStorage`，键名 `clipboard-hub-storage`；在安装版里落地为
  `%APPDATA%\剪贴板中转站\Local Storage\leveldb\`（开发模式下是 Electron 的默认 userData 目录）。
- **彻底清空**：退出应用后删除上述目录下 `Local Storage` 文件夹即恢复出厂状态（会一并丢失所有栏目与卡片）。
- **图片体积**：图片以 base64 存在 `localStorage` 里，浏览器配额通常 5–10MB，塞满后的写入会**静默失败**（卡片看起来没加上）。大量存图请等后续版本换 IndexedDB。
- **敏感内容**：本应用会把剪贴板内容落盘保存，介意的话请用「阅后即焚」或定期清空；不要在这台机器的剪贴板里复制密钥。

## 实现说明

### 进程分工

| 进程 | 职责 |
| --- | --- |
| 主进程 `electron/main.ts` | 创建 1200×800 窗口（最小 800×600、隐藏菜单栏）、提供剪贴板快照与版本号 IPC、代理打开外部链接 |
| 预加载 `electron/preload.ts` | `contextBridge` 暴露 `window.electronAPI`（`getAppVersion` / `readClipboardSnapshot` / `on` / `send`），渲染进程没有 Node 权限（`nodeIntegration: false`、`contextIsolation: true`） |
| 渲染进程 `src/` | 全部业务逻辑与 UI（React 18 + Tailwind） |

### IPC 一览

| 通道 | 类型 | 说明 |
| --- | --- | --- |
| `get-app-version` | `invoke` | 返回 `app.getVersion()`，即 `package.json` 的 version |
| `clipboard-read-snapshot` | `invoke` | 先试 `clipboard.readImage()`，非空则返回 `{ type: 'image', content: dataURL, signature: sha1 }`；否则读文本，返回 `{ type: 'text', content, signature }`；都为空时 `{ type: 'empty' }` |
| `open-external` | `send` | 主进程 `shell.openExternal(url)`，链接卡片上「浏览器打开」用 |
| `main-process-message` | 主 → 渲染 | 窗口加载完成后推送一次时间戳（模板残留，未使用） |

### 为什么是轮询

Electron 的 `clipboard` 模块在 Windows 上**没有变更事件**（没有 `clipboard.on('change')` 这种东西），只能读快照。所以渲染进程用 `setInterval` 每 1200ms 调一次 `clipboard-read-snapshot`，拿回来的 `sha1` 签名与上一次比对，相同就跳过——这就是「去重」的全部实现。

代价：复制后最多约 1.2 秒才出现；每 1.2 秒一次 IPC（开销极小，但确实不是事件驱动）。

### 状态模型

```ts
Card   = { id, content, type, color, isPinned, createdAt, updatedAt, order, expiresAt }
Column = { id, title, cards[], createdAt, order }
AppState = { columns[], settings{ theme, autoDetectType, burnAfterCopy, cardTTLHours, clipboardListening }, version }
```

- `type`: `'link' | 'code' | 'text' | 'image'`
- `color`: `'blue' | 'green' | 'yellow' | 'red' | 'purple'`
- 默认 `cardTTLHours = 24`、`burnAfterCopy = false`、`clipboardListening = false`（**首次启动不会自动偷听剪贴板**）

持久化用 `zustand/middleware` 的 `persist`，整个 `{ columns, settings, version }` 一起落盘。旧版本数据缺少 `order` / `expiresAt` 时，由自定义 `merge` 迁移：缺 `order` 的按数组下标补齐、第一栏的卡片回填 `createdAt + TTL`、其余栏一律 `MAX_SAFE_INTEGER`，所以升级不会丢卡片。

### 内容类型识别

`detectContentType()` 的规则，从上到下命中即返回：

| 类型 | 判定 |
| --- | --- |
| `link` | 整段匹配 `/^https?:\/\/[^\s/$.?#].[^\s]*$/i` |
| `code` | 任一命中：以 `function/const/let/var/class/import/export ` 开头；含 `{}[];`；以 `def/class/import ` 开头；整段是 `<tag>…</tag>`；以 `;` 结尾；含 `=>` |
| `text` | 其余全部 |

图片类型不经过这个函数：它由快照的 `type: 'image'` 或粘贴事件的 `image/*` MIME 直接指定。

## 目录结构

```
├─ electron/
│  ├─ main.ts             窗口创建、剪贴板快照 IPC、open-external、退出策略
│  └─ preload.ts          contextBridge → window.electronAPI
├─ src/
│  ├─ main.tsx            React 挂载入口
│  ├─ App.tsx             HashRouter 路由壳（`/` 首页、`/other` 占位、其余重定向到首页）
│  ├─ pages/
│  │  └─ Home.tsx         顶栏（搜索 / 类型筛选 / TTL / 阅后即焚 / 监听开关）+ Board
│  ├─ components/
│  │  ├─ Board.tsx        DndContext、剪贴板轮询、Ctrl+V 与 paste 拦截、过期定时器、监听悬浮按钮
│  │  ├─ Column.tsx       栏目：改名 / 删除 / 加卡片 / 作为放置目标
│  │  ├─ CardItem.tsx     卡片：复制 / 改色 / 置顶 / 删除 / 倒计时 / 拼音高亮
│  │  └─ Empty.tsx        通用空状态占位（模板遗留，当前未被引用）
│  ├─ store/
│  │  ├─ useStore.ts      业务状态 + persist + 数据迁移
│  │  └─ useUIStore.ts    搜索词、类型筛选（不落盘）
│  ├─ types/index.ts      Card / Column / AppState
│  ├─ utils/index.ts      detectContentType、formatCodeContent、formatRemaining
│  ├─ hooks/useTheme.ts   亮/暗主题钩子（尚未接入界面）
│  ├─ lib/utils.ts        cn() = clsx + tailwind-merge
│  └─ vite-env.d.ts       window.electronAPI 的类型声明
├─ docs/
│  ├─ prd.md              初版产品设计稿（以代码为准）
│  └─ architecture.md     初版技术方案（以代码为准）
├─ public/favicon.svg
├─ vite.config.ts         Vite + vite-plugin-electron（开发时自动拉起 Electron 窗口）
└─ package.json           electron-builder 配置也在里面（build 字段）
```

## 开发与构建

环境：Node 18+ / 20+，Windows（打包目标只有 Windows）。

```bash
npm install          # 安装依赖（会下载 Electron 二进制，约 100MB）
npm run dev          # Vite 起渲染进程并自动拉起 Electron 窗口（热更新）
npm run dev:web      # 只在浏览器里跑 UI，没有 electronAPI，剪贴板能力降级
npm run check        # tsc -b --noEmit 类型检查（CI 只跑这个）
npm run lint         # ESLint
npm run build:win    # tsc -b && vite build && electron-builder --win
```

| 脚本 | 实际命令 |
| --- | --- |
| `dev` | `vite`（`vite-plugin-electron` 会同时编译 `electron/*.ts` 并启动窗口） |
| `dev:web` | `cross-env VITE_DISABLE_ELECTRON=1 vite` |
| `build` | `tsc -b && vite build && electron-builder`（当前平台） |
| `build:win` | `tsc -b && vite build && electron-builder --win` |
| `check` | `tsc -b --noEmit` |

打包配置（`package.json` → `build`）：`appId: com.clipboard.hub`、`productName: 剪贴板中转站`、目标 `nsis`、只打进 `dist/**` 与 `dist-electron/**`，产物输出到 `release/`。安装包体积约 100MB（主要是 Electron 运行时），`release/win-unpacked/` 是免安装的解包版，可直接跑 `剪贴板中转站.exe`。

## 常见问题

**复制了但卡片没出现？**
依次检查：右下角悬浮按钮是不是绿的（监听开启）；内容是否与上一次完全相同（相同则被 `sha1` 去重跳过）；复制的是不是纯图片且体积过大（静默失败）；是否超过 1.2 秒还没到下一次轮询。

**复制了文字，结果出现两张卡片？**
监听开着时又在页面里按了 `Ctrl + V`，两条路都会建卡。要么关监听只用 `Ctrl+V`，要么只用监听。

**卡片突然全没了？**
临时栏的 TTL 到了（默认 24 小时）。已拖到其他栏的不会消失；如果连永久栏都空了，多半是 `localStorage` 被清理或被别的程序清过。

**图片卡片过一段时间变成空白？**
`localStorage` 配额写满后新图写入会失败；另外清除浏览器数据的工具（CCleaner 之类）会顺手清掉 Electron 的 Local Storage。

**安装时提示不安全的文件 / SmartScreen 拦截？**
安装包没有代码签名证书（个人项目，签名要按年付费）。点「更多信息 → 仍要运行」；不放心可以直接 `npm install && npm run build:win` 自己构建。

**能装在 macOS / Linux 上吗？**
代码里没有硬编码 Windows API，但只配置了 `nsis` 目标、也没测过，`titleBarStyle: 'hiddenInset'` 本来就是 macOS 的值。要跨平台得自己补 `dmg` / `AppImage` 配置并实测。

**为什么复制内容会落盘？不怕泄露吗？**
这是设计取舍：不落盘就做不到「重启后卡片还在」。所有数据只在本机，程序不发任何网络请求。真要放密码，建议用「阅后即焚」，或别把它当密码管理器。

## 已知限制

1. **图片存 base64 在 `localStorage`**，多图会撞 5–10MB 配额，超限写入静默失败；应改 IndexedDB 或落盘文件。
2. **监听是 1.2 秒轮询**，不是系统事件，复制后最多约 1 秒才出现，且持续占用一次 IPC。
3. **`titleBarStyle: 'hiddenInset'` 是 macOS 专用值**，Windows 上不生效；窗口顶栏拖拽靠 CSS `-webkit-app-region: drag` 实现。
4. **设置入口是空的**：PRD 里的 `/settings`（导入 / 导出 / 清空 / 主题）未落地，`useTheme` 钩子和 `settings.theme` 字段已存在但未接入界面。
5. **`formatCodeContent` 未使用**：代码卡片目前用固定的深色 `pre` 样式，没有真正做缩进重排。
6. **只打包 Windows**，未做 macOS / Linux 产物，也未做自动更新与代码签名。
7. **数据只在单机单实例**：两个窗口同时开不会同步（各自写自己的 `localStorage` 快照），也没有导入导出。

## Roadmap

- [ ] 图片改存 IndexedDB / 磁盘，突破配额
- [ ] 设置页：导入 / 导出 JSON、一键清空、主题切换
- [ ] 用 Windows 剪贴板监听（原生 hook）替代 1.2 秒轮询
- [ ] 全局快捷键唤醒窗口、托盘图标常驻
- [ ] 卡片内编辑、批量选择与批量删除
- [ ] macOS / Linux 构建与自动更新

## 贡献

Issue 和 PR 都欢迎：[github.com/ZenXialai/clipboard-hub/issues](https://github.com/ZenXialai/clipboard-hub/issues)。提交前请保证 `npm run check` 与 `npm run lint` 通过。

## License

[MIT](LICENSE) © 2026 ZenXialai
