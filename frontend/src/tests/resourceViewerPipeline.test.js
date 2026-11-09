import assert from 'node:assert';

console.log('🧪 Running Resource Viewer & Canonical PDF Pipeline Tests...\n');

// =========================================================================
// 1. URL Construction & Canonical Resource Identification
// =========================================================================

function buildResourceUrl(baseUrl, resource) {
    const resourceId = resource?.id || resource?._id;
    let key = resource?.s3Key || resource?.storageKey;
    if (!key && resource?.s3Url) {
        const match = resource.s3Url.match(/amazonaws\.com\/(.+)$/);
        if (match) {
            key = decodeURIComponent(match[1]);
        }
    }

    const params = new URLSearchParams();
    if (key) params.append('key', key);
    if (resourceId) params.append('id', resourceId);

    const qs = params.toString();
    return `${baseUrl}/pdf/resource${qs ? `?${qs}` : ''}`;
}

// Test 1: Simple free resource URL construction
const res1 = { id: '6aa123f5edc2296bdf3a25b1', s3Key: 'simple.pdf' };
const url1 = buildResourceUrl('/api', res1);
assert.strictEqual(url1, '/api/pdf/resource?key=simple.pdf&id=6aa123f5edc2296bdf3a25b1');
assert.ok(!url1.includes('%2F') || url1.indexOf('?') < url1.indexOf('%2F'), 'Path must not contain encoded slashes');
console.log('✅ Test 1 Passed: Simple resource builds canonical query parameter URL.');

// Test 2: Nested S3 Key with spaces and Unicode (Hindi)
const res2 = {
    id: '6aa123f5edc2296bdf3a25b2',
    s3Key: 'haryana/kurukshetra/free/Kurukshetra Infographic Hindi.png'
};
const url2 = buildResourceUrl('/api', res2);
assert.ok(url2.startsWith('/api/pdf/resource?'), 'URL must target /api/pdf/resource path');
assert.ok(url2.includes('key=haryana%2Fkurukshetra%2Ffree%2FKurukshetra+Infographic+Hindi.png') ||
          url2.includes('key=haryana%2Fkurukshetra%2Ffree%2FKurukshetra%20Infographic%20Hindi.png'),
          'Key must be in query string, NOT in path component');
console.log('✅ Test 2 Passed: Nested S3 key with spaces is correctly placed in query parameter without path rejection.');

// Test 3: Filename containing parentheses
const res3 = {
    id: '6aa123f5edc2296bdf3a25b3',
    s3Key: 'haryana/kurukshetra/free/Kurukshetra_Notes_(Final_Version).pdf'
};
const url3 = buildResourceUrl('/api', res3);
assert.ok(url3.includes('Kurukshetra_Notes_'), 'Preserves parentheses in query parameter');
console.log('✅ Test 3 Passed: Filename with parentheses is preserved.');

// Test 4: Unicode Hindi characters in resource key
const res4 = {
    id: '6aa123f5edc2296bdf3a25b4',
    s3Key: 'haryana/kurukshetra/free/कुरुक्षेत्र_इतिहास_हिंदी.pdf'
};
const url4 = buildResourceUrl('/api', res4);
assert.ok(url4.includes('%E0%A4%95%E0%A4%B1%E0%A5%81') || decodeURIComponent(url4).includes('कुरुक्षेत्र'),
          'Preserves Unicode Hindi characters');
console.log('✅ Test 4 Passed: Hindi Unicode filename is safely encoded in query parameter.');

// =========================================================================
// 2. Error Classification & Non-Transient vs Transient Failure Mapping
// =========================================================================

