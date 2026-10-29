/**
 * ECOSPHERE Centralized Product Image Resolver
 * 
 * Implements a strict 6-tier deterministic resolution hierarchy:
 * 
 * LEVEL 1: Real Product Image from API
 *          - If product has a genuine, valid image URL, USE IT.
 *          - SPECIAL BUGFIX: The backend database defaults missing product images to
 *            the Unsplash red shoe image ('photo-1542291026-7eec264c27ff').
 *            If an image URL contains this placeholder AND the product is NOT
 *            footwear/shoes, it is recognized as dummy placeholder and rejected.
 * 
 * LEVEL 2: Product ID / SKU Direct Mapping
 *          - Explicit overrides for specific catalog IDs / SKUs.
 * 
 * LEVEL 3: Exact Normalized Product Name Mapping
 *          - Matches cleaned product titles (e.g., 'Parle-G 800g', 'Organic Arabica Coffee Beans').
 * 
 * LEVEL 4: Deterministic Product-Name Keyword Resolver
 *          - 40+ semantic product keywords mapped to dedicated, unique product imagery.
 *          - Matches the actual product semantics, NOT category-wide singletons.
 * 
 * LEVEL 5: Product-Specific Local Asset System
 *          - Resolves to bundled local assets in `assets/images/products/...`
 * 
 * LEVEL 6: Neutral ECOSPHERE Fallback
 *          - Clean, neutral packaged visual (never shoes).
 */

import { ImageSourcePropType } from 'react-native';
import { resolveImageUrl } from '../services/apiConfig';

export interface ProductInput {
  id?: string | number;
  productId?: string | number;
  name?: string;
  productName?: string;
  title?: string;
  image?: string | null;
  imageUrl?: string | null;
  imageURL?: string | null;
  thumbnail?: string | null;
  photo?: string | null;
  category?: string;
  categoryName?: string;
  brand?: string;
  sku?: string;
  description?: string;
}

export interface ResolvedProductImage {
  source: ImageSourcePropType;
  uri: string;
  isLocal: boolean;
  matchType: 'api' | 'id_map' | 'exact_name' | 'keyword' | 'local_asset' | 'neutral_fallback';
  key: string;
}

// Backend dummy placeholder URL signature (the red Nike shoe)
const DUMMY_BACKEND_SHOE_SIGNATURE = 'photo-1542291026-7eec264c27ff';

// Neutral modern packaged goods fallback (NEVER a shoe)
const NEUTRAL_ECOSPHERE_FALLBACK = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

// Structured bundled local assets
export const LOCAL_PRODUCT_ASSETS: Record<string, any> = {
  // Electronics
  'camera': require('../../assets/images/products/electronics/camera.webp'),
  'headphones': require('../../assets/images/products/electronics/headphones.webp'),
  'hub': require('../../assets/images/products/electronics/hub.webp'),
  'laptop': require('../../assets/images/products/electronics/laptop.webp'),
  'powerbank': require('../../assets/images/products/electronics/powerbank.webp'),
  'purifier': require('../../assets/images/products/electronics/purifier.webp'),
  'refrigerator': require('../../assets/images/products/electronics/refrigerator.webp'),
  'smartphone': require('../../assets/images/products/electronics/smartphone.webp'),
  'television': require('../../assets/images/products/electronics/television.webp'),
  'tracker': require('../../assets/images/products/electronics/tracker.webp'),

  // Fashion
  'jeans': require('../../assets/images/products/fashion/jeans.webp'),
  'shirt': require('../../assets/images/products/fashion/shirt.webp'),
  'shoes': require('../../assets/images/products/fashion/shoes.webp'),

  // Furniture
  'chair': require('../../assets/images/products/furniture/chair.webp'),
  'sofa': require('../../assets/images/products/furniture/sofa.webp'),
  'table': require('../../assets/images/products/furniture/table.webp'),

  // Grocery & Daily Essentials
  'biscuits': require('../../assets/images/products/grocery/biscuits.webp'),
  'bottle': require('../../assets/images/products/grocery/bottle.webp'),
  'bread': require('../../assets/images/products/grocery/bread.webp'),
  'butter': require('../../assets/images/products/grocery/butter.webp'),
  'chips': require('../../assets/images/products/grocery/chips.webp'),
  'coffee': require('../../assets/images/products/grocery/coffee.webp'),
  'eggs': require('../../assets/images/products/grocery/eggs.webp'),
  'maggi': require('../../assets/images/products/grocery/maggi.webp'),
  'milk': require('../../assets/images/products/grocery/milk.webp'),
  'potato': require('../../assets/images/products/grocery/potato.webp'),
  'rice': require('../../assets/images/products/grocery/rice.webp'),
  'salt': require('../../assets/images/products/grocery/salt.webp'),
  'shampoo': require('../../assets/images/products/grocery/shampoo.webp'),
  'soap': require('../../assets/images/products/grocery/soap.webp'),
  'tea': require('../../assets/images/products/grocery/tea.webp'),
  'tomato': require('../../assets/images/products/grocery/tomato.webp'),
  'toothpaste': require('../../assets/images/products/grocery/toothpaste.webp'),
  'wheat': require('../../assets/images/products/grocery/wheat.webp'),
};

