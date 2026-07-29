export type Tag = {
  name: string;
  color: string;
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
