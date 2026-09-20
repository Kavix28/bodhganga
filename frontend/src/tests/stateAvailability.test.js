import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running Frontend State Availability Policy Verification Tests...\n');

// Read testSeriesData.js directly to verify data declarations
const testSeriesPath = path.join(__dirname, '../data/testSeriesData.js');
const fileContent = fs.readFileSync(testSeriesPath, 'utf8');

// Helper to check policy rule for state objects
function isStateQuizAvailable(item) {
    if (!item) return false;
    const id = typeof item === 'string' ? item : (item.id || item.slug || '');
    const code = typeof item === 'object' ? (item.code || '') : '';
    const isMh = id.toLowerCase() === 'maharashtra' || code.toUpperCase() === 'MH';
    return isMh && (typeof item === 'object' ? Boolean(item.isAvailable !== false) : true);
}

// Strip imports and export keywords from testSeriesData code and evaluate in sandbox
const sanitizedCode = fileContent
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, 'const getStateImage = () => null;')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    + '\nreturn { rawStatesAndUtTestData, statesAndUtTestData, isStateQuizAvailable };';

const evalFn = new Function(sanitizedCode);
const { rawStatesAndUtTestData, statesAndUtTestData } = evalFn();

// 1. Verify Maharashtra is AVAILABLE
const maharashtra = statesAndUtTestData.find(s => s.id === 'maharashtra' || s.code === 'MH');
assert.ok(maharashtra, 'Maharashtra state record must exist');
assert.strictEqual(maharashtra.isAvailable, true, 'Maharashtra card must be AVAILABLE');
assert.strictEqual(maharashtra.coveredDistrictsCount, 1, 'Maharashtra must show 1 covered district (Akola)');
assert.strictEqual(maharashtra.freeTestAvailable, true, 'Maharashtra must have free tests enabled');
assert.strictEqual(isStateQuizAvailable(maharashtra), true, 'isStateQuizAvailable(maharashtra) must return true');
console.log('✅ Test 1 Passed: Maharashtra card is AVAILABLE (1 / 36 districts covered).');

// 2. Verify Karnataka is COMING SOON
const karnataka = statesAndUtTestData.find(s => s.id === 'karnataka' || s.code === 'KA');
assert.ok(karnataka, 'Karnataka state record must exist');
assert.strictEqual(karnataka.isAvailable, false, 'Karnataka card must be COMING SOON');
assert.strictEqual(karnataka.totalTests, 0, 'Karnataka must have 0 total tests');
assert.strictEqual(karnataka.coveredDistrictsCount, 0, 'Karnataka must show 0 covered districts');
assert.strictEqual(karnataka.freeTestAvailable, false, 'Karnataka must NOT display active Free Tests');
assert.strictEqual(isStateQuizAvailable(karnataka), false, 'isStateQuizAvailable(karnataka) must return false');
console.log('✅ Test 2 Passed: Karnataka card is COMING SOON (0 / 31 districts covered, 0 tests).');

// 3. Verify ALL non-Maharashtra states and UTs are COMING SOON
const nonMhStates = statesAndUtTestData.filter(s => s.id !== 'maharashtra' && s.code !== 'MH');
assert.ok(nonMhStates.length >= 35, 'Must have at least 35 non-Maharashtra regions');

let violationCount = 0;
for (const s of nonMhStates) {
    if (s.isAvailable || s.totalTests > 0 || s.freeTestAvailable || s.coveredDistrictsCount > 0) {
        console.error(`❌ Policy violation in state: ${s.name} (${s.id})`);
        violationCount++;
    }
    assert.strictEqual(isStateQuizAvailable(s), false, `State ${s.name} must not be quiz-available`);
}

assert.strictEqual(violationCount, 0, 'Zero non-Maharashtra states may be marked available');
console.log(`✅ Test 3 Passed: All ${nonMhStates.length} non-Maharashtra states and UTs are strictly COMING SOON.`);

// 4. Verify District level availability (only Akola is enabled)
const mhAkola = maharashtra.districts.find(d => d.id === 'akola');
assert.ok(mhAkola, 'Akola district must exist in Maharashtra');
assert.strictEqual(mhAkola.isAvailable, true, 'Akola district must be AVAILABLE');

const mhOtherDistricts = maharashtra.districts.filter(d => d.id !== 'akola');
for (const d of mhOtherDistricts) {
    assert.strictEqual(d.isAvailable, false, `District ${d.name} in Maharashtra must be COMING SOON`);
}
console.log(`✅ Test 4 Passed: Only Akola is enabled in Maharashtra; all other ${mhOtherDistricts.length} districts are COMING SOON.`);

console.log('\n🎉 ALL FRONTEND STATE AVAILABILITY TESTS PASSED SUCCESSFULLY!');