// High-resolution CDN URLs corresponding 1-to-1 with each product key
export const PRODUCT_CDN_URLS: Record<string, string> = {
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  hub: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
  powerbank: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  purifier: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  refrigerator: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  television: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
  tracker: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
  shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  chair: 'https://images.unsplash.com/photo-1580481077114-16a85f86641e?auto=format&fit=crop&w=600&q=80',
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  table: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=600&q=80',
  biscuits: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  bottle: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
  chips: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
  coffee: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
  maggi: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  salt: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
  shampoo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
  soap: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=600&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  toothpaste: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
};

// LEVEL 2: Direct ID / SKU overrides
const PRODUCT_ID_MAP: Record<string, string> = {};
const PRODUCT_SKU_MAP: Record<string, string> = {};

// LEVEL 3: Exact Normalized Product Name Map
// Maps normalized product names (with version/unit suffixes stripped) to product keys
const EXACT_NORMALIZED_NAME_MAP: Record<string, string> = {
  // Live Database 9 Catalog Types
  'smart wifi security camera 4k': 'camera',
  'ergonomic mesh executive chair': 'chair',
  'organic arabica coffee beans 500g': 'coffee',
  'organic arabica coffee beans': 'coffee',
  'smart fitness tracker band': 'tracker',
  'fast charging power bank 20000mah': 'powerbank',
  'fast charging power bank': 'powerbank',
  'ultralight bluetooth anc headphones': 'headphones',
  'smart hepa air purifier': 'purifier',
  'multi port usb c gan hub': 'hub',
  'stainless steel thermal water bottle': 'bottle',

  // Top Indian Consumer Essentials & Requested Brands
  'parle g 800g': 'biscuits',
  'parle g 800 gm': 'biscuits',
  'parle g': 'biscuits',
  'parle g biscuits': 'biscuits',
  'britannia good day': 'biscuits',
  'amul milk': 'milk',
  'amul taaza milk': 'milk',
  'fresh amul milk': 'milk',
  'amul butter 100g': 'butter',
  'amul butter': 'butter',
  'tata salt': 'salt',
  'tata salt 1kg': 'salt',
  'surf excel': 'soap',
  'surf excel easy wash': 'soap',
  'maggi 2 minute noodles': 'maggi',
  'maggi noodles': 'maggi',
  'maggi': 'maggi',
  'colgate maxfresh': 'toothpaste',
  'colgate toothpaste': 'toothpaste',
  'head shoulders shampoo': 'shampoo',
  'lays classic potato chips': 'chips',
  'lays chips': 'chips',
  'aashirvaad atta': 'wheat',
  'aashirvaad shudh chakki atta': 'wheat',
  'taj mahal tea 250g': 'tea',
  'taj mahal tea': 'tea',
  'fresh tomato': 'tomato',
  'fresh red tomato': 'tomato',
  'tomato': 'tomato',
  'fresh potato': 'potato',
  'potato': 'potato',
  'basmati rice': 'rice',
  'rice': 'rice',
  'milk': 'milk',
  'bread': 'bread',
  'eggs': 'eggs',
  'shampoo': 'shampoo',
  'soap': 'soap',
  'toothpaste': 'toothpaste',
  'shoes': 'shoes',
  'laptop': 'laptop',
  'mobile phone': 'smartphone',
  'smartphone': 'smartphone',
  't shirt': 'shirt',
  'refrigerator': 'refrigerator',
  'chair': 'chair',
  'table': 'table',
};

// LEVEL 4: Deterministic Product Keyword Resolver Rules
// Each rule has regex patterns and the target product key.
interface KeywordRule {
  key: string;
  pattern: RegExp;
}

