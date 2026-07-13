# 优化 Popup：Mock / Capture / Header 三 Tab + 全局 Header 注入

## 目标
把 popup 顶部现有的两个开关（Mock 全局、Capture 录制）改造成三个 Tab：
**Capture · Mock · Header**，分别对应三个模块。新增 Header 模块，可添加/管理
请求头并支持启用/停用；开启后所有 XHR/Fetch 请求都会带上对应的 header 值。

## 决策（已确认）
- 全局 Header 作用范围：**仅 XHR/Fetch**（`resourceTypes: [XMLHTTPREQUEST]`），与现有抓包范围一致。
- Mock 标签页：**轻量管理**（列表 + 逐条启用/停用 + 命中数 + 打开 dashboard 编辑）。

## 数据模型（types.ts）
新增：
```ts
export interface GlobalHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}
```
存储 key（放到一个共享常量文件或直接在各处定义，沿用现有风格）：
- `globalHeaders: GlobalHeader[]`
- `globalHeadersEnabled: boolean`（缺省 OFF）

## 后台注入（background.ts）
现有 `SET_REQUEST_HEADERS` 用的是 DNR session rule `ruleId=1`（dashboard 回放单个 URL 用）。
全局 Header 用**独立的 rule id `2`**，避免和回放规则冲突。

新增函数 `applyGlobalHeaderRule()`：
- 从 `chrome.storage.local` 读 `globalHeadersEnabled` + `globalHeaders`。
- 若关闭或无启用项 → `updateSessionRules({ removeRuleIds: [2] })`。
- 否则构造一条 rule：
  - `id: 2`, `priority: 1`（低于回放的 999，回放临时规则可覆盖同名 header）。
  - action: `MODIFY_HEADERS`，`requestHeaders` = 每个启用项 `{ header, operation: SET, value }`。
  - condition: `urlFilter: '*'`（或省略 urlFilter 用 `resourceTypes` 约束），`resourceTypes: [XMLHTTPREQUEST]`。
- 调用时机：
  1. `chrome.storage.onChanged` 监听 `globalHeaders` / `globalHeadersEnabled` 变化时重建。
  2. `chrome.runtime.onInstalled` 及 `chrome.runtime.onStartup` 时重建（SW 重启后恢复）。
  3. `onInstalled` 里现有的 `removeRuleIds:[1]` 保留；额外确保 `2` 状态正确。

## Popup 改造（popup.tsx）
顶部 header 区：保留 Logo，右侧移除两个 switch，改为**三个 Tab 按钮**（Capture / Mock / Header）。
新增 `activeTab` 状态（'capture' | 'mock' | 'header'），默认 'capture'。

### Capture Tab（原主体）
- 顶部一行放录制开关（沿用现有 `isRecording` toggle 样式，从 header 移到此 tab 内）。
- 搜索框 + 日志列表 + 底部 Clear / Open Dashboard（保持现状）。

### Mock Tab
- 顶部：全局 Mock 开关（沿用 `mockGlobalEnabled`）。
- 列表：读取 `mockRules`，每条显示 name、method、urlPattern、hitCount，右侧一个启用/停用小开关（复用 App.tsx 的切换逻辑：`enabled: !enabled` 写回 `mockRules`）。
- 空状态：提示去 dashboard 新建。
- 底部：Open Dashboard 按钮（`panel.html`）。

### Header Tab（新）
- 顶部：全局 Header 主开关（`globalHeadersEnabled`）。
- 列表：`globalHeaders` 每行 = [启用 checkbox] [key input] [value input] [删除]。
  - 编辑即写回 `chrome.storage.local`（`background` 监听自动重建 DNR 规则）。
- 底部：`+ Add Header` 按钮，追加一条空 `GlobalHeader`。
- 提示文案：开启后所有 XHR/Fetch 请求会带上已启用的 header。

状态与 storage 同步：在现有 `useEffect` 的 `get` 和 `onChanged` listener 中补充
`globalHeaders` / `globalHeadersEnabled` / `mockRules` 的读取与订阅。

## 样式
- Tab 栏：深色 header 下方一行，选中项高亮（绿色下划线/底色，沿用现有 green-500 主题）。
- popup 宽度维持 `w-80`，高度 `h-[500px]`；各 tab 内容区 `flex-1 overflow-y-auto`。

## i18n（_locales/en + zh_CN）
新增 key：`headerTab`、`globalHeaderEnable`、`globalHeaderHint`、`addHeader`、
`headerKeyPlaceholder`、`headerValuePlaceholder`、`headerListEmpty`、
`mockRulesTitle`（如需）等。en 英文、zh_CN 中文。复用已有 `captureTab`/`mockTab`。

## 构建验证
`npm run build`（vite）确认无 TS/构建错误。手动说明加载 dist 到 Chrome 验证三 tab 与 header 注入。

## 涉及文件
- `types.ts`：新增 `GlobalHeader`。
- `background.ts`：全局 header DNR 规则（id=2）+ onStartup。
- `popup.tsx`：三 tab 重构 + Header/Mock 面板。
- `_locales/en/messages.json`、`_locales/zh_CN/messages.json`：新增文案。
- （可选）新建 `globalHeaderUtils.ts` 存放常量/工厂，或直接内联。

## 不在范围
- 不改 mock-injector / mock-bridge（Mock 逻辑复用现有）。
- 不做 header 的 URL 精确匹配 / 分组（后续可扩展）。
