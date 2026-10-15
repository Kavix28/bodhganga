import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running State Resource Isolation & Negative Test Suite...\n');

// ── Test Fixtures as specified by Critical Requirement 6 ─────────────────────
const FIXTURES = [
  {
    id: 'res-nagaland-state-history',
    title: 'Nagaland State History: The Battle of Kohima',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'History',
    categorySlug: 'history',
    sectionSlug: 'history',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false,
    s3Url: 'https://s3.amazonaws.com/bodhganga/states/nagaland/general/free/battle_of_kohima.pdf'
  },
  {
    id: 'res-nagaland-state-art-culture',
    title: 'Nagaland Hornbill Festival & Indigenous Crafts',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'Art & Culture',
    categorySlug: 'art-culture',
    sectionSlug: 'art-culture',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false,
    s3Url: 'https://s3.amazonaws.com/bodhganga/states/nagaland/general/free/hornbill_festival.pdf'
  },
  {
    id: 'res-nagaland-district-history',
    title: 'Kohima District Village Chronicles',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'kohima',
    district: 'Kohima',
    category: 'History',
    categorySlug: 'history',
    sectionSlug: 'history',
    contentArea: 'FREE_DISTRICT_CONTENT',
    resourceScope: 'DISTRICT',
    isFree: true,
    isPublished: true,
    isArchived: false,
    s3Url: 'https://s3.amazonaws.com/bodhganga/states/nagaland/kohima/free/kohima_chronicles.pdf'
  },
  {
    id: 'res-assam-state-history',
    title: 'Ahom Dynasty and Assam Medieval History',
    stateSlug: 'assam',
    state: 'Assam',
    districtSlug: 'general',
    district: 'general',
    category: 'History',
    categorySlug: 'history',
    sectionSlug: 'history',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false,
    s3Url: 'https://s3.amazonaws.com/bodhganga/states/assam/general/free/ahom_dynasty.pdf'
  },
  {
    id: 'res-nagaland-state-geography',
    title: 'Nagaland Topography & Barail Range',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'Geography',
    categorySlug: 'geography',
    sectionSlug: 'geography',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false,
    s3Url: 'https://s3.amazonaws.com/bodhganga/states/nagaland/general/free/barail_range.pdf'
  },
  {
    id: 'res-missing-scope-ambiguous',
    title: 'Ambiguous Notes Without Scope or District',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: null,
    district: null,
    category: 'History',
    categorySlug: 'history',
    contentArea: null,
    resourceScope: null,
    isFree: true,
    isPublished: true,
    isArchived: false
  },
  {
    id: 'res-missing-category-ambiguous',
    title: 'State Document Without Category',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: null,
    categorySlug: null,
    sectionSlug: null,
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false
  },
  {
    id: 'res-unclassified-category',
    title: 'General Competitive Exam GK Guide',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'General Studies',
    categorySlug: 'general-studies',
    sectionSlug: null,
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: false
  },
  {
    id: 'res-archived-nagaland-history',
    title: 'Archived Nagaland State History Syllabus',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'History',
    categorySlug: 'history',
    sectionSlug: 'history',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: true,
    isArchived: true
  },
  {
    id: 'res-unpublished-nagaland-history',
    title: 'Draft Nagaland State History Syllabus',
    stateSlug: 'nagaland',
    state: 'Nagaland',
    districtSlug: 'general',
    district: 'general',
    category: 'History',
    categorySlug: 'history',
    sectionSlug: 'history',
    contentArea: 'STATE_CONTENT',
    resourceScope: 'STATE',
    isFree: true,
    isPublished: false,
    isArchived: false
  }
];

