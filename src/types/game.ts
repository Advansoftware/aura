export interface GameComment {
  author: string;
  date: string;
  content: string;
  likes?: number;
  replies?: GameComment[];
}

export interface Game {
  id?: number;
  slug: string;
  title: string;
  image: string | null;
  description: string | null;
  file_size: string | null;
  version: string | null;
  download_url: string | null;
  magnet_url: string | null;
  categories: string | null;
  author?: string | null;
  views?: number | null;
  downloads_count?: number | null;
  update_date?: string | null;
  screenshots?: string | null;
  system_requirements?: string | null;
  trailer_url?: string | null;
  comments?: string | null;
  created_at?: string;
  updated_at?: string;
}

