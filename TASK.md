# MindVault 任务清单

## 项目概况

MindVault 是一个基于 Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 的灵感卡片管理应用，使用 @dnd-kit 提供拖拽排序能力，Supabase (PostgreSQL) 作为后端数据库。

## 已完成功能 (Completed)

- ✅ 卡片 CRUD：新增、编辑、删除卡片，支持标题、内容、链接三种字段
- ✅ 拖拽排序：卡片支持鼠标拖拽调整位置，position 持久化到 Supabase（修复了拖拽后位置不同步导致视图回弹的 bug）
- ✅ 标签系统：每张卡片支持多标签，每个标签可自选颜色，标签以 jsonb 格式存储
- ✅ 排序功能：三种模式（默认 position / 创建时间 / 更新时间）+ 正序/逆序切换，时间排序时自动禁用拖拽
- ✅ 关键词全文搜索：搜索范围包含标题、内容、链接，与标签筛选以 AND 逻辑共存，搜索图标位于导航栏右上角
- ✅ 标签颜色/命名统一管理：新增 `tags` 表存储标签定义，TagManagerModal 提供 CRUD 操作，标签改名/改色自动同步到所有已使用的卡片
- ✅ 标签筛选栏：支持多标签 AND 筛选，筛选按钮以标签颜色着色（未选中用半透明背景 + 全色文字，选中用加深背景 + 白字 + 文字阴影）
- ✅ 27 色预设色板：移除原生取色器，按色相排序的 27 色预设圆点，TagManagerModal 和 AddCardModal 共享同一份色板
- ✅ 排序栏与标签筛选栏背景统一为 `bg-white/70 backdrop-blur-xl shadow-sm`

## 剩余待办 (Todo)

- 用户认证与多租户隔离（当前 RLS 为公开读写，如需上线需改造为基于 Auth 的隔离策略）
- 卡片导出（Markdown / JSON）
- 暗色主题支持
- 移动端响应式优化（当前布局在小屏为单列，体验可进一步打磨）
- Vercel 一键部署配置（vercel.json + build 脚本验证）
- UI 组件库集成（考虑接入 shadcn/ui 统一 Dialog、AlertDialog、Badge 等组件样式）

## 关键文件地图

| 文件路径 | 作用 |
|----------|------|
| `src/app/page.tsx` | 主页面：数据流中枢，管理卡片列表、排序、筛选、搜索、拖拽状态，组装弹窗与网格渲染 |
| `src/components/AddCardModal.tsx` | 新增/编辑卡片弹窗，内含标签管理 UI（已有标签选择 + 新建标签表单 + 27 色预设） |
| `src/components/DeleteConfirmModal.tsx` | 删除确认弹窗，含 loading 状态与错误展示 |
| `src/components/SortableCard.tsx` | 可排序卡片组件，基于 @dnd-kit/sortable，展示内容、标签、时间、拖拽手柄 |
| `src/components/TagManagerModal.tsx` | 标签管理弹窗（CRUD），支持编辑名称/颜色并自动同步到所有卡片 |
| `src/types/card.ts` | 核心类型定义：Card、Tag、TagDefinition |
| `src/lib/tag-colors.ts` | 共享 27 色预设色板 + 默认颜色索引 |
| `src/lib/supabase.ts` | Supabase 客户端单例 |
| `supabase/rls-policies.sql` | 数据库迁移脚本：cards 表建表、position 列、tags 列 jsonb 迁移、RLS 策略 |
| `supabase/tags-migration.sql` | 数据库迁移脚本：tags 表建表 |
| `supabase/sort-migration.sql` | 数据库迁移脚本：cards 表新增 updated_at 列 |