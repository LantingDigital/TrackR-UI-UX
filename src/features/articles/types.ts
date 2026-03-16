/**
 * Article types — matches Firestore articles/{articleId} schema.
 */

export type ArticleStatus = 'draft' | 'published';

export type ArticleCategory =
  | 'news'
  | 'ride-review'
  | 'park-guide'
  | 'industry'
  | 'seasonal'
  | 'opinion';

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
  /** NanoBanana card art or other banner image */
  bannerImageUrl: string;
  category: ArticleCategory;
  tags: string[];
  readTimeMinutes: number;
  sources: ArticleSource[];
  authorId: string;
  authorName: string;
  publishedAt: string; // ISO 8601
  status: ArticleStatus;
}
