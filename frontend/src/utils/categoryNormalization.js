/**
 * Authoritative category and scope normalization utility for BodhGanga.
 * 
 * Strict Domain Model:
 * STATE LEVEL:
 *  - Art & Culture
 *  - History
 *  - Heritage & Sites
 *  - Geography
 * 
 * DISTRICT LEVEL:
 *  - Free
 *  - Paid
 */

export const STATE_RESOURCE_CATEGORIES = [
  'Art & Culture',
  'History',
  'Heritage & Sites',
  'Geography',
];

export const STATE_CATEGORY_SLUGS = [
  'art-culture',
  'history',
  'heritage-sites',
  'geography',
];

export const DISTRICT_RESOURCE_ACCESS_TIERS = ['Free', 'Paid'];

export const CANONICAL_STATE_CATEGORY_MAP = {
  // Art & Culture
  'art-culture': 'Art & Culture',
  'art-and-culture': 'Art & Culture',
  'art & culture': 'Art & Culture',
  'art and culture': 'Art & Culture',

  // History
  history: 'History',

  // Heritage & Sites
  'heritage-sites': 'Heritage & Sites',
  'heritage-monuments': 'Heritage & Sites',
  'heritage-sites-monuments': 'Heritage & Sites',
  monuments: 'Heritage & Sites',
  'heritage & sites': 'Heritage & Sites',
  'heritage and sites': 'Heritage & Sites',

  // Geography
  geography: 'Geography',
};

export const CANONICAL_STATE_SLUG_MAP = {
  'art-culture': 'art-culture',
  'art-and-culture': 'art-culture',
  'art & culture': 'art-culture',
  'art and culture': 'art-culture',

  history: 'history',

  'heritage-sites': 'heritage-sites',
  'heritage-monuments': 'heritage-sites',
  'heritage-sites-monuments': 'heritage-sites',
  monuments: 'heritage-sites',
  'heritage & sites': 'heritage-sites',
  'heritage and sites': 'heritage-sites',

  geography: 'geography',
};

/**
 * Normalizes any category string or slug to its authoritative canonical name.
 * Returns null if not a valid state category.
 */
export function normalizeStateCategory(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  return CANONICAL_STATE_CATEGORY_MAP[clean] || null;
}

/**
 * Normalizes any category string or slug to its authoritative canonical URL slug.
 * Returns null if not a valid state category.
 */
export function normalizeStateCategorySlug(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  return CANONICAL_STATE_SLUG_MAP[clean] || null;
}

export function isCanonicalStateCategory(input) {
  return normalizeStateCategory(input) !== null;
}

export function isCanonicalDistrictTier(input) {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim().toLowerCase();
  return clean === 'free' || clean === 'paid';
}
