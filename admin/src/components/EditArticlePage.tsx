'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import ArticleEditor from '@/components/ArticleEditor';

const CATEGORIES = [
  'News',
  'Park Updates',
  'Ride Reviews',
  'Tips & Tricks',
  'Community',
  'TrackR Updates',
];

export default function EditArticlePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('id') ?? '';

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArticle();
  }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadArticle() {
    try {
      const snap = await getDoc(doc(db, 'articles', articleId));
      if (!snap.exists()) {
        router.replace('/admin/articles');
        return;
      }
      const data = snap.data();
      setTitle(data.title ?? '');
      setSubtitle(data.subtitle ?? '');
      setCategory(data.category ?? CATEGORIES[0]);
      setTags((data.tags ?? []).join(', '));
      setBannerImageUrl(data.bannerImageUrl ?? '');
      setBody(data.body ?? '');
      setStatus(data.status ?? 'draft');
    } catch (err) {
      console.error('Failed to load article:', err);
      setError('Failed to load article.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const readTimeMinutes = Math.max(
        1,
        Math.ceil(body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      );

      await updateDoc(doc(db, 'articles', articleId), {
        title: title.trim(),
        subtitle: subtitle.trim(),
        body,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        bannerImageUrl: bannerImageUrl.trim() || null,
        readTimeMinutes,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    setSaving(true);
    try {
      if (status === 'draft') {
        // Save first, then publish
        await handleSave();
        const publishArticle = httpsCallable(functions, 'publishArticle');
        await publishArticle({ articleId, notifyUsers: false });
        setStatus('published');
      } else {
        const unpublishArticle = httpsCallable(functions, 'unpublishArticle');
        await unpublishArticle({ articleId });
        setStatus('draft');
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      setError('Failed to update publish status.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="h-8 w-48 bg-page rounded animate-pulse mb-6" />
        <div className="h-12 w-full bg-page rounded animate-pulse mb-4" />
        <div className="h-64 w-full bg-page rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/articles')}
            className="text-sm text-text-meta hover:text-text-secondary transition-colors mb-1"
          >
            &larr; Back to articles
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary">Edit Article</h2>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full
                ${status === 'published'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-text-meta'
                }`}
            >
              {status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-card
              border border-gray-200 rounded-lg hover:bg-page
              disabled:opacity-50 transition-all duration-150"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium rounded-lg
              disabled:opacity-50 transition-all duration-150
              ${status === 'draft'
                ? 'text-white bg-accent hover:bg-accent-hover active:scale-[0.98]'
                : 'text-text-secondary bg-card border border-gray-200 hover:bg-page'
              }`}
          >
            {status === 'draft' ? 'Publish' : 'Unpublish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form className="space-y-5">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full text-2xl font-bold text-text-primary bg-transparent
              border-none outline-none placeholder:text-text-meta/50"
          />
        </div>

        <div>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (optional)"
            className="w-full text-base text-text-secondary bg-transparent
              border-none outline-none placeholder:text-text-meta/50"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-text-meta uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-text-meta uppercase tracking-wider mb-1.5">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-meta uppercase tracking-wider mb-1.5">
            Banner Image URL
          </label>
          <input
            type="url"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-card border border-gray-200 rounded-lg text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          {bannerImageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImageUrl}
                alt="Banner preview"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-meta uppercase tracking-wider mb-1.5">
            Body
          </label>
          <ArticleEditor content={body} onChange={setBody} />
        </div>
      </form>
    </div>
  );
}