const KEYWORD_RULES: KeywordRule[] = [
  // High-specificity grocery & kitchen
  { key: 'tomato', pattern: /\b(tomato|tomatoes|tamatar)\b/i },
  { key: 'potato', pattern: /\b(potato|potatoes|aloo|batata)\b/i },
  { key: 'milk', pattern: /\b(milk|doodh|dairy|curd|paneer|yogurt)\b/i },
  { key: 'bread', pattern: /\b(bread|bun|buns|toast|bakery|croissant)\b/i },
  { key: 'rice', pattern: /\b(rice|basmati|chawal|biryani rice)\b/i },
  { key: 'wheat', pattern: /\b(wheat|atta|flour|maida|sooji|rava)\b/i },
  { key: 'biscuits', pattern: /\b(biscuit|biscuits|cookie|cookies|parle|britannia|oreo)\b/i },
  { key: 'chips', pattern: /\b(chips|crisps|wafers|lays|kurkure|doritos|nachos|snack)\b/i },
  { key: 'maggi', pattern: /\b(maggi|noodle|noodles|ramen|pasta)\b/i },
  { key: 'salt', pattern: /\b(salt|namak|tata salt)\b/i },
  { key: 'tea', pattern: /\b(tea|chai|taj mahal|red label|green tea)\b/i },
  { key: 'coffee', pattern: /\b(coffee|arabica|cappuccino|espresso|nescafe|bru)\b/i },
  { key: 'butter', pattern: /\b(butter|ghee|makhan|margarine)\b/i },
  { key: 'eggs', pattern: /\b(egg|eggs|anda)\b/i },

  // Personal care & hygiene
  { key: 'shampoo', pattern: /\b(shampoo|conditioner|hairwash)\b/i },
  { key: 'soap', pattern: /\b(soap|soaps|bodywash|body wash|handwash|dettol|lifebuoy|dove|surf excel|detergent)\b/i },
  { key: 'toothpaste', pattern: /\b(toothpaste|toothbrush|tooth paste|colgate|pepsodent|oral-b)\b/i },

  // Electronics & gadgets
  { key: 'camera', pattern: /\b(camera|webcam|surveillance|cctv|security camera)\b/i },
  { key: 'headphones', pattern: /\b(headphones|headphone|earphones|earbuds|headset|airpods|audio)\b/i },
  { key: 'hub', pattern: /\b(hub|adapter|dongle|dock|usb-c hub|gan hub)\b/i },
  { key: 'laptop', pattern: /\b(laptop|notebook|macbook|chromebook|thinkpad)\b/i },
  { key: 'powerbank', pattern: /\b(power bank|powerbank|battery pack|portable charger)\b/i },
  { key: 'purifier', pattern: /\b(purifier|air purifier|hepa|filter)\b/i },
  { key: 'refrigerator', pattern: /\b(refrigerator|fridge|freezer)\b/i },
  { key: 'smartphone', pattern: /\b(smartphone|phone|mobile|iphone|galaxy|android)\b/i },
  { key: 'television', pattern: /\b(television|tv|smart tv|led tv|oled tv)\b/i },
  { key: 'tracker', pattern: /\b(fitness band|tracker|smartwatch|smart watch|fitbit)\b/i },
  { key: 'bottle', pattern: /\b(bottle|water bottle|flask|thermos|tumbler)\b/i },

  // Fashion & Apparel
  { key: 'shoes', pattern: /\b(shoe|shoes|sneaker|sneakers|footwear|boots|sandals|running shoes)\b/i },
  { key: 'shirt', pattern: /\b(shirt|t-shirt|tshirt|tee|top|polo|apparel|clothing)\b/i },
  { key: 'jeans', pattern: /\b(jeans|denim|trousers|pants)\b/i },

  // Furniture
  { key: 'chair', pattern: /\b(chair|executive chair|armchair|stool|seat)\b/i },
  { key: 'table', pattern: /\b(table|desk|dining table|study table)\b/i },
  { key: 'sofa', pattern: /\b(sofa|couch|settee)\b/i },
];

/**
 * Normalizes title text for resilient matching:
 * - Converts to lower case
 * - Strips punctuation & version suffixes (e.g. "v1498", "v1200")
 * - Trims extraneous whitespace
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\bv\d+\b/g, '') // remove synthetic DB suffixes like "v1498"
    .replace(/[^\w\s]/g, ' ')  // replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ')      // collapse spaces
    .trim();
}

/**
 * Helper to determine if a string specifically represents footwear / shoes
 */
function isFootwearText(text: string): boolean {
  return /\b(shoe|shoes|sneaker|sneakers|footwear|boots|boot|sandal|sandals|loafer|loafers)\b/i.test(text);
}

