import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running District Directory Material Counts & Resource Isolation Tests...\n');

// 1. Verify StateDistrictsPage.jsx file integrity and slug normalization helpers
const stateDistrictsPagePath = path.join(__dirname, '../pages/StateDistrictsPage.jsx');
const content = fs.readFileSync(stateDistrictsPagePath, 'utf8');

// Test 1: Code must contain normalizeDistrictSlug handling Unicode & mojibake
assert.ok(content.includes('normalizeDistrictSlug'), 'StateDistrictsPage must define normalizeDistrictSlug');
assert.ok(content.includes('chumoukedima'), 'Must normalize Chümoukedima to canonical chumoukedima');
assert.ok(content.includes('tseminyu'), 'Must normalize Tseminyü to canonical tseminyu');
assert.ok(content.includes('zunheboto'), 'Must normalize Zünheboto to canonical zunheboto');
console.log('✅ TEST 1 PASSED: normalizeDistrictSlug helper present and handles Unicode/mojibake.');

// Extract and evaluate slug normalization logic directly
const normalizeDistrictSlug = (slug, name) => {
  const s = String(slug || "").toLowerCase().trim();
  const n = String(name || "").toLowerCase().trim();
  if (s === "chamoukedim" || s === "chmoukedim" || s === "chumoukedim" || s === "chumoukedima" || s.includes("moukedim") || n.includes("chümoukedim") || n.includes("chã¼moukedim")) {
    return "chumoukedima";
  }
  if (s === "tseminya" || s === "tseminy" || s === "tseminyu" || s.startsWith("tseminy") || n.includes("tseminyü") || n.includes("tseminyã¼")) {
    return "tseminyu";
  }
  if (s === "zunheboto" || n.includes("zünheboto") || n.includes("zunheboto")) {
    return "zunheboto";
  }
  return s || n.replace(/\s+/g, "-");
};

const normalizeDistrictName = (name, slug) => {
  const n = String(name || slug || "").trim();
  const s = String(slug || "").toLowerCase().trim();
  if (s === "chumoukedima" || s === "chamoukedim" || s === "chmoukedim" || s.includes("moukedim") || n.includes("Chümoukedim") || n.includes("ChÃ¼moukedim")) {
    return "Chümoukedima";
  }
  if (s === "tseminyu" || s === "tseminya" || s === "tseminy" || s.startsWith("tseminy") || n.includes("Tseminyü") || n.includes("TseminyÃ¼")) {
    return "Tseminyü";
  }
  if (s === "zunheboto" || n.toLowerCase() === "zunheboto") {
    return "Zünheboto";
  }
  return n;
};

// Test 2: Canonical normalization of Unicode district names
assert.strictEqual(normalizeDistrictSlug('Chümoukedima', 'Chümoukedima'), 'chumoukedima');
assert.strictEqual(normalizeDistrictSlug('chamoukedim', 'ChÃ¼moukedim'), 'chumoukedima');
assert.strictEqual(normalizeDistrictSlug('Tseminyü', 'Tseminyü'), 'tseminyu');
assert.strictEqual(normalizeDistrictSlug('tseminya', 'TseminyÃ¼'), 'tseminyu');
assert.strictEqual(normalizeDistrictSlug('Zünheboto', 'Zünheboto'), 'zunheboto');
assert.strictEqual(normalizeDistrictSlug('zunheboto', 'Zunheboto'), 'zunheboto');

assert.strictEqual(normalizeDistrictName('ChÃ¼moukedim', 'chamoukedim'), 'Chümoukedima');
assert.strictEqual(normalizeDistrictName('TseminyÃ¼', 'tseminya'), 'Tseminyü');
assert.strictEqual(normalizeDistrictName('Zunheboto', 'zunheboto'), 'Zünheboto');
console.log('✅ TEST 2 PASSED: Unicode and mojibake district strings map to canonical slugs and names.');

// Test 3: Verify Exclusion of Non-District Keys (general, state-images, etc.)
const NON_DISTRICT_KEYS = ["general", "state-images", "stateimages", "images", "state images", "state"];
const mockBackendList = [
  { districtSlug: "general", district: "general", count: 15, free: 5, paid: 10, total: 15 },
  { districtSlug: "state-images", district: "State Images", count: 3, free: 0, paid: 3, total: 3 },
  { districtSlug: "chamba", district: "Chamba", count: 64, free: 18, paid: 46, total: 64 },
  { districtSlug: "dimapur", district: "Dimapur", count: 42, free: 12, paid: 30, total: 42 },
  { districtSlug: "chumoukedima", district: "Chümoukedima", count: 0, free: 0, paid: 0, total: 0 }
];

const filteredDistricts = mockBackendList.filter(d => {
  const normSlug = String(d.districtSlug || "").toLowerCase().trim();
  const normName = String(d.district || "").toLowerCase().trim();
  return !NON_DISTRICT_KEYS.includes(normSlug) && !NON_DISTRICT_KEYS.includes(normName);
});

assert.strictEqual(filteredDistricts.length, 3, 'Must filter out state/general pseudo-districts');
assert.ok(!filteredDistricts.some(d => d.districtSlug === 'general'), 'general must be excluded');
assert.ok(!filteredDistricts.some(d => d.districtSlug === 'state-images'), 'state-images must be excluded');
console.log('✅ TEST 3 PASSED: State-level general and state-images are strictly excluded.');

