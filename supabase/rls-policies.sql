-- MindVault cards 表完整 RLS 策略
-- 在 Supabase Dashboard → SQL Editor 中执行此文件

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 清理旧策略（可重复执行）
DROP POLICY IF EXISTS "Allow public read" ON cards;
DROP POLICY IF EXISTS "Allow public insert" ON cards;
DROP POLICY IF EXISTS "Allow public update" ON cards;
DROP POLICY IF EXISTS "Allow public delete" ON cards;

-- 读取
CREATE POLICY "Allow public read"
  ON cards FOR SELECT
  USING (true);

-- 新增
CREATE POLICY "Allow public insert"
  ON cards FOR INSERT
  WITH CHECK (true);

-- 更新（缺少此策略会导致更新静默失败）
CREATE POLICY "Allow public update"
  ON cards FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 删除（缺少此策略会导致删除静默失败）
CREATE POLICY "Allow public delete"
  ON cards FOR DELETE
  USING (true);