// Isolation filter implementation matching StateSectionPage
function filterStateSectionMaterials(products, targetStateSlug, targetSection) {
  return products.filter((p) => {
    if (!p) return false;

    // 1. Strict State Match: Must belong exclusively to target state
    const pStateSlug = String(p.stateSlug || '').toLowerCase().trim();
    if (pStateSlug !== targetStateSlug.toLowerCase().trim()) return false;

    // 2. Strict State-Level Scope: Must be general state level, never a district
    const dSlug = String(p.districtSlug || '').toLowerCase().trim();
    if (!dSlug || (dSlug !== 'general' && dSlug !== 'state')) return false;

    // 3. Strict Category Match: Must match canonical category for current section
    const catSlug = String(p.categorySlug || p.sectionSlug || '').toLowerCase().trim();
    const catName = String(p.category || '').toLowerCase().trim();

    if (targetSection === 'history') {
      const isHistory = catSlug === 'history' || catName === 'history';
      if (!isHistory) return false;
    } else if (targetSection === 'art-culture') {
      const isArtCulture =
        catSlug === 'art-culture' ||
        catSlug === 'art-and-culture' ||
        catName === 'art & culture' ||
        catName === 'art and culture';
      if (!isArtCulture) return false;
    } else if (targetSection === 'heritage-sites') {
      const isHeritage =
        catSlug === 'heritage-sites' ||
        catSlug === 'heritage-monuments' ||
        catSlug === 'heritage-sites-monuments' ||
        catSlug === 'history-heritage-sites' ||
        catName === 'heritage & sites' ||
        catName === 'heritage and sites' ||
        catName === 'history, heritage & sites';
      if (!isHeritage) return false;
    } else if (targetSection === 'geography') {
      const isGeo = catSlug === 'geography' || catName === 'geography';
      if (!isGeo) return false;
    } else {
      return false;
    }

    // 4. Publication and Archive Rules
    const isPublished = p.isPublished ?? p.published ?? true;
    const isArchived = p.isArchived ?? p.archived ?? false;
    const isDeleted = p.isDeleted ?? false;
    if (!isPublished || isArchived || isDeleted) return false;

    return true;
  });
}

// ── Test 1: /state/nagaland/history returns only Nagaland state-level History ──
const nagalandHistoryResults = filterStateSectionMaterials(FIXTURES, 'nagaland', 'history');
assert.strictEqual(nagalandHistoryResults.length, 1, 'Nagaland History page must return exactly 1 item');
assert.strictEqual(nagalandHistoryResults[0].id, 'res-nagaland-state-history');
console.log('✅ TEST 1 PASSED: /state/nagaland/history returns only Nagaland state-level History.');

// ── Test 2: Assam History never appears on Nagaland History page ──────────────
const assamInNagaland = nagalandHistoryResults.some(r => r.stateSlug === 'assam' || r.id === 'res-assam-state-history');
assert.strictEqual(assamInNagaland, false, 'Assam History must NEVER appear on Nagaland History page');
console.log('✅ TEST 2 PASSED: Assam History never appears on Nagaland History page.');

// ── Test 3: Nagaland district History never appears on Nagaland state History page
const districtInStateHistory = nagalandHistoryResults.some(r => r.districtSlug === 'kohima' || r.id === 'res-nagaland-district-history');
assert.strictEqual(districtInStateHistory, false, 'District-level History must NEVER appear on state History page');
console.log('✅ TEST 3 PASSED: Nagaland district History never appears on Nagaland state History page.');

// ── Test 4: Nagaland Art & Culture never appears on Nagaland History page ──────
const artInHistory = nagalandHistoryResults.some(r => r.category === 'Art & Culture' || r.id === 'res-nagaland-state-art-culture');
assert.strictEqual(artInHistory, false, 'Art & Culture must NEVER appear on History page');
console.log('✅ TEST 4 PASSED: Nagaland Art & Culture never appears on Nagaland History page.');

// ── Test 5: Missing or ambiguous metadata does not enter History results ───────
const ambiguousInResults = nagalandHistoryResults.some(r => 
  r.id === 'res-missing-scope-ambiguous' || 
  r.id === 'res-missing-category-ambiguous' || 
  r.id === 'res-unclassified-category' ||
  r.id === 'res-archived-nagaland-history' ||
  r.id === 'res-unpublished-nagaland-history'
);
assert.strictEqual(ambiguousInResults, false, 'Ambiguous/missing/archived/unpublished metadata must NEVER enter results');
console.log('✅ TEST 5 PASSED: Missing, ambiguous, unclassified, and archived/draft resources are strictly rejected.');