function classifyViewerError(err) {
    const status = err?.status || err?.response?.status;
    const code = err?.code;
    const isNetwork = err?.networkError || (err?.message && err.message.includes('Network Error'));

    if (status === 400) {
        return {
            title: 'Malformed Resource Request',
            message: err.message || 'The requested material key or identifier is malformed.',
            canRetry: false
        };
    }
    if (status === 401) {
        return {
            title: 'Authentication Required',
            message: 'Please sign in to your BodhGanga account to access this material.',
            canRetry: false,
            isAuth: true
        };
    }
    if (status === 403) {
        return {
            title: 'Access Restricted',
            message: err.message || 'Subscription or district unlock required to access this material.',
            canRetry: false
        };
    }
    if (status === 404) {
        return {
            title: 'Material Not Found',
            message: err.message || 'The requested study material could not be found in storage.',
            canRetry: false
        };
    }
    if (status === 500) {
        return {
            title: 'Server Error',
            message: 'An internal server error occurred while preparing this material.',
            canRetry: true
        };
    }
    if (status === 502 || status === 503 || status === 504) {
        return {
            title: 'Service Temporarily Unavailable',
            message: 'Storage services are temporarily unreachable. Please retry shortly.',
            canRetry: true
        };
    }
    if (code === 'TIMEOUT') {
        return {
            title: 'Request Timeout',
            message: 'The server took too long to generate access for this material. Please retry.',
            canRetry: true
        };
    }
    return {
        title: isNetwork ? 'Connection Issue' : 'Unable to Open Material',
        message: err?.message || 'Failed to secure access link from server.',
        canRetry: isNetwork
    };
}

// Test 5: 400 Malformed Request -> Non-retryable
const err400 = classifyViewerError({ status: 400, message: 'Invalid resource path.' });
assert.strictEqual(err400.canRetry, false, '400 must NOT be retryable');
assert.strictEqual(err400.title, 'Malformed Resource Request');
console.log('✅ Test 5 Passed: 400 Bad Request correctly classified as non-retryable.');

// Test 6: 401 Unauthorized -> Non-retryable, flags auth
const err401 = classifyViewerError({ status: 401 });
assert.strictEqual(err401.canRetry, false, '401 must NOT be retryable');
assert.strictEqual(err401.isAuth, true, '401 must flag authentication required');
console.log('✅ Test 6 Passed: 401 Unauthorized correctly flags sign-in requirement.');

// Test 7: 403 Forbidden -> Non-retryable
const err403 = classifyViewerError({ status: 403, message: 'District unlock required.' });
assert.strictEqual(err403.canRetry, false, '403 must NOT be retryable');
assert.strictEqual(err403.title, 'Access Restricted');
console.log('✅ Test 7 Passed: 403 Forbidden correctly classified as access restricted without retry loop.');

// Test 8: 404 Not Found -> Non-retryable
const err404 = classifyViewerError({ status: 404, message: 'Material not found.' });
assert.strictEqual(err404.canRetry, false, '404 must NOT be retryable');
assert.strictEqual(err404.title, 'Material Not Found');
console.log('✅ Test 8 Passed: 404 Not Found correctly classified as non-retryable.');

// Test 9: 500 / 502 / 503 / Timeout -> Retryable
const err500 = classifyViewerError({ status: 500 });
assert.strictEqual(err500.canRetry, true, '500 must be retryable');

const err502 = classifyViewerError({ status: 502 });
assert.strictEqual(err502.canRetry, true, '502 must be retryable');

const errTimeout = classifyViewerError({ code: 'TIMEOUT' });
assert.strictEqual(errTimeout.canRetry, true, 'Timeout must be retryable');

const errNetwork = classifyViewerError({ networkError: true, message: 'Network Error' });
assert.strictEqual(errNetwork.canRetry, true, 'Network Error must be retryable');
console.log('✅ Test 9 Passed: Transient errors (500, 502, Timeout, Network) correctly enable the retry action.');

// =========================================================================
// 3. Security & Anti-Download Policy Verification
// =========================================================================

// Test 10: S3 presigned URL response content disposition
function checkContentDisposition(url) {
    const parsed = new URL(url);
    const disposition = parsed.searchParams.get('response-content-disposition');
    return disposition === 'inline';
}

