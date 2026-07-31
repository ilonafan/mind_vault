export type Tag = {
  name: string;
  color: string;
};

/** 统一标签定义（存储在 tags 表中） */
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
  position: number;
};
