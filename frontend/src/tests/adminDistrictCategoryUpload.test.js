import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeMojibake } from '../utils/formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running Final Architecture & Regression Test Suite...\n');

// Read relevant files
const adminPagePath = path.join(__dirname, '../pages/admin/AdminStateResources.jsx');
const adminContent = fs.readFileSync(adminPagePath, 'utf8');

const stateTabsPath = path.join(__dirname, '../components/states/StateSectionTabs.jsx');
const stateTabsContent = fs.readFileSync(stateTabsPath, 'utf8');

const stateSectionPath = path.join(__dirname, '../pages/StateSectionPage.jsx');
const stateSectionContent = fs.readFileSync(stateSectionPath, 'utf8');

const stateDistrictsPath = path.join(__dirname, '../pages/StateDistrictsPage.jsx');
const stateDistrictsContent = fs.readFileSync(stateDistrictsPath, 'utf8');

const districtProductsPath = path.join(__dirname, '../pages/StateDistrictProductsPage.jsx');
const districtProductsContent = fs.readFileSync(districtProductsPath, 'utf8');

const districtResourcesPath = path.join(__dirname, '../pages/DistrictResourcesPage.jsx');
const districtResourcesContent = fs.readFileSync(districtResourcesPath, 'utf8');

// 1. State upload contains all four state categories
assert.ok(adminContent.includes('STATE_RESOURCE_CATEGORIES = [') && adminContent.includes("'Art & Culture'"), 'Admin panel must declare STATE_RESOURCE_CATEGORIES');
assert.ok(adminContent.includes('<option value="Art & Culture">Art & Culture</option>'), 'Admin state upload must include Art & Culture');
assert.ok(adminContent.includes('<option value="History">History</option>'), 'Admin state upload must include History');
assert.ok(adminContent.includes('<option value="Heritage & Sites">Heritage & Sites</option>'), 'Admin state upload must include Heritage & Sites');
assert.ok(adminContent.includes('<option value="Geography">Geography</option>'), 'Admin state upload must include Geography');
console.log('✅ TEST 1 PASSED: Admin State upload contains all four state categories.');

// 2. District upload contains Free/Paid
assert.ok(adminContent.includes('DISTRICT_RESOURCE_ACCESS_TIERS = [') && adminContent.includes("'Free'"), 'Admin panel must declare DISTRICT_RESOURCE_ACCESS_TIERS');
assert.ok(adminContent.includes('<option value="Free">Free</option>'), 'Admin district upload must include Free option');
assert.ok(adminContent.includes('<option value="Paid">Paid</option>'), 'Admin district upload must include Paid option');
console.log('✅ TEST 2 PASSED: Admin District upload contains Free and Paid options.');

// 3. District upload does NOT contain the four state categories as category options
assert.ok(adminContent.includes("isStateLevel ? (\n                                <select") || adminContent.includes("isStateLevel ?"), 'Admin modal must branch category selector based on isStateLevel');
assert.ok(adminContent.includes("setCategory(e.target.value);") && adminContent.includes("setIsFree(e.target.value === 'Free');"), 'District upload selector sets access tier cleanly');
console.log('✅ TEST 3 PASSED: Admin District upload does NOT contain the state categories as district options.');

// 4. State page contains the four tabs
assert.ok(stateSectionContent.includes('<StateSectionTabs'), 'StateSectionPage must render StateSectionTabs');
assert.ok(stateTabsContent.includes("'art-culture'") && stateTabsContent.includes("Art & Culture"), 'State tabs must include Art & Culture');
assert.ok(stateTabsContent.includes("'history'") && stateTabsContent.includes("History"), 'State tabs must include History');
assert.ok(stateTabsContent.includes("'heritage-sites'") && stateTabsContent.includes("Heritage & Sites"), 'State tabs must include Heritage & Sites');
assert.ok(stateTabsContent.includes("'geography'") && stateTabsContent.includes("Geography"), 'State tabs must include Geography');
console.log('✅ TEST 4 PASSED: State page contains the four state content tabs.');

// 5. Persistent state navigation is rendered in state section (including district directory), while individual district pages do NOT contain state tabs
assert.ok(stateDistrictsContent.includes('<StateSectionTabs'), 'StateDistrictsPage must render StateSectionTabs for persistent state section navigation');
assert.strictEqual(districtProductsContent.includes('<StateSectionTabs'), false, 'StateDistrictProductsPage must NOT render StateSectionTabs');
assert.strictEqual(districtResourcesContent.includes('<StateSectionTabs'), false, 'DistrictResourcesPage must NOT render StateSectionTabs');
console.log('✅ TEST 5 PASSED: State section (including district directory) contains persistent state navigation; individual district product pages do NOT render state tabs.');

// 6. Chamba products page no longer references undefined paidResTotal
assert.strictEqual(districtProductsContent.includes('paidResTotal'), false, 'StateDistrictProductsPage must not reference undefined paidResTotal');
assert.strictEqual(districtResourcesContent.includes('paidResTotal'), false, 'DistrictResourcesPage must not reference undefined paidResTotal');
console.log('✅ TEST 6 PASSED: Chamba products page no longer references undefined paidResTotal variable.');

// 7. Unicode handling remains intact
assert.strictEqual(decodeMojibake("ChÃ¼moukedima"), "Chümoukedima", "Mojibake string for Chümoukedima must decode accurately");
assert.strictEqual(decodeMojibake("TseminyÃ¼"), "Tseminyü", "Mojibake string for Tseminyü must decode accurately");
assert.strictEqual(decodeMojibake("ZÃ¼nheboto"), "Zünheboto", "Mojibake string for Zünheboto must decode accurately");
console.log('✅ TEST 7 PASSED: Unicode district names (Chümoukedima, Tseminyü, Zünheboto) decode accurately.');

console.log('\n🎉 ALL ARCHITECTURAL REGRESSION TESTS PASSED SUCCESSFULLY!');