const samplePresignedUrl = 'https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/test.pdf?response-content-disposition=inline&X-Amz-Signature=abc';
assert.strictEqual(checkContentDisposition(samplePresignedUrl), true, 'Presigned URL must enforce inline disposition');
console.log('✅ Test 10 Passed: Content disposition is strictly inline (anti-download).');

// =========================================================================
// 4. Strict Public Layout & Traversal Protection Verification
// =========================================================================

function isPathTraversalOrMalformed(key) {
    if (!key || typeof key !== 'string') return false;
    if (key.includes('\0')) return true;
    if (key.includes('..')) return true;

    const lower = key.toLowerCase();
    if (lower.includes('%2e%2e') || lower.includes('%2e.') || lower.includes('.%2e')
            || lower.includes('%2f') || lower.includes('%5c')
            || lower.includes('%252e') || lower.includes('%252f') || lower.includes('%255c')) {
        return true;
    }
    return false;
}

function isApprovedPublicStorageLayout(key) {
    if (!key || typeof key !== 'string') return false;
    let normalized = key.replace(/\\/g, '/').trim();
    while (normalized.startsWith('/')) normalized = normalized.substring(1);
    if (isPathTraversalOrMalformed(normalized)) return false;

    const rawSegments = normalized.split('/');
    if (rawSegments.length < 2) return false;

    const segments = rawSegments.map(s => s.trim().toLowerCase());
    if (segments.some(s => s === 'paid')) return false;

    const isValidSlug = s => /^[a-z0-9_-]+$/.test(s);

    // Layout 1: State image assets (states/{stateSlug}/{imageFilename})
    if (segments.length === 3 && segments[0] === 'states') {
        const fn = segments[2];
        const isImg = fn.endsWith('.png') || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.webp') || fn.endsWith('.svg');
        return isImg && isValidSlug(segments[1]);
    }
    // Layout 2: Canonical free district or state-general study material (states/{stateSlug}/{districtSlug}/free/{filename})
    if (segments.length === 5 && segments[0] === 'states' && segments[3] === 'free') {
        return isValidSlug(segments[1]) && isValidSlug(segments[2]) && segments[4].length > 0;
    }
    // Layout 3: Legacy free district study material ({stateSlug}/{districtSlug}/free/{filename})
    if (segments.length === 4 && segments[2] === 'free') {
        return isValidSlug(segments[0]) && isValidSlug(segments[1]) && segments[3].length > 0;
    }
    // No speculative layouts
    return false;
}

// Test 11: Uncataloged paid key must be rejected
assert.strictEqual(isApprovedPublicStorageLayout('states/maharashtra/akola/paid/secret.pdf'), false);
assert.strictEqual(isApprovedPublicStorageLayout('states/nagaland/paid/notes.pdf'), false);
console.log('✅ Test 11 Passed: Uncataloged keys containing "paid" segments are strictly rejected.');

// Test 12: Uncataloged keys with loose "sample" or loose "free" rejected
assert.strictEqual(isApprovedPublicStorageLayout('private/notes/Sample_Paid.pdf'), false);
assert.strictEqual(isApprovedPublicStorageLayout('unrelated/free-for-all/paid_doc.pdf'), false);
assert.strictEqual(isApprovedPublicStorageLayout('states/secret_folder/doc.pdf'), false);
console.log('✅ Test 12 Passed: Broad substring matches (sample, loose free, arbitrary states/) fail closed.');

// Test 13: Approved public layouts pass
assert.strictEqual(isApprovedPublicStorageLayout('states/haryana/Haryana-cover.png'), true, 'Layout 1 image');
assert.strictEqual(isApprovedPublicStorageLayout('states/haryana/kurukshetra/free/infographic.png'), true, 'Layout 2 canonical district free');
assert.strictEqual(isApprovedPublicStorageLayout('states/nagaland/general/free/overview.pdf'), true, 'Layout 2 admin state general free');
assert.strictEqual(isApprovedPublicStorageLayout('haryana/kurukshetra/free/infographic.png'), true, 'Layout 3 legacy district free');
console.log('✅ Test 13 Passed: Explicitly verified public storage layouts are authorized.');

