'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  status: 'draft' | 'published';
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setArticles(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title ?? '',
            subtitle: data.subtitle ?? '',
            category: data.category ?? '',
            status: data.status ?? 'draft',
            authorName: data.authorName ?? 'TrackR',
            publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
          };
        }),
      );
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(articleId: string) {
    setActionLoading(articleId);
    try {
      const publishArticle = httpsCallable(functions, 'publishArticle');
      await publishArticle({ articleId, notifyUsers: false });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId ? { ...a, status: 'published', publishedAt: new Date() } : a,
        ),
      );
    } catch (err) {
      console.error('Failed to publish:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnpublish(articleId: string) {
    setActionLoading(articleId);
    try {
      const unpublishArticle = httpsCallable(functions, 'unpublishArticle');
      await unpublishArticle({ articleId });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId ? { ...a, status: 'draft', publishedAt: null } : a,
        ),
      );
    } catch (err) {
      console.error('Failed to unpublish:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(articleId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(articleId);
    try {
      const deleteArticle = httpsCallable(functions, 'deleteArticle');
      await deleteArticle({ articleId });
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = articles.filter((a) => filter === 'all' || a.status === filter);

  function formatDate(date: Date | null) {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Articles</h2>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg
            hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
        >
          New Article
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 shadow-card w-fit">
        {(['all', 'draft', 'published'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150
              ${filter === f
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {articles.filter((a) => a.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Articles list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-card p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-page rounded mb-2" />
              <div className="h-3 w-1/3 bg-page rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-text-meta text-sm">
            {filter === 'all' ? 'No articles yet.' : `No ${filter} articles.`}
          </p>
          <Link
            href="/admin/articles/new"
            className="inline-block mt-3 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full
                        ${article.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-text-meta'
                        }`}
                    >
                      {article.status}
                    </span>
                    <span className="text-xs text-text-meta uppercase tracking-wider">
                      {article.category}
                    </span>
                  </div>
                  <Link
                    href={`/admin/articles/edit?id=${article.id}`}
                    className="text-base font-semibold text-text-primary hover:text-accent transition-colors"
                  >
                    {article.title}
                  </Link>
                  {article.subtitle && (
                    <p className="text-sm text-text-secondary mt-0.5 truncate">
                      {article.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-text-meta mt-2">
                    {article.authorName}
                    {' · '}
                    {article.status === 'published'
                      ? `Published ${formatDate(article.publishedAt)}`
                      : `Created ${formatDate(article.createdAt)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/articles/edit?id=${article.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary
                      bg-page rounded-lg hover:text-text-primary transition-colors"
                  >
                    Edit
                  </Link>
                  {article.status === 'draft' ? (
                    <button
                      onClick={() => handlePublish(article.id)}
                      disabled={actionLoading === article.id}
                      className="px-3 py-1.5 text-xs font-medium text-white
                        bg-accent rounded-lg hover:bg-accent-hover
                        disabled:opacity-50 transition-all duration-150"
                    >
                      {actionLoading === article.id ? '...' : 'Publish'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(article.id)}
                      disabled={actionLoading === article.id}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary
                        bg-page rounded-lg hover:text-text-primary
                        disabled:opacity-50 transition-all duration-150"
                    >
                      {actionLoading === article.id ? '...' : 'Unpublish'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    disabled={actionLoading === article.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-500
                      bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-600
                      disabled:opacity-50 transition-all duration-150"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
