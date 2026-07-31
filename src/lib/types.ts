export type Item = {
  id: string;
  user_id: string;
  type: "link" | "note" | "image";
  url: string | null;
  canonical_url: string | null;
  title: string | null;
  description: string | null;
  site_name: string | null;
  favicon_url: string | null;
  image_url: string | null;
  content_text: string | null;
  note: string | null;
  tags: string[];
  status: "pending" | "ready" | "failed";
  error: string | null;
  created_at: string;
};