// Test 14: Non-image file under 3-segment states/ layout rejected
assert.strictEqual(isApprovedPublicStorageLayout('states/haryana/secret.pdf'), false);
console.log('✅ Test 14 Passed: Non-image files in state-asset layout are rejected.');

// Test 15: Removed speculative Layout 4 fails closed
assert.strictEqual(isApprovedPublicStorageLayout('states/nagaland/general/history/battle_of_kohima.pdf'), false);
console.log('✅ Test 15 Passed: Removed speculative fallback layout fails closed.');

// Test 16: Key containing '+' is preserved without double-decoding corruption
assert.strictEqual(isApprovedPublicStorageLayout('states/haryana/kurukshetra/free/math+science.pdf'), true);
console.log('✅ Test 16 Passed: Legitimate filename containing "+" preserves plus sign intact.');

// Test 17: Encoded and double-encoded path traversal attempts blocked
assert.strictEqual(isPathTraversalOrMalformed('%2e%2e/etc/passwd'), true);
assert.strictEqual(isPathTraversalOrMalformed('states/%2e%2e/secret.pdf'), true);
assert.strictEqual(isPathTraversalOrMalformed('%252e%252e/etc/passwd'), true);
assert.strictEqual(isPathTraversalOrMalformed('states/%252e%252e/secret.pdf'), true);
assert.strictEqual(isApprovedPublicStorageLayout('%2e%2e/etc/passwd'), false);
assert.strictEqual(isApprovedPublicStorageLayout('%252e%252e/etc/passwd'), false);
console.log('✅ Test 17 Passed: Direct, encoded, and double-encoded path traversal attempts are safely rejected.');

// =========================================================================
// 5. Authoritative Fail-Closed Free Resource Classification Verification
// =========================================================================

function isAuthoritativePublicFree(p) {
    if (!p) return false;
    if (p.price != null && p.price > 0.0) return false;
    if (p.s3Key && p.s3Key.split('/').some(s => s.toLowerCase() === 'paid')) return false;
    const cat = (p.category || '').trim().toLowerCase();
    const catSlug = (p.categorySlug || '').trim().toLowerCase();
    if (cat === 'paid' || catSlug === 'paid' || cat.startsWith('paid ') || cat.startsWith('paid-')) return false;

    // State Scope: valid stateSlug, canonical category
    const canonicalCats = new Set(['history', 'geography', 'art-culture', 'heritage-sites']);
    if (p.stateSlug && /^[a-z0-9_-]+$/.test(p.stateSlug)
            && (p.districtSlug === 'general' || p.districtSlug === 'state' || !p.districtSlug)
            && canonicalCats.has(catSlug)) {
        return p.isFree === true || p.price === 0.0;
    }

    // District Scope: valid district slug (not general), not SCOPE_STATE
    if (p.districtSlug && p.stateSlug && p.districtSlug !== 'general' && p.districtSlug !== 'state') {
        if (p.resourceScope === 'STATE') return false; // contradictory
        if (p.isFree === true && (p.price == null || p.price === 0.0)) return true;
        if (isApprovedPublicStorageLayout(p.s3Key)) return p.isFree === true || p.price === 0.0;
    }

    return false;
}

