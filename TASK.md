# MindVault 任务清单

## 项目概况

MindVault 是一个基于 Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 的灵感卡片管理应用，使用 @dnd-kit 提供拖拽排序能力，Supabase (PostgreSQL) 作为后端数据库。核心功能围绕卡片 CRUD、拖拽排序、多标签着色与筛选。数据库表为 `cards`，字段包括 id、title、content、url、tags(jsonb)、created_at、position，已配置完整的 RLS 策略确保公开读写可用。

## 已完成功能 (Completed)

- 卡片 CRUD：新增、编辑、删除卡片，支持标题、内容、链接三种字段
- 拖拽排序：卡片支持鼠标拖拽调整位置，position 持久化到 Supabase
- 标签系统：每张卡片支持多标签，每个标签可自选颜色，标签以 jsonb 格式存储

## 进行中与剩余待办 (Todo)

- 用户认证与多租户隔离（当前 RLS 为公开读写，如需上线需改造为基于 Auth 的隔离策略）
- 关键词全文搜索
- ✅ 卡片标签的颜色/命名统一管理（新增 `tags` 表，TagManagerModal 统一 CRUD，标签改名/改色自动同步到所有卡片）
- 卡片导出（Markdown / JSON）
- 暗色主题支持
- 移动端响应式优化（当前布局在小屏为单列，体验可进一步打磨）
- Vercel 一键部署配置（vercel.json + build 脚本验证）
- UI 组件库集成（考虑接入 shadcn/ui 统一 Dialog、AlertDialog、Badge 等组件样式）

## 关键文件地图

| 文件路径 | 作用 |
|----------|------|
| `src/app/page.tsx` | 主页面：数据流中枢，管理卡片列表、排序、拖拽状态，组装弹窗与网格渲染 |
| `src/components/AddCardModal.tsx` | 新增/编辑卡片弹窗，内含标签管理 UI（名称输入 + 颜色选择器） |
| `src/components/DeleteConfirmModal.tsx` | 删除确认弹窗，含 loading 状态与错误展示 |
| `src/components/SortableCard.tsx` | 可排序卡片组件，基于 @dnd-kit/sortable，展示内容、标签、拖拽手柄 |
| `src/types/card.ts` | 核心类型定义：Card、Tag |