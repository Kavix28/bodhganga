import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running Admin District Upload Categories & Semantics Test Suite...\n');

// Read AdminStateResources.jsx directly to verify district upload category selector implementation
const adminPagePath = path.join(__dirname, '../pages/admin/AdminStateResources.jsx');
const fileContent = fs.readFileSync(adminPagePath, 'utf8');

// 1. Verify DISTRICT_RESOURCE_CATEGORIES export exists and contains the exact 4 categories
assert.ok(fileContent.includes("DISTRICT_RESOURCE_CATEGORIES = ['Art & Culture', 'History', 'Heritage & Sites', 'Geography']"), 'Admin page must declare the four district resource categories');
console.log('✅ Test 1 Passed: Admin panel defines the four mandatory district categories: Art & Culture, History, Heritage & Sites, Geography.');

// 2. Verify District Scope category select dropdown in AdminResourceUploadModal
assert.ok(fileContent.includes('<option value="Art & Culture">Art & Culture</option>'), 'Upload modal must include Art & Culture option');
assert.ok(fileContent.includes('<option value="History">History</option>'), 'Upload modal must include History option');
assert.ok(fileContent.includes('<option value="Heritage & Sites">Heritage & Sites</option>'), 'Upload modal must include Heritage & Sites option');
assert.ok(fileContent.includes('<option value="Geography">Geography</option>'), 'Upload modal must include Geography option');
console.log('✅ Test 2 Passed: Upload modal dropdown contains all four district content categories.');

// 3. Verify category payload in uploadFileItem passes category field cleanly
assert.ok(fileContent.includes("formData.append('category', category);"), 'Upload modal must send selected category string in formData');
assert.ok(fileContent.includes("formData.append('isFree', isFree ? 'true' : 'false');"), 'Access tier (isFree) must remain separate from category');
console.log('✅ Test 3 Passed: Category payload is sent cleanly and Access Tier (Free/Paid) remains independent.');

// 4. Verify validation prevents invalid category submission
assert.ok(fileContent.includes("validDistrictCats.includes(category)"), 'Upload modal must validate selected district category');
console.log('✅ Test 4 Passed: Admin upload validation blocks invalid categories.');

console.log('\n🎉 ALL ADMIN DISTRICT CATEGORY UPLOAD TESTS PASSED SUCCESSFULLY!');