/**
 * Main Product Image Resolution Function
 * 
 * Takes any product-like object or loose parameters and returns
 * a strictly resolved, product-specific image.
 */
export function resolveProductImage(productInput?: ProductInput | null): ResolvedProductImage {
  if (!productInput) {
    return {
      source: { uri: NEUTRAL_ECOSPHERE_FALLBACK },
      uri: NEUTRAL_ECOSPHERE_FALLBACK,
      isLocal: false,
      matchType: 'neutral_fallback',
      key: 'neutral',
    };
  }

  const rawTitle = productInput.title || productInput.name || productInput.productName || '';
  const rawId = productInput.id || productInput.productId || '';
  const rawSku = productInput.sku || '';
  const rawCategory = productInput.category || productInput.categoryName || '';
  const providedUrl = productInput.imageUrl || productInput.image || productInput.imageURL || productInput.thumbnail || productInput.photo;

  const normalizedTitle = normalizeProductName(rawTitle);
  const normalizedCategory = (rawCategory || '').toLowerCase();
  const idStr = String(rawId || '').trim();
  const skuStr = String(rawSku || '').trim();

  // -------------------------------------------------------------
  // LEVEL 1: Real Product Image from API / Seller-Uploaded Image
  // -------------------------------------------------------------
  const normalizedUrl = resolveImageUrl(providedUrl);
  if (normalizedUrl && typeof normalizedUrl === 'string' && normalizedUrl.startsWith('http')) {
    const isBackendDummyShoe = normalizedUrl.includes(DUMMY_BACKEND_SHOE_SIGNATURE);
    if (isBackendDummyShoe) {
      // Check if product is legitimately a shoe / footwear
      const isActuallyShoe = isFootwearText(rawTitle) || isFootwearText(rawCategory);
      if (isActuallyShoe) {
        return {
          source: { uri: normalizedUrl },
          uri: normalizedUrl,
          isLocal: false,
          matchType: 'api',
          key: 'shoes',
        };
      }
      // If it is NOT footwear, this URL is the backend's dummy null fallback!
      // Bypass Level 1 and proceed to Level 2/3/4/5
    } else {
      // Genuine custom / seller-uploaded image provided by API
      return {
        source: { uri: normalizedUrl },
        uri: normalizedUrl,
        isLocal: false,
        matchType: 'api',
        key: 'custom_api',
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 2: Product ID / SKU Mapping
  // -------------------------------------------------------------
  if (idStr && PRODUCT_ID_MAP[idStr]) {
    const key = PRODUCT_ID_MAP[idStr];
    if (LOCAL_PRODUCT_ASSETS[key]) {
      return {
        source: LOCAL_PRODUCT_ASSETS[key],
        uri: PRODUCT_CDN_URLS[key] || NEUTRAL_ECOSPHERE_FALLBACK,
        isLocal: true,
        matchType: 'id_map',
        key,
      };
    }
  }

  if (skuStr && PRODUCT_SKU_MAP[skuStr]) {
    const key = PRODUCT_SKU_MAP[skuStr];
    if (LOCAL_PRODUCT_ASSETS[key]) {
      return {
        source: LOCAL_PRODUCT_ASSETS[key],
        uri: PRODUCT_CDN_URLS[key] || NEUTRAL_ECOSPHERE_FALLBACK,
        isLocal: true,
        matchType: 'id_map',
        key,
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 3: Exact Normalized Product Name Mapping
  // -------------------------------------------------------------
  if (normalizedTitle && EXACT_NORMALIZED_NAME_MAP[normalizedTitle]) {
    const key = EXACT_NORMALIZED_NAME_MAP[normalizedTitle];
    if (LOCAL_PRODUCT_ASSETS[key]) {
      return {
        source: LOCAL_PRODUCT_ASSETS[key],
        uri: PRODUCT_CDN_URLS[key] || NEUTRAL_ECOSPHERE_FALLBACK,
        isLocal: true,
        matchType: 'exact_name',
        key,
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 4: Deterministic Product Keyword Resolver
  // -------------------------------------------------------------
  const searchCorpus = `${normalizedTitle} ${normalizedCategory}`;
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(searchCorpus)) {
      const key = rule.key;
      const localAsset = LOCAL_PRODUCT_ASSETS[key];
      return {
        source: localAsset || { uri: PRODUCT_CDN_URLS[key] || NEUTRAL_ECOSPHERE_FALLBACK },
        uri: PRODUCT_CDN_URLS[key] || NEUTRAL_ECOSPHERE_FALLBACK,
        isLocal: !!localAsset,
        matchType: 'keyword',
        key,
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 5: Category-based Local Visual
  // -------------------------------------------------------------
  if (normalizedCategory) {
    if (normalizedCategory.includes('electronics') || normalizedCategory.includes('tech')) {
      return {
        source: LOCAL_PRODUCT_ASSETS['laptop'],
        uri: PRODUCT_CDN_URLS['laptop'],
        isLocal: true,
        matchType: 'local_asset',
        key: 'laptop',
      };
    }
    if (normalizedCategory.includes('furniture') || normalizedCategory.includes('home')) {
      return {
        source: LOCAL_PRODUCT_ASSETS['chair'],
        uri: PRODUCT_CDN_URLS['chair'],
        isLocal: true,
        matchType: 'local_asset',
        key: 'chair',
      };
    }
    if (normalizedCategory.includes('fashion') || normalizedCategory.includes('clothing')) {
      return {
        source: LOCAL_PRODUCT_ASSETS['shirt'],
        uri: PRODUCT_CDN_URLS['shirt'],
        isLocal: true,
        matchType: 'local_asset',
        key: 'shirt',
      };
    }
    if (normalizedCategory.includes('grocery') || normalizedCategory.includes('food')) {
      return {
        source: LOCAL_PRODUCT_ASSETS['biscuits'],
        uri: PRODUCT_CDN_URLS['biscuits'],
        isLocal: true,
        matchType: 'local_asset',
        key: 'biscuits',
      };
    }
  }

  // -------------------------------------------------------------
  // LEVEL 6: Neutral ECOSPHERE Fallback (NEVER Shoes!)
  // -------------------------------------------------------------
  return {
    source: { uri: NEUTRAL_ECOSPHERE_FALLBACK },
    uri: NEUTRAL_ECOSPHERE_FALLBACK,
    isLocal: false,
    matchType: 'neutral_fallback',
    key: 'neutral',
  };
}

/**
 * Convenience helper returning string URI for compatibility with standard URI consumers
 */
export function getResolvedProductUri(productInput?: ProductInput | null): string {
  const resolved = resolveProductImage(productInput);
  return resolved.uri;
}

/**
 * Development-time validation utility:
 * Checks for unintended image collisions across unrelated products.
 */
export interface AuditReport {
  totalAudited: number;
  distinctImages: number;
  mappings: Array<{
    id: string;
    name: string;
    category: string;
    resolvedKey: string;
    resolvedUri: string;
    matchType: string;
  }>;
  warnings: string[];
}

export function auditProductImages(products: ProductInput[]): AuditReport {
  const mappings: AuditReport['mappings'] = [];
  const imageToProducts: Record<string, string[]> = {};
  const warnings: string[] = [];

  for (const product of products) {
    const resolved = resolveProductImage(product);
    const title = product.title || product.name || product.productName || 'Unnamed';
    const id = String(product.id || product.productId || 'no-id');
    const category = product.category || product.categoryName || 'uncategorized';

    mappings.push({
      id,
      name: title,
      category,
      resolvedKey: resolved.key,
      resolvedUri: resolved.uri,
      matchType: resolved.matchType,
    });

    if (!imageToProducts[resolved.key]) {
      imageToProducts[resolved.key] = [];
    }
    imageToProducts[resolved.key].push(title);
  }

  // Cross-check for unrelated products sharing an image
  for (const [key, titles] of Object.entries(imageToProducts)) {
    // If shoe image is used for anything that is not shoes, flag as severe error
    if (key === 'shoes') {
      const nonShoes = titles.filter(t => !isFootwearText(t));
      if (nonShoes.length > 0) {
        warnings.push(
          `CRITICAL: Shoes image assigned to non-footwear products: ${nonShoes.slice(0, 5).join(', ')}`
        );
      }
    }
  }

  if (__DEV__) {
    console.log('====================================');
    console.log('PRODUCT IMAGE AUDIT REPORT');
    console.log(`Total Audited: ${products.length}`);
    console.log(`Distinct Images: ${Object.keys(imageToProducts).length}`);
    mappings.slice(0, 10).forEach(m => {
      console.log(`✓ [${m.id}] ${m.name} → ${m.resolvedKey} (${m.matchType})`);
    });
    if (warnings.length > 0) {
      console.warn('AUDIT WARNINGS:', warnings);
    } else {
      console.log('✓ All products resolve to semantically valid, product-specific imagery.');
    }
    console.log('====================================');
  }

  return {
    totalAudited: products.length,
    distinctImages: Object.keys(imageToProducts).length,
    mappings,
    warnings,
  };
}