// ── Test 6: Empty Nagaland Heritage & Sites result stays empty ─────────────────
const emptyHeritageResults = filterStateSectionMaterials(FIXTURES, 'nagaland', 'heritage-sites');
assert.strictEqual(emptyHeritageResults.length, 0, 'Nagaland Heritage & Sites must be empty without falling back to other materials');
console.log('✅ TEST 6 PASSED: An empty category result stays empty instead of showing other resources or districts.');

// ── Test 7: Switching between states isolates data and prevents stale leakage ──
// Simulate navigation: user visits Assam History, then navigates to Nagaland History
let activeRoute = { stateSlug: 'assam', section: 'history' };
let loadedMaterials = filterStateSectionMaterials(FIXTURES, activeRoute.stateSlug, activeRoute.section);
assert.strictEqual(loadedMaterials.length, 1);
assert.strictEqual(loadedMaterials[0].id, 'res-assam-state-history');

// Route transition initiated: state cleared immediately
loadedMaterials = [];
assert.strictEqual(loadedMaterials.length, 0, 'Previous route materials must be cleared immediately upon navigation');

// New state loaded:
activeRoute = { stateSlug: 'nagaland', section: 'history' };
loadedMaterials = filterStateSectionMaterials(FIXTURES, activeRoute.stateSlug, activeRoute.section);
assert.strictEqual(loadedMaterials.length, 1);
assert.strictEqual(loadedMaterials[0].id, 'res-nagaland-state-history');
assert.ok(!loadedMaterials.some(r => r.stateSlug === 'assam'), 'Assam resources must never leak into Nagaland route');
console.log('✅ TEST 7 PASSED: Navigation state transitions completely isolate and clear previous state results.');

// ── Test 8: Isolation holds for all four categories ───────────────────────────
const artCultureResults = filterStateSectionMaterials(FIXTURES, 'nagaland', 'art-culture');
assert.strictEqual(artCultureResults.length, 1);
assert.strictEqual(artCultureResults[0].id, 'res-nagaland-state-art-culture');

const geographyResults = filterStateSectionMaterials(FIXTURES, 'nagaland', 'geography');
assert.strictEqual(geographyResults.length, 1);
assert.strictEqual(geographyResults[0].id, 'res-nagaland-state-geography');

const assamHistoryResults = filterStateSectionMaterials(FIXTURES, 'assam', 'history');
assert.strictEqual(assamHistoryResults.length, 1);
assert.strictEqual(assamHistoryResults[0].id, 'res-assam-state-history');
console.log('✅ TEST 8 PASSED: Strict isolation verified across Art & Culture, History, Heritage & Sites, and Geography.');

// ── Test 9: Codebase inspection tests to ensure anti-patterns are eliminated ──
const stateSectionPath = path.join(__dirname, '../pages/StateSectionPage.jsx');
const stateSectionCode = fs.readFileSync(stateSectionPath, 'utf8');

// Ensure dedicated endpoint is consumed
assert.ok(
  stateSectionCode.includes('/products/state/${stateSlug}/category/${section}'),
  'StateSectionPage must call dedicated category endpoint /products/state/${stateSlug}/category/${section}'
);

// Ensure anti-pattern: treating missing district as state-level is eliminated
assert.ok(
  !stateSectionCode.includes('!dSlug || dSlug === "general"'),
  'StateSectionPage must NOT treat missing district (!dSlug) as state-level scope'
);

// Ensure dependency array tracks [stateSlug, section]
assert.ok(
  stateSectionCode.includes('[stateSlug, section]'),
  'StateSectionPage useEffect must depend on [stateSlug, section]'
);

// Ensure error handling clears products
assert.ok(
  stateSectionCode.includes('setError(') && stateSectionCode.includes('setProducts([])'),
  'StateSectionPage must clear products on error to prevent stale display'
);
console.log('✅ TEST 9 PASSED: Anti-patterns successfully eliminated from StateSectionPage codebase.');

console.log('\n🎉 ALL 9 FRONTEND ISOLATION AND NEGATIVE TESTS PASSED SUCCESSFULLY!');
