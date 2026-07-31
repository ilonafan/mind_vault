-- MindVault 排序功能迁移：添加 updated_at 列
-- 在 Supabase Dashboard → SQL Editor 中执行此文件

-- 添加 updated_at 列（用于按最后更新时间排序）
ALTER TABLE cards ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 为现有数据设置 updated_at = created_at
UPDATE cards SET updated_at = created_at WHERE updated_at IS NULL;