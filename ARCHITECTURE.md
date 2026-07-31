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
| `position` | `integer` | 拖拽排序位置，用于自定义排序，默认 0 |

**RLS 策略**: 当前为公开读写（`USING (true)` / `WITH CHECK (true)`），无用户认证。
**迁移脚本**: `supabase/rls-policies.sql` — 包含建表扩展、position 列初始化、tags 列 text[] → jsonb 迁移、RLS 策略创建。

## 前端 TypeScript 类型定义

**位置**: `src/types/card.ts`

```typescript
export type Tag = {
  name: string;   // 标签名称
  color: string;  // 十六进制颜色值，如 "#6366F1"
};

export type Card = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  tags: Tag[] | null;
  created_at: string;
  position: number;
};
```

## 数据流

```
┌──────────────────────────────────────────────────┐
│  page.tsx (Home)                                  │
│                                                    │
│  fetchCards() → Supabase .from("cards").select()   │
│       ↓                                            │
│  setCards(data)  (useState<Card[]>)                │
│       ↓                                            │
│  筛选 (filteredCards = useMemo)                    │
│  排序 (order 在 Supabase 查询层完成)               │
│       ↓                                            │
│  DndContext → SortableContext → SortableCard[]     │
│       ↓                                            │
│  handleDragEnd → 更新本地 state + Supabase batch   │
│                                                    │
│  handleSave → AddCardModal → Supabase upsert       │
│  handleDelete → DeleteConfirmModal → Supabase del  │
└──────────────────────────────────────────────────┘
```

## 核心 API 路由

**当前项目无 Next.js API Route 文件**。所有数据操作均通过客户端直接调用 Supabase 的 JS SDK 完成，无需自定义后端路由。

**Supabase 客户端单例**: `src/lib/supabase.ts` — 读取 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 环境变量创建客户端实例。

## 核心组件职责

| 组件 | 路径 | 职责 |
|------|------|------|
| Home (page) | `src/app/page.tsx` | 状态管理中枢，协调数据获取、排序、筛选、拖拽、弹窗 |
| AddCardModal | `src/components/AddCardModal.tsx` | 新增/编辑表单，含标签输入与颜色选择器 |
| DeleteConfirmModal | `src/components/DeleteConfirmModal.tsx` | 删除二次确认弹窗 |
| SortableCard | `src/components/SortableCard.tsx` | 单张卡片展示，集成 @dnd-kit 拖拽手柄 |

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=     # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase 匿名密钥
```