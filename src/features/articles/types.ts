/**
 * Article types — matches Firestore articles/{articleId} schema.
 */

export type ArticleStatus = 'draft' | 'published';

export type ArticleCategory =
  | 'news'
  | 'news-digest'
  | 'ride-review'
  | 'park-guide'
  | 'industry'
  | 'seasonal'
  | 'opinion'
  | 'culture'
  | 'history'
  | 'guide';

export interface ArticleSource {
  name: string;
  url: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  /** Markdown-formatted body text */
  body: string;
  /** NanoBanana card art (require()) or remote URL */
  bannerImage: string | number;
  category: ArticleCategory;
  tags: string[];
  readTimeMinutes: number;
  sources: ArticleSource[];
  authorId: string;
  authorName: string;
  publishedAt: string; // ISO 8601
  status: ArticleStatus;
}
