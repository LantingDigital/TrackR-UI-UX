// Kebab-case slug generation with collision detection.

/**
 * Convert a string to a kebab-case slug.
 * "Steel Vengeance" → "steel-vengeance"
 * "Rock 'n' Roller Coaster" → "rock-n-roller-coaster"
 * "Wildcat's Revenge" → "wildcats-revenge"
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Non-alphanumeric → hyphens
    .replace(/^-|-$/g, '') // Trim leading/trailing hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

/**
 * Two-pass slug assignment that handles collisions.
 *
 * @param {Array<{name: string, parkName: string}>} entries
 * @returns {Map<string, string>} Map of "name|parkName" → unique slug
 */
export function assignSlugs(entries) {
  // Pass 1: detect collisions
  const slugToEntries = new Map();
  for (const entry of entries) {
    const slug = toSlug(entry.name);
    if (!slugToEntries.has(slug)) {
      slugToEntries.set(slug, []);
    }
    slugToEntries.get(slug).push(entry);
  }

  // Pass 2: resolve collisions by appending park name
  const result = new Map();
  for (const [slug, owners] of slugToEntries) {
    if (owners.length === 1) {
      const key = `${owners[0].name}|${owners[0].parkName}`;
      result.set(key, slug);
    } else {
      // Collision — append park slug
      for (const entry of owners) {
        const parkSlug = toSlug(entry.parkName);
        const uniqueSlug = `${slug}-${parkSlug}`;
        const key = `${entry.name}|${entry.parkName}`;
        result.set(key, uniqueSlug);
      }
    }
  }

  return result;
}

/**
 * Get a slug for a single entry, with a collision set for dedup.
 * Use this during incremental processing.
 */
export function getSlug(name, parkName, existingSlugs) {
  let slug = toSlug(name);
  if (existingSlugs && existingSlugs.has(slug)) {
    slug = `${slug}-${toSlug(parkName)}`;
  }
  return slug;
}
