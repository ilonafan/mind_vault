# MindVault 架构说明

## 数据库表结构

### `cards` 表 (Supabase PostgreSQL)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK) | 主键，由 Supabase 自动生成 |
| `title` | `text` | 卡片标题，**必填** |
| `content` | `text` | 卡片正文，可为空 |
| `url` | `text` | 链接，可为空 |
| `tags` | `jsonb` | 标签数组，格式 `[{ "name": "标签名", "color": "#6366F1" }]`，可为空 |
| `created_at` | `timestamptz` | 创建时间，默认 `now()` |
| `updated_at` | `timestamptz` | 最后更新时间，默认 `now()`，由 sort-migration.sql 新增 |
| `position` | `integer` | 拖拽排序位置，用于自定义排序，默认 0 |

**RLS 策略**: 当前为公开读写（`USING (true)` / `WITH CHECK (true)`），无用户认证。
**迁移脚本**: `supabase/rls-policies.sql` — 建表及初始迁移；`supabase/sort-migration.sql` — 新增 updated_at 列。

### `tags` 表 (Supabase PostgreSQL)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK) | 主键，由 Supabase 自动生成 |
| `name` | `text` | 标签名称，**唯一** |
| `color` | `text` | 十六进制颜色值，如 `#6366F1` |
| `created_at` | `timestamptz` | 创建时间，默认 `now()` |

**RLS 策略**: 当前为公开读写。
**迁移脚本**: `supabase/tags-migration.sql` — 建表并从现有 cards 中提取已有标签去重插入。

## 前端 TypeScript 类型定义

**位置**: `src/types/card.ts`

```typescript
export type Tag = {
  name: string;   // 标签名称
  color: string;  // 十六进制颜色值，如 "#6366F1"
};

export type TagDefinition = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Card = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  tags: Tag[] | null;
  created_at: string;
  updated_at: string;
  position: number;
};
```

## 共享色板

**位置**: `src/lib/tag-colors.ts`

- 导出 `TAG_COLORS` — 27 种按色相排序的预设十六进制颜色数组
- 导出 `DEFAULT_COLOR_INDEX = 18` — 默认选中色（indigo-500）的索引
- 在 TagManagerModal 和 AddCardModal 之间共享，确保颜色选择器一致

## 数据流

```
┌──────────────────────────────────────────────────────────────┐
│  page.tsx (Home)                                              │
│                                                                │
│  fetchCards() → Supabase .from("cards").select()               │
│  fetchTags()  → Supabase .from("tags").select()                │
│       ↓                                                        │
│  setCards(data)  (useState<Card[]>)                            │
│  setAllTags(data) (useState<TagDefinition[]>)                  │
│       ↓                                                        │
│  搜索过滤 (searchQuery → title/content/url 模糊匹配)           │
│  标签筛选 (selectedFilterTags → AND 逻辑)                     │
│  排序 (sortedCards: position / created_at / updated_at ± 方向) │
│       ↓                                                        │
│  DndContext → SortableContext → SortableCard[]  (默认模式)     │
│  直接渲染卡片网格 (时间排序模式，禁用拖拽)                      │
│       ↓                                                        │
│  handleDragEnd → 更新本地 position + Supabase batch            │
│       ↓                                                        │
│  AddCardModal → 新增/编辑卡片                                  │
│  DeleteConfirmModal → 删除卡片                                 │
│  TagManagerModal → 标签 CRUD，自动同步到所有卡片               │
└──────────────────────────────────────────────────────────────┘
```

## 核心 API 路由

**当前项目无 Next.js API Route 文件**。所有数据操作均通过客户端直接调用 Supabase 的 JS SDK 完成，无需自定义后端路由。

**Supabase 客户端单例**: `src/lib/supabase.ts` — 读取 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 环境变量创建客户端实例。

## 核心组件职责

| 组件 | 路径 | 职责 |
|------|------|------|
| Home (page) | `src/app/page.tsx` | 状态管理中枢，协调数据获取、搜索、排序、筛选、拖拽、弹窗 |
| AddCardModal | `src/components/AddCardModal.tsx` | 新增/编辑表单，含已有标签选择 + 新建标签（27 色预设） |
| DeleteConfirmModal | `src/components/DeleteConfirmModal.tsx` | 删除二次确认弹窗 |
| SortableCard | `src/components/SortableCard.tsx` | 单张卡片展示，集成 @dnd-kit 拖拽手柄，根据排序模式显示不同时间 |
| TagManagerModal | `src/components/TagManagerModal.tsx` | 标签管理弹窗，新建/编辑名称和颜色、删除，自动同步到所有卡片 |

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase 匿名密钥
```