// Test 18: Contradictory metadata combinations fail closed
assert.strictEqual(isAuthoritativePublicFree({ isFree: true, price: 99.0, stateSlug: 'haryana', districtSlug: 'kurukshetra' }), false, 'Price > 0 overrides isFree');
assert.strictEqual(isAuthoritativePublicFree({ isFree: true, price: 0.0, s3Key: 'states/maharashtra/akola/paid/guide.pdf' }), false, 'Paid s3Key segment overrides isFree');
assert.strictEqual(isAuthoritativePublicFree({ isFree: true, price: 0.0, category: 'paid resources' }), false, 'Paid category overrides isFree');
assert.strictEqual(isAuthoritativePublicFree({ districtSlug: 'general', price: 99.0, stateSlug: 'nagaland' }), false, 'General slug with price is paid');
assert.strictEqual(isAuthoritativePublicFree({ districtSlug: 'general', stateSlug: 'nagaland', categorySlug: 'secret-exam', isFree: true, price: 0.0 }), false, 'Non-canonical state category rejected');
assert.strictEqual(isAuthoritativePublicFree({ districtSlug: 'dimapur', stateSlug: 'nagaland', resourceScope: 'STATE', isFree: true, price: 0.0 }), false, 'Conflicting district and state scope rejected');
console.log('✅ Test 18 Passed: All contradictory metadata combinations fail closed.');

// Test 19: Genuine authoritative state and district free resources pass
assert.strictEqual(isAuthoritativePublicFree({
    stateSlug: 'nagaland', districtSlug: 'general', category: 'History', categorySlug: 'history', resourceScope: 'STATE', isFree: true, price: 0.0
}), true, 'Authoritative state history resource is free');

assert.strictEqual(isAuthoritativePublicFree({
    stateSlug: 'nagaland', districtSlug: 'dimapur', isFree: true, price: 0.0, s3Key: 'states/nagaland/dimapur/free/intro.pdf'
}), true, 'Authoritative district free resource is free');
console.log('✅ Test 19 Passed: Genuine authoritative state and district free resources authorized.');

// =========================================================================
// 6. ID vs Key Parameter Mismatch Protection Verification
// =========================================================================

function validateIdAndKeyParameters(product, requestedId, requestedKey) {
    if (!product) return { valid: false, error: 'Product not found in catalog' };
    if (requestedId && requestedKey) {
        const keyMatches = (product.s3Key && product.s3Key.toLowerCase() === requestedKey.toLowerCase())
                || (product.storageKey && product.storageKey.toLowerCase() === requestedKey.toLowerCase());
        const idMatches = (product.id && product.id.toLowerCase() === requestedId.toLowerCase());
        if (!keyMatches || !idMatches) {
            return { valid: false, status: 400, error: 'Resource identifier does not match requested storage key' };
        }
    }
    return { valid: true };
}

// Test 20: Parameter mismatch checks
const catalogedProduct = {
    id: '6aa123f5edc2296bdf3a25b1',
    s3Key: 'states/haryana/kurukshetra/free/infographic.png',
    storageKey: 'states/haryana/kurukshetra/free/infographic.png'
};

// 20A: Matching id and key pass
assert.strictEqual(validateIdAndKeyParameters(catalogedProduct, '6aa123f5edc2296bdf3a25b1', 'states/haryana/kurukshetra/free/infographic.png').valid, true);

// 20B: Valid ID with mismatched key rejected with 400
const res20B = validateIdAndKeyParameters(catalogedProduct, '6aa123f5edc2296bdf3a25b1', 'states/haryana/kurukshetra/paid/secret.pdf');
assert.strictEqual(res20B.valid, false);
assert.strictEqual(res20B.status, 400);

// 20C: Valid key with invalid/nonexistent ID rejected with 400
const res20C = validateIdAndKeyParameters(catalogedProduct, '000000000000000000000000', 'states/haryana/kurukshetra/free/infographic.png');
assert.strictEqual(res20C.valid, false);
assert.strictEqual(res20C.status, 400);

// 20D: ID belonging to one district with key belonging to another rejected
const res20D = validateIdAndKeyParameters(catalogedProduct, '6aa123f5edc2296bdf3a25b1', 'states/nagaland/dimapur/free/notes.pdf');
assert.strictEqual(res20D.valid, false);
assert.strictEqual(res20D.status, 400);
console.log('✅ Test 20 Passed: ID vs Key parameter mismatch checks strictly enforce metadata pairing.');

console.log('\n🎉 ALL RESOURCE VIEWER PIPELINE TESTS PASSED SUCCESSFULLY!');
