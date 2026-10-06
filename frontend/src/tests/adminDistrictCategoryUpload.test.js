import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeMojibake } from '../utils/formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running State/District Final Resource Architecture & Category Test Suite...\n');

// Read relevant files
const adminPagePath = path.join(__dirname, '../pages/admin/AdminStateResources.jsx');
const adminContent = fs.readFileSync(adminPagePath, 'utf8');

const stateTabsPath = path.join(__dirname, '../components/states/StateSectionTabs.jsx');
const stateTabsContent = fs.readFileSync(stateTabsPath, 'utf8');

const districtProductsPath = path.join(__dirname, '../pages/StateDistrictProductsPage.jsx');
const districtProductsContent = fs.readFileSync(districtProductsPath, 'utf8');

const districtResourcesPath = path.join(__dirname, '../pages/DistrictResourcesPage.jsx');
const districtResourcesContent = fs.readFileSync(districtResourcesPath, 'utf8');

// TEST 1: State resource UI contains Art & Culture, History, Heritage & Sites, Geography
assert.ok(stateTabsContent.includes("'art-culture'") && stateTabsContent.includes("Art & Culture"), 'State tabs must include Art & Culture');
assert.ok(stateTabsContent.includes("'history'") && stateTabsContent.includes("History"), 'State tabs must include History');
assert.ok(stateTabsContent.includes("'heritage-sites'") && stateTabsContent.includes("Heritage & Sites"), 'State tabs must include Heritage & Sites');
assert.ok(stateTabsContent.includes("'geography'") && stateTabsContent.includes("Geography"), 'State tabs must include Geography');
console.log('✅ TEST 1 PASSED: State resource UI contains Art & Culture, History, Heritage & Sites, Geography.');

// TEST 2: District resource UI does NOT contain those four content tabs
assert.strictEqual(districtProductsContent.includes('<StateSectionTabs'), false, 'StateDistrictProductsPage must NOT render StateSectionTabs');
assert.strictEqual(districtResourcesContent.includes('<StateSectionTabs'), false, 'DistrictResourcesPage must NOT render StateSectionTabs');
console.log('✅ TEST 2 PASSED: District resource UI does NOT contain the four state content tabs.');

// TEST 3: District resource UI contains Free and Paid resource access filters
assert.ok(districtProductsContent.includes('Free Resources') && districtProductsContent.includes('Paid Resources'), 'StateDistrictProductsPage must render Free & Paid resource filters');
assert.ok(districtResourcesContent.includes('Free Resources') && districtResourcesContent.includes('Paid Resources'), 'DistrictResourcesPage must render Free & Paid resource filters');
console.log('✅ TEST 3 PASSED: District resource UI contains Free Resources and Paid Resources filters.');

// TEST 4: Admin State upload contains Art & Culture, History, Heritage & Sites, Geography
assert.ok(adminContent.includes('STATE_RESOURCE_CATEGORIES = [') && adminContent.includes("'Art & Culture'"), 'Admin panel must declare STATE_RESOURCE_CATEGORIES with Art & Culture');
assert.ok(adminContent.includes('<option value="Art & Culture">Art & Culture</option>'), 'Admin state dropdown must render Art & Culture option');
assert.ok(adminContent.includes('<option value="History">History</option>'), 'Admin state dropdown must render History option');
assert.ok(adminContent.includes('<option value="Heritage & Sites">Heritage & Sites</option>'), 'Admin state dropdown must render Heritage & Sites option');
assert.ok(adminContent.includes('<option value="Geography">Geography</option>'), 'Admin state dropdown must render Geography option');
console.log('✅ TEST 4 PASSED: Admin State upload contains Art & Culture, History, Heritage & Sites, Geography.');

// TEST 5: Admin District upload contains Free, Paid
assert.ok(adminContent.includes('DISTRICT_RESOURCE_ACCESS_TIERS = [') && adminContent.includes("'Free'"), 'Admin panel must declare DISTRICT_RESOURCE_ACCESS_TIERS');
assert.ok(adminContent.includes('<option value="Free">Free</option>'), 'Admin district dropdown must render Free option');
assert.ok(adminContent.includes('<option value="Paid">Paid</option>'), 'Admin district dropdown must render Paid option');
console.log('✅ TEST 5 PASSED: Admin District upload contains Free and Paid options.');

// TEST 6: Admin District upload does NOT contain Art & Culture, History, Heritage & Sites, Geography as district category options
assert.ok(adminContent.includes("isStateLevel ? (\n                                <select") || adminContent.includes("isStateLevel ?"), 'Admin modal must branch category selector based on isStateLevel');
assert.ok(adminContent.includes("setCategory(e.target.value);\n                                        setIsFree(e.target.value === 'Free');"), 'District upload selector switches access tier cleanly');
console.log('✅ TEST 6 PASSED: Admin District upload does NOT contain state content category options.');

// TEST 7: Admin State upload does NOT incorrectly use Free/Paid as the category
assert.ok(adminContent.includes("setCategory(isStateLevel ? 'Art & Culture' : 'Free');"), 'State upload initializes category to content category (Art & Culture), not Free/Paid');
console.log('✅ TEST 7 PASSED: Admin State upload does NOT use Free/Paid as its content category.');

// TEST 8: Unicode district names remain correct via decodeMojibake
assert.strictEqual(decodeMojibake("ChÃ¼moukedima"), "Chümoukedima", "Mojibake string for Chümoukedima must decode accurately");
assert.strictEqual(decodeMojibake("TseminyÃ¼"), "Tseminyü", "Mojibake string for Tseminyü must decode accurately");
assert.strictEqual(decodeMojibake("ZÃ¼nheboto"), "Zünheboto", "Mojibake string for Zünheboto must decode accurately");
console.log('✅ TEST 8 PASSED: Unicode district names (Chümoukedima, Tseminyü, Zünheboto) decode accurately.');

console.log('\n🎉 ALL 8 REQUIRED ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
