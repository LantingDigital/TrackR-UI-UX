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
const ARTICLES_DIR = path.join(__dirname, '..', 'docs', 'articles');
const DRY_RUN = process.argv.includes('--dry-run');

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

// Parse an article markdown file into Firestore schema
function parseArticle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');

  // Extract title (first # heading)
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : fileName;

  // Extract subtitle (first bold line after title, before ---)
  const subtitleMatch = content.match(/^\*\*(.+)\*\*$/m);
  const subtitle = subtitleMatch ? subtitleMatch[1] : '';

  // Extract metadata line at bottom
  const categoryMatch = content.match(/\*\*Category:\*\*\s*([^|]+)/);
  const category = categoryMatch ? categoryMatch[1].trim() : 'News';

  const readTimeMatch = content.match(/\*\*Read time:\*\*\s*(\d+)/);
  const readTimeMinutes = readTimeMatch ? parseInt(readTimeMatch[1]) : 5;

  const publishDateMatch = content.match(/\*\*Publish date:\*\*\s*(.+)/);
  const publishDate = publishDateMatch ? publishDateMatch[1].trim() : new Date().toISOString().split('T')[0];

  // Extract sources
  const sources = [];
  const sourceRegex = /^- \[(.+?)\]\((.+?)\)$/gm;
  let sourceMatch;
  while ((sourceMatch = sourceRegex.exec(content)) !== null) {
    sources.push({ name: sourceMatch[1], url: sourceMatch[2] });
  }

  // Extract body (everything between --- markers, excluding metadata footer)
  const parts = content.split('---');
  let body = '';
  if (parts.length >= 3) {
    // Body is between first and last ---
    body = parts.slice(1, -1).join('---').trim();
  } else {
    body = content;
  }

  // Generate article ID from filename
  const articleId = fileName;

  // Determine tags from content
  const tags = [];
  if (content.toLowerCase().includes('six flags')) tags.push('Six Flags');
  if (content.toLowerCase().includes('dollywood')) tags.push('Dollywood');
  if (content.toLowerCase().includes('universal')) tags.push('Universal');
  if (content.toLowerCase().includes("knott's")) tags.push("Knott's Berry Farm");
  if (content.toLowerCase().includes('rmc') || content.toLowerCase().includes('rocky mountain')) tags.push('RMC');
  if (content.toLowerCase().includes('b&m')) tags.push('B&M');
  if (content.toLowerCase().includes('mack rides')) tags.push('Mack Rides');
  if (content.toLowerCase().includes('vekoma')) tags.push('Vekoma');

  return {
    articleId,
    fields: {
      title,
      subtitle,
      body,
      bannerImageUrl: '', // Will be filled after hero art is generated
      category,
      tags,
      readTimeMinutes,
      sources,
      authorId: 'system', // TrackR editorial, not a user
      publishedAt: `${publishDate}T12:00:00Z`,
      status: 'draft',
    }
  };
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== Publishing articles to Firestore ===');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Articles dir: ${ARTICLES_DIR}\n`);

  // Find article files
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.startsWith('2026-') && f.endsWith('.md'))
    .map(f => path.join(ARTICLES_DIR, f));

  if (files.length === 0) {
    console.log('No article files found.');
    return;
  }

  console.log(`Found ${files.length} articles:\n`);

  // Parse all articles
  const articles = files.map(f => {
    const article = parseArticle(f);
    console.log(`  ${article.articleId}`);
    console.log(`    Title: ${article.fields.title}`);
    console.log(`    Category: ${article.fields.category}`);
    console.log(`    Read time: ${article.fields.readTimeMinutes} min`);
    console.log(`    Sources: ${article.fields.sources.length}`);
    console.log(`    Tags: ${article.fields.tags.join(', ')}`);
    console.log('');
    return article;
  });

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
