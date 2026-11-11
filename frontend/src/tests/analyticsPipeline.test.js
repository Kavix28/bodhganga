import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..');

function readFrontend(relPath) {
    return fs.readFileSync(path.join(FRONTEND_ROOT, relPath), 'utf8');
}

function readBackend(relPath) {
    return fs.readFileSync(
        path.join(REPO_ROOT, 'backend', 'src', relPath),
        'utf8'
    );
}

console.log('Running analytics pipeline integrity checks...');

// 1. Frontend telemetry service & non-blocking fire-and-forget behavior
const analyticsServiceSrc = readFrontend('src/services/analyticsService.js');
assert.match(analyticsServiceSrc, /sessionStorage\.getItem\(['"]bg_visited['"]\)/, 'trackVisitOnce must check sessionStorage bg_visited');
assert.match(analyticsServiceSrc, /sessionStorage\.setItem\(['"]bg_visited['"],\s*['"]true['"]\)/, 'trackVisitOnce must set sessionStorage bg_visited');
assert.match(analyticsServiceSrc, /api\.post\(['"]\/analytics\/visit['"]\)/, 'trackVisitOnce must POST /analytics/visit');
assert.match(analyticsServiceSrc, /api\.post\(['"]\/analytics\/resource-view['"]/, 'trackResourceView must POST /analytics/resource-view');
assert.match(analyticsServiceSrc, /api\.get\(['"]\/analytics\/admin\/stats['"]\)/, 'getAnalyticsStats must GET /analytics/admin/stats');
assert.match(analyticsServiceSrc, /\.catch\(\(\)\s*=>\s*\{\}\)/, 'Telemetry requests must swallow errors non-blockingly');

// 2. App.jsx root session-deduplicated visit trigger
const appSrc = readFrontend('src/App.jsx');
assert.match(appSrc, /sessionStorage\.getItem\(['"]bg_visited['"]\)/, 'App.jsx must guard visit telemetry with sessionStorage');
assert.match(appSrc, /\/analytics\/visit/, 'App.jsx must call /analytics/visit');
assert.match(appSrc, /sessionStorage\.setItem\(['"]bg_visited['"],\s*['"]true['"]\)/, 'App.jsx must persist bg_visited in sessionStorage');

// 3. api.js 401 guard prevents analytics failures from logging out users
const apiSrc = readFrontend('src/services/api.js');
assert.match(apiSrc, /['"]\/analytics\/visit['"]/, 'api.js must treat /analytics/visit as non-session-invalidating');
assert.match(apiSrc, /['"]\/analytics\/resource-view['"]/, 'api.js must treat /analytics/resource-view as non-session-invalidating');

// 4. Resource viewer/card components fire trackResourceView without breaking viewer invariants
const resourceViewerModalSrc = readFrontend('src/components/common/ResourceViewerModal.jsx');
assert.match(resourceViewerModalSrc, /trackResourceView/, 'ResourceViewerModal.jsx must invoke trackResourceView');
assert.doesNotMatch(resourceViewerModalSrc, /localStorage\.setItem|sessionStorage\.setItem/, 'ResourceViewerModal.jsx must not persist URLs in storage');

for (const file of [
    'src/components/common/ResourceCard.jsx',
    'src/components/SecurePdfViewerModal.jsx',
    'src/components/content/NotesViewer.jsx',
]) {
    const src = readFrontend(file);
    assert.match(src, /trackResourceView/, `${file} must invoke trackResourceView`);
}

// 5. Admin Dashboard live counters, Indian number formatting, and polling interval
const dashboardSrc = readFrontend('src/pages/admin/Dashboard.jsx');
assert.match(dashboardSrc, /getAnalyticsStats/, 'Admin Dashboard must fetch getAnalyticsStats');
assert.match(dashboardSrc, /refetchInterval:\s*(30000|60000)/, 'Admin Dashboard must auto-poll analytics stats');
for (const label of [
    'Total Website Visits',
    'Active Signed-in Users',
    'Total Resource Views',
]) {
    assert.ok(dashboardSrc.includes(label), `Admin Dashboard must display "${label}"`);
}
assert.match(dashboardSrc, /\.toLocaleString\(['"]en-IN['"]\)/, 'Admin Dashboard must format counters with en-IN locale');

// 6. Backend atomic model, async service, REST controller, and security rules
const siteMetricSrc = readBackend('main/java/com/bodhganga/bodhganga/models/SiteMetric.java');
assert.match(siteMetricSrc, /@Document\(collection\s*=\s*"site_metrics"\)/, 'SiteMetric must target site_metrics collection');
assert.match(siteMetricSrc, /"global_metrics"/, 'SiteMetric must define global_metrics singleton id');

const siteMetricRepoSrc = readBackend('main/java/com/bodhganga/bodhganga/repositories/SiteMetricRepository.java');
assert.match(siteMetricRepoSrc, /MongoRepository<SiteMetric,\s*String>/, 'SiteMetricRepository must extend MongoRepository<SiteMetric, String>');

const analyticsServiceJavaSrc = readBackend('main/java/com/bodhganga/bodhganga/service/AnalyticsService.java');
assert.match(analyticsServiceJavaSrc, /@Async/, 'AnalyticsService write methods must be @Async');
assert.match(analyticsServiceJavaSrc, /findAndModify/, 'AnalyticsService must use atomic findAndModify');
assert.match(analyticsServiceJavaSrc, /incrementGlobalMetric\("totalVisits"\)/, 'AnalyticsService must increment totalVisits');
assert.match(analyticsServiceJavaSrc, /incrementGlobalMetric\("totalResourceViews"\)/, 'AnalyticsService must increment totalResourceViews');
assert.match(analyticsServiceJavaSrc, /\.inc\([^,]+,\s*1L\)/, 'AnalyticsService must atomically increment counter fields by 1L');
assert.match(analyticsServiceJavaSrc, /\.upsert\(true\)/, 'AnalyticsService must upsert the global_metrics singleton');
assert.match(analyticsServiceJavaSrc, /\.inc\("viewCount",\s*1L\)/, 'AnalyticsService must atomically increment resource viewCount');

const analyticsControllerSrc = readBackend('main/java/com/bodhganga/bodhganga/controllers/AnalyticsController.java');
assert.match(analyticsControllerSrc, /@RequestMapping\("\/api\/analytics"\)/, 'AnalyticsController must map /api/analytics');
assert.match(analyticsControllerSrc, /@PostMapping\("\/visit"\)/, 'AnalyticsController must expose POST /visit');
assert.match(analyticsControllerSrc, /@PostMapping\("\/resource-view"\)/, 'AnalyticsController must expose POST /resource-view');
assert.match(analyticsControllerSrc, /@GetMapping\("\/admin\/stats"\)/, 'AnalyticsController must expose GET /admin/stats');
assert.match(analyticsControllerSrc, /@PreAuthorize\("hasAuthority\('ROLE_ADMIN'\)"\)/, 'AnalyticsController admin endpoint must enforce ROLE_ADMIN');

const securityConfigSrc = readBackend('main/java/com/bodhganga/bodhganga/config/SecurityConfig.java');
assert.match(securityConfigSrc, /"\/api\/analytics\/visit"/, 'SecurityConfig must configure /api/analytics/visit');
assert.match(securityConfigSrc, /"\/api\/analytics\/resource-view"/, 'SecurityConfig must configure /api/analytics/resource-view');
assert.match(securityConfigSrc, /requestMatchers\("\/api\/analytics\/admin\/\*\*"\)\.hasAuthority\("ROLE_ADMIN"\)/, 'SecurityConfig must restrict /api/analytics/admin/** to ROLE_ADMIN');

console.log('✓ Analytics pipeline integrity checks passed');
