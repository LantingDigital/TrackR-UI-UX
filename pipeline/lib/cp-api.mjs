// Coasterpedia MediaWiki API wrapper with rate limiting and pagination.

import {
  CP_API_BASE,
  CP_USER_AGENT,
  CP_REQUEST_DELAY_MS,
  CP_MAX_RETRIES,
  CP_RETRY_BACKOFF_MS,
} from '../config/constants.mjs';

let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < CP_REQUEST_DELAY_MS) {
    await new Promise((r) => setTimeout(r, CP_REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function cpApiFetch(params, retries = 0) {
  await throttle();

  const url = new URL(CP_API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': CP_USER_AGENT },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      console.warn(`  Rate limited. Waiting ${retryAfter}s...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return cpApiFetch(params, retries);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    if (retries < CP_MAX_RETRIES) {
      const delay = CP_RETRY_BACKOFF_MS[retries] || 8000;
      console.warn(`  Retry ${retries + 1}/${CP_MAX_RETRIES} after ${delay}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
      return cpApiFetch(params, retries + 1);
    }
    throw err;
  }
}

/**
 * Get all page members of a Coasterpedia category. Handles pagination.
 * @param {string} categoryTitle - e.g., "Category:Roller coasters by name"
 * @returns {Promise<Array<{title: string, pageid: number}>>}
 */
export async function cpGetCategoryPages(categoryTitle) {
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

    const data = await cpApiFetch(params);
    const members = data?.query?.categorymembers || [];
    allPages.push(...members.map((m) => ({ title: m.title, pageid: m.pageid })));
    cmcontinue = data?.continue?.cmcontinue || null;
  } while (cmcontinue);

  return allPages;
}

/**
 * Get all subcategories of a Coasterpedia category. Handles pagination.
 * @param {string} categoryTitle
 * @returns {Promise<Array<{title: string}>>}
 */
export async function cpGetSubcategories(categoryTitle) {
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

    const data = await cpApiFetch(params);
    const members = data?.query?.categorymembers || [];
    allSubcats.push(...members.map((m) => ({ title: m.title })));
    cmcontinue = data?.continue?.cmcontinue || null;
  } while (cmcontinue);

  return allSubcats;
}

/**
 * Fetch raw wikitext for a Coasterpedia article via action=parse.
 * We parse locally with wtf_wikipedia rather than using wtf.fetch()
 * because Coasterpedia doesn't use a language subdomain.
 *
 * @param {string} title - Article title
 * @returns {Promise<{wikitext: string|null, categories: string[], pageid: number|null, error: string|null}>}
 */
export async function cpFetchWikitext(title) {
  try {
    const data = await cpApiFetch({
      action: 'parse',
      page: title,
      prop: 'wikitext|categories',
    });

    if (data?.error) {
      return { wikitext: null, categories: [], pageid: null, error: data.error.info || 'unknown' };
    }

    return {
      wikitext: data?.parse?.wikitext?.['*'] || null,
      categories: (data?.parse?.categories || []).map((c) => c['*']),
      pageid: data?.parse?.pageid || null,
      error: null,
    };
  } catch (err) {
    return { wikitext: null, categories: [], pageid: null, error: err.message };
  }
}
