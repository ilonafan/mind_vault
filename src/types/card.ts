export type Card = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
};
