#!/usr/bin/env node

/**
 * Publish TrackR articles from markdown files to Firestore.
 *
 * Usage:
 *   node scripts/publish-articles.js [--dry-run]
 *
 * Reads markdown files from docs/articles/2026-*.md, parses metadata,
 * and writes them to Firestore articles/{articleId} as drafts.
 *
 * Requires: firebase-admin SDK + service account key OR Firebase CLI auth token.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'trackr-coaster-app';
const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles');
const DRY_RUN = process.argv.includes('--dry-run');

// Articles already in Firestore (skip these)
const SKIP_IDS = new Set([
  '2026-03-18-nightflight-expedition',
  '2026-03-18-rmc-goes-small',
  '2026-03-18-socal-coaster-arms-race',
  '2026-03-18-tormenta-rampaging-run',
  'article-cedar-point-2025',
  'article-hidden-gems',
  'article-rmc-conversion',
  'article-sf-cf-merger',
  'article-weekly-digest-march-10-16',
]);

// Get Firebase CLI access token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const configPath = path.join(
      process.env.HOME,
      '.config',
      'configstore',
      'firebase-tools.json'
    );

    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      reject(new Error('Cannot read firebase-tools.json. Run: firebase login --reauth'));
      return;
    }

    const refreshToken = config.tokens?.refresh_token;
    if (!refreshToken) {
      reject(new Error('No refresh token found. Run: firebase login --reauth'));
      return;
    }

    // Exchange refresh token for access token
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error(`Token exchange failed: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse token response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Write a document to Firestore via REST API
function writeDocument(accessToken, collection, docId, fields) {
  return new Promise((resolve, reject) => {
    const firestoreFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        firestoreFields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        firestoreFields[key] = { integerValue: String(value) };
      } else if (typeof value === 'boolean') {
        firestoreFields[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        firestoreFields[key] = {
          arrayValue: {
            values: value.map(v => {
              if (typeof v === 'string') return { stringValue: v };
              if (typeof v === 'object') {
                const mapFields = {};
                for (const [mk, mv] of Object.entries(v)) {
                  mapFields[mk] = { stringValue: String(mv) };
                }
                return { mapValue: { fields: mapFields } };
              }
              return { stringValue: String(v) };
            })
          }
        };
      } else if (value === null) {
        firestoreFields[key] = { nullValue: null };
      }
    }

    const body = JSON.stringify({ fields: firestoreFields });

    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Firestore write failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Parse YAML frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    // Match key: "value" or key: value
    const kvMatch = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kvMatch && kvMatch[1] && kvMatch[2]) {
      fm[kvMatch[1]] = kvMatch[2];
    }
  }

  return { frontmatter: fm, body: match[2].trim() };
}

// Parse an article markdown file into Firestore schema
function parseArticle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');

  const parsed = parseFrontmatter(content);

  let title, subtitle, body, category, subcategory, readTimeMinutes, publishDate, excerpt, authorName;
  let tags = [];
  let sources = [];

  if (parsed) {
    // YAML frontmatter format (new articles)
    const fm = parsed.frontmatter;
    title = fm.title || fileName;
    subtitle = fm.subtitle || '';
    body = parsed.body;
    category = fm.category || 'uncategorized';
    subcategory = fm.subcategory || '';
    readTimeMinutes = parseInt(fm.readTimeMinutes) || 5;
    publishDate = fm.publishedAt || new Date().toISOString();
    excerpt = fm.excerpt || body.substring(0, 200);
    authorName = fm.author || 'TrackR Community';

    // Parse tags from frontmatter
    if (fm.tags) {
      tags = fm.tags.replace(/[\[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean);
    }
  } else {
    // Legacy format (older articles)
    const titleMatch = content.match(/^# (.+)$/m);
    title = titleMatch ? titleMatch[1] : fileName;
    subtitle = '';
    body = content;
    category = 'uncategorized';
    subcategory = '';
    readTimeMinutes = 5;
    publishDate = new Date().toISOString();
    excerpt = body.substring(0, 200);
    authorName = 'TrackR Community';
  }

  // Extract sources from body (markdown links in Sources section)
  const sourcesSection = body.match(/## Sources\n([\s\S]*?)$/);
  if (sourcesSection) {
    const sourceRegex = /- \[(.+?)\]\((.+?)\)/g;
    let sourceMatch;
    while ((sourceMatch = sourceRegex.exec(sourcesSection[1])) !== null) {
      sources.push({ name: sourceMatch[1], url: sourceMatch[2] });
    }
  }

  return {
    articleId: fileName,
    fields: {
      title,
      subtitle,
      body,
      bannerImageUrl: '',
      category,
      subcategory,
      tags,
      readTimeMinutes,
      sources,
      authorId: 'system',
      authorName,
      publishedAt: publishDate.includes('T') ? publishDate : `${publishDate}T12:00:00Z`,
      status: 'draft',
      excerpt,
    }
  };
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== Publishing articles to Firestore ===');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Articles dir: ${ARTICLES_DIR}\n`);

  // Find article files (all .md files, skip research/ subdirectory)
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(ARTICLES_DIR, f));

  if (files.length === 0) {
    console.log('No article files found.');
    return;
  }

  console.log(`Found ${files.length} articles:\n`);

  // Parse all articles, skip existing ones
  const articles = [];
  for (const f of files) {
    const article = parseArticle(f);
    if (SKIP_IDS.has(article.articleId)) {
      console.log(`  SKIP ${article.articleId} (already in Firestore)`);
      continue;
    }
    console.log(`  ${article.articleId}`);
    console.log(`    Title: ${article.fields.title}`);
    console.log(`    Category: ${article.fields.category}`);
    console.log(`    Sources: ${article.fields.sources.length}`);
    console.log('');
    articles.push(article);
  }

  if (DRY_RUN) {
    console.log('Dry run complete. No data written.');
    return;
  }

  // Get access token
  console.log('Getting Firebase access token...');
  let accessToken;
  try {
    accessToken = await getAccessToken();
    console.log('Token acquired.\n');
  } catch (e) {
    console.error(`Auth failed: ${e.message}`);
    process.exit(1);
  }

  // Write each article
  for (const article of articles) {
    try {
      console.log(`Writing: articles/${article.articleId}...`);
      await writeDocument(accessToken, 'articles', article.articleId, article.fields);
      console.log(`  Done.`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }

  console.log('\nAll articles published as drafts.');
}

main().catch(console.error);
