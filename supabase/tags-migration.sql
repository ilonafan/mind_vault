-- MindVault 标签统一管理迁移
-- 在 Supabase Dashboard → SQL Editor 中执行此文件

-- 1. 创建 tags 表
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL DEFAULT '#6366F1',
  created_at timestamptz DEFAULT now()
);

-- 2. 启用 RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 3. 清理旧策略
DROP POLICY IF EXISTS "Allow public read" ON tags;
DROP POLICY IF EXISTS "Allow public insert" ON tags;
DROP POLICY IF EXISTS "Allow public update" ON tags;
DROP POLICY IF EXISTS "Allow public delete" ON tags;

-- 4. 创建 RLS 策略（与 cards 表一致，公开读写）
CREATE POLICY "Allow public read" ON tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tags FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON tags FOR DELETE USING (true);

-- 5. 从现有卡片中提取已有标签，去重后插入 tags 表
INSERT INTO tags (name, color)
SELECT DISTINCT
  tag->>'name' AS name,
  tag->>'color' AS color
FROM cards,
LATERAL jsonb_array_elements(COALESCE(cards.tags, '[]'::jsonb)) AS tag
WHERE tag->>'name' IS NOT NULL
ON CONFLICT (name) DO NOTHING;