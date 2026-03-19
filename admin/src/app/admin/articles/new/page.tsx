'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import ArticleEditor from '@/components/ArticleEditor';

const CATEGORIES = [
  'News',
  'Park Updates',
  'Ride Reviews',
  'Tips & Tricks',
  'Community',
  'TrackR Updates',
];

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: FormEvent, shouldPublish: boolean) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }

    const setLoading = shouldPublish ? setPublishing : setSaving;
    setLoading(true);
    setError('');

    try {
      const createArticle = httpsCallable<Record<string, unknown>, { articleId: string }>(
        functions,
        'createArticle',
      );

      const readTimeMinutes = Math.max(1, Math.ceil(body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200));

      const result = await createArticle({
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
        authorName: 'TrackR',
      });

      if (shouldPublish) {
        const publishArticle = httpsCallable(functions, 'publishArticle');
        await publishArticle({ articleId: result.data.articleId, notifyUsers: false });
      }

      router.push('/admin/articles');
    } catch (err) {
      console.error('Failed to save article:', err);
      setError('Failed to save article. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-text-meta hover:text-text-secondary transition-colors mb-1"
          >
            &larr; Back to articles
          </button>
          <h2 className="text-2xl font-bold text-text-primary">New Article</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => handleSave(e, false)}
            disabled={saving || publishing}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-card
              border border-gray-200 rounded-lg hover:bg-page
              disabled:opacity-50 transition-all duration-150"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={(e) => handleSave(e, true)}
            disabled={saving || publishing}
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg
              hover:bg-accent-hover active:scale-[0.98]
              disabled:opacity-50 transition-all duration-150"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form className="space-y-5">
        {/* Title */}
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

        {/* Subtitle */}
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

        {/* Meta row */}
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

        {/* Banner image */}
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

        {/* Body editor */}
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
