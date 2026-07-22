# BodhGanga Academy — Backend Integration Notes for Gated State Tabs

This document serves as a brief guide for the backend development team to implement the REST endpoints for the individual state section tabs (History, Heritage, Geography, Art & Culture).

---

## 1. REST Endpoints Overview

The frontend expects 4 dedicated endpoints for the dynamic section tabs:

- **History**: `GET /api/states/{stateSlug}/history`
- **Heritage**: `GET /api/states/{stateSlug}/heritage-monuments`
- **Geography**: `GET /api/states/{stateSlug}/geography`
- **Art & Culture**: `GET /api/states/{stateSlug}/art-culture`

*Note: All 4 routes are gated and require a valid JWT header (`Authorization: Bearer <token>`) passed via the standard axios interceptor.*

---

## 2. Expected Response Schema / Payload

The placeholder component `StateSectionPage.jsx` is built to consume the payload with the following JSON structure:

```json
{
  "title": "Haryana History & Timeline",
  "htmlContent": "<p>Detailed HTML content mapping the historical phases of Haryana...</p>",
  "lastUpdated": "2026-07-02T00:00:00Z"
}
```

### Field Definitions:
- `title` *(String)*: Title of the specific section to render as the main header.
- `htmlContent` *(String)*: Rich HTML string containing note paragraphs, tables, or timeline structures. The frontend renders this safely via `dangerouslySetInnerHTML`.
- `lastUpdated` *(String / ISO Date)*: Optional timestamp showing when the notes were last updated.

---

## 3. React Query Caching & Key Convention

The frontend utilizes `@tanstack/react-query` to fetch and cache responses. Developers must align on the following query key pattern:

- **Key**: `['stateContent', stateSlug, section]`
- **Cache StaleTime**: 5 minutes (`5 * 60 * 1000`).

---

## 4. Gating & Active Checks
- **JWT Authorization**: These routes must reject unauthenticated requests with a `401 Unauthorized` response.
- **Active State Check**: Endpoints should only allow queries for states currently marked active ( Haryana, Himachal Pradesh, Jharkhand initially). If a state slug is queried that is not active, return a `403 Forbidden` or `404 Not Found`.

---

## 5. Frontend Integration Target
The API calls are managed in:
- Component: [StateSectionPage.jsx](file:///c:/Users/Srivi%20Pandey/Documents/OneDrive/Desktop/Bodhganga/bodhganga/frontend/src/pages/StateSectionPage.jsx#L45-L64)
- Network utility: `api` (from `../services/api`) which automatically attaches user JWT credentials to requests.
