/**
 * Article types for the frontend.
 */

export interface ArticleContent {
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string;
}

export interface Article {
  id: string;
  url: string;
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string | null;
  organization: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInfo {
  name: string;
  email: string;
}

export interface SaveArticleData {
  url: string;
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string;
  organization?: OrganizationInfo;
  image_url?: string;
}

export interface ExtractionResult {
  url: string;
  data: ArticleContent;
}

export interface SaveResult {
  id: string;
  url: string;
  title: string;
  message: string;
}
