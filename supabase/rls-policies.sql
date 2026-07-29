-- MindVault cards 表完整 RLS 策略
-- 在 Supabase Dashboard → SQL Editor 中执行此文件

-- 添加 position 列用于拖拽排序
ALTER TABLE cards ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- 为现有卡片按创建时间倒序设置初始 position
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS new_position
  FROM cards
  WHERE position = 0 OR position IS NULL
)
UPDATE cards c
SET position = r.new_position
FROM ranked r
WHERE c.id = r.id;

-- 将 tags 列从 text[] 迁移为 jsonb，支持带颜色的标签
-- 采用分步迁移法，避免 ALTER COLUMN USING 中不允许子查询的限制
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'tags'
  ) THEN
    -- 如果是 text[] 类型，迁移为 jsonb
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'cards'
        AND column_name = 'tags'
        AND data_type = 'ARRAY'
    ) THEN
      -- 第1步：新增临时 jsonb 列
      ALTER TABLE cards ADD COLUMN tags_new jsonb;

      -- 第2步：将旧数据转换后写入新列（UPDATE 中允许子查询）
      UPDATE cards
      SET tags_new = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', tag_item,
            'color', '#6366F1'
          )
        )
        FROM unnest(tags) AS tag_item
      )
      WHERE tags IS NOT NULL;

      -- 第3步：删除旧列
      ALTER TABLE cards DROP COLUMN tags;

      -- 第4步：重命名新列为 tags
      ALTER TABLE cards RENAME COLUMN tags_new TO tags;
    END IF;
  ELSE
    -- tags 列不存在，直接新建
    ALTER TABLE cards ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;
END
$$;

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
