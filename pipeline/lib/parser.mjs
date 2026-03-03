// Wikipedia article parser using wtf_wikipedia.
// Extracts infobox fields, article sections, and full text.

import wtf from 'wtf_wikipedia';
import { REQUEST_DELAY_MS, USER_AGENT, MAX_RETRIES, RETRY_BACKOFF_MS } from '../config/constants.mjs';

// Throttle for wtf.fetch() calls (it bypasses our wiki-api rate limiter)
let lastFetchTime = 0;
async function throttle() {
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS - elapsed));
  }
  lastFetchTime = Date.now();
}

/**
 * Fetch and parse a Wikipedia article with rate limiting and retries.
 * @param {string} title - Wikipedia article title
 * @returns {Promise<{doc: object, error: string|null}>}
 */
export async function fetchArticle(title, retries = 0) {
  try {
    await throttle();
    const doc = await wtf.fetch(title, 'en');
    if (!doc) return { doc: null, error: 'not_found' };
    return { doc, error: null };
  } catch (err) {
    // Retry on transient errors (HTML responses, network issues)
    if (retries < MAX_RETRIES) {
      const delay = RETRY_BACKOFF_MS[retries] || 4000;
      await new Promise((r) => setTimeout(r, delay));
      return fetchArticle(title, retries + 1);
    }
    return { doc: null, error: err.message };
  }
}

/**
 * Check if a parsed document is a roller coaster article.
 */
export function isRollerCoaster(doc) {
  const infoboxes = doc.infoboxes();
  if (!infoboxes || infoboxes.length === 0) return false;

  // Check for roller coaster infobox template
  for (const ib of infoboxes) {
    const type = ib.type();
    if (!type) continue;
    const lower = type.toLowerCase().replace(/_/g, ' ');
    if (
      lower.includes('roller coaster') ||
      lower.includes('amusement ride') ||
      lower.includes('amusement park')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a parsed document is an amusement park article.
 */
export function isAmusementPark(doc) {
  const infoboxes = doc.infoboxes();
  if (!infoboxes || infoboxes.length === 0) return false;

  for (const ib of infoboxes) {
    const type = ib.type();
    if (!type) continue;
    const lower = type.toLowerCase().replace(/_/g, ' ');
    if (lower.includes('amusement park') || lower.includes('theme park')) {
      return true;
    }
  }
  return false;
}

/**
 * Extract raw infobox fields as key-value pairs.
 * Returns the first infobox found (usually the main one).
 */
export function extractInfobox(doc) {
  const infoboxes = doc.infoboxes();
  if (!infoboxes || infoboxes.length === 0) return null;

  const ib = infoboxes[0];
  const json = ib.json();
  const result = {};

  for (const [key, value] of Object.entries(json)) {
    if (key === 'template' || key === 'type') continue;
    // value is { text, number, links, etc. }
    result[key] = {
      text: value?.text || '',
      number: value?.number ?? null,
    };
  }

  return result;
}

/**
 * Get the value of an infobox field, trying multiple key variants.
 * @param {object} infobox - Raw infobox from extractInfobox
 * @param {string[]} keys - Keys to try in order
 * @returns {{ text: string, number: number|null } | null}
 */
export function getField(infobox, ...keys) {
  if (!infobox) return null;
  for (const key of keys) {
    if (infobox[key] && (infobox[key].text || infobox[key].number != null)) {
      return infobox[key];
    }
  }
  return null;
}

/**
 * Extract article sections as structured content.
 */
export function extractSections(doc) {
  const sections = doc.sections();
  if (!sections) return [];

  return sections
    .map((s) => ({
      title: s.title() || '',
      content: s.text() || '',
    }))
    .filter((s) => s.content.trim().length > 0);
}

/**
 * Build the full wiki content document for a coaster or park.
 */
export function buildWikiContent(doc, title, pageid) {
  const sections = extractSections(doc);
  const introSection =
    sections.length > 0 && !sections[0].title ? sections[0].content : '';

  // Build raw infobox as string key-value pairs
  const rawInfobox = extractInfobox(doc);
  const infoboxRaw = {};
  if (rawInfobox) {
    for (const [key, value] of Object.entries(rawInfobox)) {
      infoboxRaw[key] = value.text;
    }
  }

  return {
    articleTitle: doc.title() || title,
    introSection,
    sections: sections
      .filter((s) => s.title) // Exclude intro (already captured above)
      .map((s) => ({ title: s.title, content: s.content })),
    fullText: doc.text() || '',
    categories: doc.categories() || [],
    infoboxRaw,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent((doc.title() || title).replace(/ /g, '_'))}`,
    wikiPageId: pageid || null,
    fetchedAt: new Date().toISOString(),
    articleLength: (doc.text() || '').length,
  };
}

/**
 * Extract a short description from the intro section (2-4 sentences).
 */
export function extractDescription(doc) {
  const sections = doc.sections();
  if (!sections || sections.length === 0) return null;

  const intro = sections[0];
  const text = intro.text();
  if (!text) return null;

  // Split into sentences and take first 3
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.slice(0, 500);

  return sentences.slice(0, 3).join(' ').trim();
}
