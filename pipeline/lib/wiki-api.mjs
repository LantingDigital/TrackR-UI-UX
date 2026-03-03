// MediaWiki API wrapper with rate limiting and pagination.

import {
  WIKI_API_BASE,
  USER_AGENT,
  REQUEST_DELAY_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
} from '../config/constants.mjs';

let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function apiFetch(params, retries = 0) {
  await throttle();

  const url = new URL(WIKI_API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      console.warn(`  Rate limited. Waiting ${retryAfter}s...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return apiFetch(params, retries);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const delay = RETRY_BACKOFF_MS[retries] || 4000;
      console.warn(`  Retry ${retries + 1}/${MAX_RETRIES} after ${delay}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
      return apiFetch(params, retries + 1);
    }
    throw err;
  }
}

/**
 * Get all page members of a Wikipedia category. Handles pagination.
 * @param {string} categoryTitle - e.g., "Category:Roller coasters in Ohio"
 * @returns {Promise<Array<{title: string, pageid: number}>>}
 */
export async function getCategoryPages(categoryTitle) {
  const allPages = [];
  let cmcontinue = null;

  do {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: categoryTitle,
      cmtype: 'page',
      cmlimit: '500',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const data = await apiFetch(params);
    const members = data?.query?.categorymembers || [];
    allPages.push(...members.map((m) => ({ title: m.title, pageid: m.pageid })));
    cmcontinue = data?.continue?.cmcontinue || null;
  } while (cmcontinue);

  return allPages;
}

/**
 * Get all subcategories of a Wikipedia category. Handles pagination.
 * @param {string} categoryTitle
 * @returns {Promise<Array<{title: string}>>}
 */
export async function getSubcategories(categoryTitle) {
  const allSubcats = [];
  let cmcontinue = null;

  do {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: categoryTitle,
      cmtype: 'subcat',
      cmlimit: '500',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const data = await apiFetch(params);
    const members = data?.query?.categorymembers || [];
    allSubcats.push(...members.map((m) => ({ title: m.title })));
    cmcontinue = data?.continue?.cmcontinue || null;
  } while (cmcontinue);

  return allSubcats;
}

/**
 * Search Wikipedia for articles matching a query.
 * Uses the MediaWiki search API (action=query&list=search).
 *
 * @param {string} query - Search text
 * @param {number} limit - Max results (default 5)
 * @returns {Promise<Array<{title: string, pageid: number, snippet: string}>>}
 */
export async function searchArticles(query, limit = 5) {
  const data = await apiFetch({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
  });

  return (data?.query?.search || []).map((r) => ({
    title: r.title,
    pageid: r.pageid,
    snippet: r.snippet || '',
  }));
}
