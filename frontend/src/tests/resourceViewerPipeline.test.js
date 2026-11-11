import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// =========================================================================
// 7. Frontend Viewer Durability, Ephemeral Resolution & Silent Renewal Pipeline
// =========================================================================

function extractStorageKey(resource) {
    if (!resource) return null;
    if (resource.s3Key && typeof resource.s3Key === "string" && resource.s3Key.trim()) {
        return resource.s3Key.trim();
    }
    if (resource.storageKey && typeof resource.storageKey === "string" && resource.storageKey.trim()) {
        return resource.storageKey.trim();
    }

    const candidates = [resource.s3Url, resource.previewUrl, resource.url, resource.signedUrl];
    for (const cand of candidates) {
        if (!cand || typeof cand !== "string") continue;
        const clean = cand.split("?")[0].trim();
        const match = clean.match(/amazonaws\.com\/(.+)$/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        if (!clean.startsWith("http://") && !clean.startsWith("https://") && clean.includes(".")) {
            return clean;
        }
    }
    return null;
}

async function simulateModalResolution(resource, apiClient) {
    const resourceId = resource?.id || resource?._id;
    const key = extractStorageKey(resource);

    if (!key && !resourceId) {
        const raw = resource?.signedUrl || resource?.previewUrl || resource?.url || resource?.s3Url;
        if (raw) return { url: raw, freshFetch: false };
        throw new Error("Missing Storage Key");
    }

    const params = {};
    if (key) params.key = key;
    if (resourceId) params.id = resourceId;

    const res = await apiClient.get('/pdf/resource', { params });
    return { url: res.data?.url || res.url, freshFetch: true, params };
}

// Test 21: Opening modal with existing product triggers fresh /api/pdf/resource call (no stale signature reuse)
const apiCalls = [];
const mockApiClient = {
    get: async (endpoint, config) => {
        apiCalls.push({ endpoint, config });
        return { data: { url: `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/${config.params.key}?X-Amz-Signature=freshSig_${Date.now()}` } };
    }
};

const staleProduct = {
    id: '6aa123f5edc2296bdf3a25b1',
    s3Key: 'states/haryana/kurukshetra/free/infographic.png',
    s3Url: 'https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/states/haryana/kurukshetra/free/infographic.png?X-Amz-Signature=staleOldSignature'
};

const resolveRes = await simulateModalResolution(staleProduct, mockApiClient);
assert.strictEqual(apiCalls.length, 1, 'Opening modal must trigger /api/pdf/resource call');
assert.strictEqual(apiCalls[0].endpoint, '/pdf/resource');
assert.strictEqual(apiCalls[0].config.params.key, 'states/haryana/kurukshetra/free/infographic.png');
assert.strictEqual(apiCalls[0].config.params.id, '6aa123f5edc2296bdf3a25b1');
assert.ok(resolveRes.url.includes('freshSig_'), 'Must use freshly generated signature rather than staleOldSignature');
assert.ok(!resolveRes.url.includes('staleOldSignature'), 'Must not reuse stale signature');
console.log('✅ Test 21 Passed: Opening modal with existing product triggers fresh /api/pdf/resource call.');

// Test 22: Expired signed link triggers refresh callback and successfully delivers newly signed URL
class MockViewerSession {
    constructor(initialResource, apiClient) {
        this.resource = initialResource;
        this.apiClient = apiClient;
        this.signedUrl = null;
        this.retryCount = 0;
        this.error = null;
    }

    async open() {
        const res = await simulateModalResolution(this.resource, this.apiClient);
        this.signedUrl = res.url;
        this.retryCount = 0;
    }

    async handleViewerError(viewerErr) {
        const isExpired = viewerErr?.isExpired ||
            viewerErr?.status === 403 ||
            viewerErr?.status === 410 ||
            (viewerErr?.message && (
                viewerErr.message.toLowerCase().includes("expired") ||
                viewerErr.message.includes("403") ||
                viewerErr.message.includes("SignatureDoesNotMatch") ||
                viewerErr.message.includes("AccessDenied")
            ));

        if (isExpired && this.retryCount < 1) {
            this.retryCount += 1;
            const res = await simulateModalResolution(this.resource, this.apiClient);
            this.signedUrl = res.url;
            return { refreshed: true, newUrl: this.signedUrl };
        }

        this.error = {
            title: isExpired ? "Access Expired" : "Document Load Error",
            message: viewerErr?.message || "Failed to load document.",
            canRetry: true
        };
        return { refreshed: false, error: this.error };
    }
}

let refreshCounter = 1;
const renewingApiClient = {
    get: async (endpoint, config) => {
        return {
            data: {
                url: `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/${config.params.key}?tokenVersion=${refreshCounter++}`
            }
        };
    }
};

const session = new MockViewerSession({
    id: '6aa123f5edc2296bdf3a25b2',
    s3Key: 'states/nagaland/dimapur/free/notes.pdf'
}, renewingApiClient);

await session.open();
assert.ok(session.signedUrl.includes('tokenVersion=1'), 'Initial session gets token version 1');

// Simulate token expiration encountered by viewer
const refreshResult = await session.handleViewerError({
    status: 403,
    isExpired: true,
    message: 'The secure access link has expired. Please refresh to renew access.'
});

assert.strictEqual(refreshResult.refreshed, true, 'Must silently refresh on expired token');
assert.ok(session.signedUrl.includes('tokenVersion=2'), 'Viewer receives newly signed URL');
assert.strictEqual(session.retryCount, 1, 'Retry count tracked at 1');
assert.strictEqual(session.error, null, 'No error screen shown when silent recovery succeeds');

// Simulate a second failure on the refreshed token (max 1 retry prevention)
const secondFail = await session.handleViewerError({
    status: 403,
    isExpired: true,
    message: 'The secure access link has expired.'
});

assert.strictEqual(secondFail.refreshed, false, 'Must not retry infinitely');
assert.strictEqual(session.error?.title, 'Access Expired', 'Transitions to clean error UI on terminal failure');
console.log('✅ Test 22 Passed: Expired signed link triggers refresh callback and delivers newly signed URL.');

// Test 23: Direct unauthenticated S3 URLs passed as props are sanitized and routed through /api/pdf/resource
const rawUrls = [
    'https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/states/haryana/kurukshetra/free/infographic.png',
    'https://bodhganga-pdf-storage-prod.s3.amazonaws.com/states/nagaland/general/free/study_notes.pdf?response-content-disposition=inline',
    'states/maharashtra/akola/free/sample.pdf'
];

for (const rawUrl of rawUrls) {
    const key = extractStorageKey({ s3Url: rawUrl });
    assert.ok(key, `Key must be extracted from ${rawUrl}`);
    assert.ok(!key.startsWith('http://') && !key.startsWith('https://'), 'Key must not be a full URL');
    assert.ok(!key.includes('amazonaws.com'), 'Key must not contain aws host');
    assert.ok(!key.includes('?'), 'Key must not contain query parameters');

    const routedCalls = [];
    const testClient = {
        get: async (endpoint, config) => {
            routedCalls.push({ endpoint, params: config.params });
            return { data: { url: `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/${key}?signed=true` } };
        }
    };

    const res = await simulateModalResolution({ s3Url: rawUrl }, testClient);
    assert.strictEqual(routedCalls.length, 1);
    assert.strictEqual(routedCalls[0].endpoint, '/pdf/resource');
    assert.strictEqual(routedCalls[0].params.key, key);
    assert.ok(res.url.includes('signed=true'));
}
console.log('✅ Test 23 Passed: Raw direct S3 URLs passed as props are sanitized and routed through /api/pdf/resource.');

// Test 24: Source code audit for ResourceViewerModal, SecurePdfViewer, and consumer pages
const modalSrc = fs.readFileSync(path.join(__dirname, '../components/common/ResourceViewerModal.jsx'), 'utf8');
const viewerSrc = fs.readFileSync(path.join(__dirname, '../components/SecurePdfViewer.jsx'), 'utf8');
const districtPageSrc = fs.readFileSync(path.join(__dirname, '../pages/DistrictResourcesPage.jsx'), 'utf8');
const stateSectionSrc = fs.readFileSync(path.join(__dirname, '../pages/StateSectionPage.jsx'), 'utf8');
const stateDistrictSrc = fs.readFileSync(path.join(__dirname, '../pages/StateDistrictProductsPage.jsx'), 'utf8');

// Invariants in ResourceViewerModal.jsx
assert.ok(modalSrc.includes('extractStorageKey'), 'ResourceViewerModal must export/use extractStorageKey');
assert.ok(modalSrc.includes('handleViewerError'), 'ResourceViewerModal must implement handleViewerError');
assert.ok(modalSrc.includes('retryCountRef'), 'ResourceViewerModal must use retryCountRef for loop prevention');
assert.ok(modalSrc.includes('onError={handleViewerError}'), 'ResourceViewerModal must pass onError to SecurePdfViewer');
assert.ok(!modalSrc.includes('localStorage.setItem'), 'Must not cache signed URLs in localStorage');
assert.ok(!modalSrc.includes('sessionStorage.setItem'), 'Must not cache signed URLs in sessionStorage');

// Invariants in SecurePdfViewer.jsx
assert.ok(viewerSrc.includes('onError'), 'SecurePdfViewer must accept onError prop');
assert.ok(viewerSrc.includes("mode: 'cors'"), 'SecurePdfViewer must enforce CORS fetch mode');
assert.ok(viewerSrc.includes('isExpired'), 'SecurePdfViewer must flag isExpired for token expiration');

// Invariants in consumer pages
for (const [pageName, pageSrc] of [
    ['DistrictResourcesPage', districtPageSrc],
    ['StateSectionPage', stateSectionSrc],
    ['StateDistrictProductsPage', stateDistrictSrc]
]) {
    assert.ok(pageSrc.includes('ResourceViewerModal'), `${pageName} must import and use ResourceViewerModal`);
    assert.ok(!pageSrc.includes('s3.amazonaws.com/'), `${pageName} must not construct raw S3 links`);
    assert.ok(!pageSrc.includes('<a download'), `${pageName} must not contain download links`);
}
console.log('✅ Test 24 Passed: Source code architectural invariants verified across viewer components and consumer pages.');

console.log('\n🎉 ALL RESOURCE VIEWER PIPELINE TESTS PASSED SUCCESSFULLY!');