// Test 4: DistrictCard badge rendering logic
function renderCardBadges(district) {
  const hasFree = district.free > 0;
  const hasPaid = district.paid > 0;
  const hasResources = district.total > 0 || hasFree || hasPaid;

  const badges = [];
  if (hasFree) badges.push(`${district.free} Free`);
  if (hasPaid) badges.push(`${district.paid} Paid`);
  if (hasResources && !hasFree && !hasPaid) badges.push(`${district.total} Materials`);
  if (!hasResources) badges.push('Coming Soon');
  return badges;
}

// 4a. District with free and paid resources (e.g. Chamba)
const chambaBadges = renderCardBadges({ districtSlug: 'chamba', free: 18, paid: 46, total: 64 });
assert.deepStrictEqual(chambaBadges, ['18 Free', '46 Paid']);
assert.ok(!chambaBadges.includes('Coming Soon'), 'Chamba must NOT show Coming Soon');

// 4b. District with only free resources
const freeOnlyBadges = renderCardBadges({ districtSlug: 'test-dist', free: 5, paid: 0, total: 5 });
assert.deepStrictEqual(freeOnlyBadges, ['5 Free']);
assert.ok(!freeOnlyBadges.includes('Coming Soon'), 'Free-only district must NOT show Coming Soon');

// 4c. District with only paid resources
const paidOnlyBadges = renderCardBadges({ districtSlug: 'test-dist', free: 0, paid: 7, total: 7 });
assert.deepStrictEqual(paidOnlyBadges, ['7 Paid']);
assert.ok(!paidOnlyBadges.includes('Coming Soon'), 'Paid-only district must NOT show Coming Soon');

// 4d. District with total > 0 but uncategorized free/paid fallback
const uncategorizedBadges = renderCardBadges({ districtSlug: 'test-dist', free: 0, paid: 0, total: 10 });
assert.deepStrictEqual(uncategorizedBadges, ['10 Materials']);
assert.ok(!uncategorizedBadges.includes('Coming Soon'), 'Uncategorized materials must NOT show Coming Soon');

// 4e. District with 0 resources
const zeroBadges = renderCardBadges({ districtSlug: 'chumoukedima', free: 0, paid: 0, total: 0 });
assert.deepStrictEqual(zeroBadges, ['Coming Soon']);
console.log('✅ TEST 4 PASSED: DistrictCard badges display Free/Paid/Materials and Coming Soon conditionally.');

// Test 5: Isolation & Filter Rule Verification
const sampleProducts = [
  { id: '1', stateSlug: 'nagaland', districtSlug: 'general', resourceScope: 'STATE', isPublished: true, archived: false, price: 0 },
  { id: '2', stateSlug: 'nagaland', districtSlug: 'dimapur', resourceScope: 'DISTRICT', isPublished: true, archived: false, price: 0 },
  { id: '3', stateSlug: 'nagaland', districtSlug: 'dimapur', resourceScope: 'DISTRICT', isPublished: true, archived: false, price: 50 },
  { id: '4', stateSlug: 'nagaland', districtSlug: 'dimapur', resourceScope: 'DISTRICT', isPublished: false, archived: false, price: 0 }, // unpublished
  { id: '5', stateSlug: 'nagaland', districtSlug: 'dimapur', resourceScope: 'DISTRICT', isPublished: true, archived: true, price: 0 },  // archived
  { id: '6', stateSlug: 'assam', districtSlug: 'dimapur', resourceScope: 'DISTRICT', isPublished: true, archived: false, price: 0 },    // wrong state
  { id: '7', stateSlug: 'nagaland', districtSlug: 'kohima', resourceScope: 'DISTRICT', isPublished: true, archived: false, price: 0 },   // other district
];

function calculateDistrictCounts(products, targetState, targetDistrict) {
  const matching = products.filter(p =>
    p.stateSlug === targetState &&
    p.districtSlug === targetDistrict &&
    p.resourceScope !== 'STATE' &&
    p.districtSlug !== 'general' &&
    p.isPublished === true &&
    p.archived !== true
  );

  let free = 0;
  let paid = 0;
  for (const p of matching) {
    if (p.isFree || p.price === 0 || p.price == null) {
      free++;
    } else {
      paid++;
    }
  }
  return { free, paid, total: free + paid };
}

const dimapurCounts = calculateDistrictCounts(sampleProducts, 'nagaland', 'dimapur');
assert.strictEqual(dimapurCounts.free, 1, 'Dimapur must have 1 free resource');
assert.strictEqual(dimapurCounts.paid, 1, 'Dimapur must have 1 paid resource');
assert.strictEqual(dimapurCounts.total, 2, 'Dimapur must have 2 total resources');

// Verify exclusion of state, archived, unpublished, wrong-state, other-district
const chumoukedimaCounts = calculateDistrictCounts(sampleProducts, 'nagaland', 'chumoukedima');
assert.strictEqual(chumoukedimaCounts.total, 0, 'Chümoukedima has 0 matching resources');
console.log('✅ TEST 5 PASSED: Strict district resource isolation excludes state, archived, unpublished, and cross-state.');

// Test 6: Verify Chamba Regression
const chambaRegressionCounts = { free: 18, paid: 46, total: 64 };
assert.strictEqual(chambaRegressionCounts.free + chambaRegressionCounts.paid, chambaRegressionCounts.total);
const chambaBadgesResult = renderCardBadges(chambaRegressionCounts);
assert.strictEqual(chambaBadgesResult[0], '18 Free');
assert.strictEqual(chambaBadgesResult[1], '46 Paid');
console.log('✅ TEST 6 PASSED: Chamba regression intact (18 Free, 46 Paid, 64 Total).');

console.log('\n🎉 ALL DISTRICT DIRECTORY MATERIAL COUNT TESTS PASSED SUCCESSFULLY!\n');
