/**
 * ECOSPHERE Centralized Image Fallback System
 * 
 * Provides deterministic, category-specific high-resolution visual imagery
 * for all entities when API image URLs are missing, null, or invalid.
 * Follows the 4-tier hierarchy:
 * 1. Real API image
 * 2. Existing local asset (if applicable)
 * 3. Category-specific deterministic fallback
 * 4. Generic ECOSPHERE visual fallback
 */

// Category-specific product fallback images
const PRODUCT_CATEGORY_MAP: Record<string, string[]> = {
  grocery: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=600&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=600&q=80',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  ],
  tools: [
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',
  ],
  hardware: [
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',
  ],
  automotive: [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
  ],
  automobile: [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
  ],
  home: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
  ],
  books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
  ],
  agriculture: [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
  ],
};

const GENERIC_PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

// Service category fallbacks
const SERVICE_CATEGORY_MAP: Record<string, string[]> = {
  cleaning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  ],
  electrical: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  ],
  plumbing: [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  ],
  repair: [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
  ],
  technology: [
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
  ],
  transport: [
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80',
  ],
  education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
  ],
};

const GENERIC_SERVICE_FALLBACK = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

// Business covers & logos
const BUSINESS_COVERS: Record<string, string> = {
  grocery: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
  technology: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
  education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
  wholesale: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
  retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80',
  default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80',
};

const BUSINESS_LOGOS: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=400&q=80',
};

// Job fallbacks
const JOB_FALLBACKS: Record<string, string> = {
  delivery: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=400&q=80',
  tech: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80',
  engineering: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
  operations: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
  sales: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80',
  default: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
};

// Social & Community fallbacks
const COMMUNITY_FALLBACKS: Record<string, string> = {
  announcement: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  business: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  opportunity: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
};

// Profile avatars
const AVATAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
];

/**
 * Deterministic hash function for consistent image selection per entity ID
 */
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

import { resolveImageUrl } from '../services/apiConfig';
import {
  resolveProductImage,
  getResolvedProductUri,
  auditProductImages,
  LOCAL_PRODUCT_ASSETS,
  PRODUCT_CDN_URLS,
  ProductInput,
  ResolvedProductImage,
} from './productImageResolver';

export {
  resolveProductImage,
  getResolvedProductUri,
  auditProductImages,
  LOCAL_PRODUCT_ASSETS,
  PRODUCT_CDN_URLS,
  ProductInput,
  ResolvedProductImage,
};

/**
 * Resolve product image URL with deterministic fallback
 */
export function getProductImageUrl(
  providedUrl?: string | null,
  category?: string,
  id?: string,
  title?: string
): string {
  return getResolvedProductUri({
    imageUrl: providedUrl,
    category,
    id,
    title,
  });
}

/**
 * Resolve business logo and cover URLs
 */
export function getBusinessImages(
  logoUrl?: string | null,
  coverUrl?: string | null,
  category?: string,
  id?: string
): { logo: string; cover: string } {
  const resolvedLogo = resolveImageUrl(logoUrl);
  const resolvedCover = resolveImageUrl(coverUrl);
  let finalLogo = resolvedLogo && resolvedLogo.startsWith('http') ? resolvedLogo : '';
  let finalCover = resolvedCover && resolvedCover.startsWith('http') ? resolvedCover : '';

  const catKey = (category || '').toLowerCase();
  let coverFallback = BUSINESS_COVERS.default;
  for (const key of Object.keys(BUSINESS_COVERS)) {
    if (catKey.includes(key)) {
      coverFallback = BUSINESS_COVERS[key];
      break;
    }
  }

  if (!finalCover) finalCover = coverFallback;
  if (!finalLogo) finalLogo = BUSINESS_LOGOS.default;

  return { logo: finalLogo, cover: finalCover };
}

/**
 * Resolve service image URL
 */
export function getServiceImageUrl(
  providedUrl?: string | null,
  category?: string,
  id?: string
): string {
  if (providedUrl && typeof providedUrl === 'string' && providedUrl.startsWith('http')) {
    return providedUrl;
  }

  const catKey = (category || '').toLowerCase();
  for (const key of Object.keys(SERVICE_CATEGORY_MAP)) {
    if (catKey.includes(key)) {
      const list = SERVICE_CATEGORY_MAP[key];
      const index = id ? getHash(id) % list.length : 0;
      return list[index];
    }
  }

  return GENERIC_SERVICE_FALLBACK;
}

/**
 * Resolve job employer logo or opportunity image
 */
export function getJobImageUrl(
  providedUrl?: string | null,
  category?: string,
  id?: string
): string {
  if (providedUrl && typeof providedUrl === 'string' && providedUrl.startsWith('http')) {
    return providedUrl;
  }

  const catKey = (category || '').toLowerCase();
  for (const key of Object.keys(JOB_FALLBACKS)) {
    if (catKey.includes(key)) {
      return JOB_FALLBACKS[key];
    }
  }

  return JOB_FALLBACKS.default;
}

/**
 * Resolve social/community post image
 */
export function getCommunityImageUrl(
  providedUrl?: string | null,
  postType?: string
): string | null {
  if (providedUrl && typeof providedUrl === 'string' && providedUrl.startsWith('http')) {
    return providedUrl;
  }
  return null; // For posts, if no image attached, return null so card doesn't show empty media
}

/**
 * Resolve profile avatar
 */
export function getProfileAvatarUrl(
  providedUrl?: string | null,
  userId?: string
): string {
  if (providedUrl && typeof providedUrl === 'string' && providedUrl.startsWith('http')) {
    return providedUrl;
  }

  const index = userId ? getHash(userId) % AVATAR_FALLBACKS.length : 0;
  return AVATAR_FALLBACKS[index];
}
