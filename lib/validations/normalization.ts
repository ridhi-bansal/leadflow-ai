import { Currency, ServiceType } from '@/types/lead';

export const VALID_SERVICES: ServiceType[] = [
  'Website Development',
  'Branding & Design',
  'Social Media',
  'Digital Advertising',
  'Other',
];

export const VALID_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export const STANDARD_TIMELINES = [
  'ASAP',
  'Within 1 week',
  'Within 1 month',
  '1–3 months',
  'Flexible',
  'Not decided',
] as const;

/**
 * Deterministically normalizes any arbitrary service description into the 5 core agency taxonomy services.
 */
export function normalizeService(rawService?: string | null): ServiceType {
  if (!rawService || typeof rawService !== 'string') return 'Other';

  const trimmed = rawService.trim();
  // Exact match first
  if (VALID_SERVICES.includes(trimmed as ServiceType)) {
    return trimmed as ServiceType;
  }

  const s = trimmed.toLowerCase();

  // Website Development signals
  if (
    s.includes('web') ||
    s.includes('site') ||
    s.includes('ecommerce') ||
    s.includes('e-commerce') ||
    s.includes('shopify') ||
    s.includes('app') ||
    s.includes('portal') ||
    s.includes('landing page') ||
    s.includes('cms') ||
    s.includes('frontend') ||
    s.includes('fullstack') ||
    s.includes('software') ||
    s.includes('saas') ||
    s.includes('store')
  ) {
    return 'Website Development';
  }

  // Branding & Design signals
  if (
    s.includes('brand') ||
    s.includes('design') ||
    s.includes('logo') ||
    s.includes('identity') ||
    s.includes('visual') ||
    s.includes('graphic') ||
    s.includes('ui/ux') ||
    s.includes('typography') ||
    s.includes('packaging') ||
    s.includes('rebrand')
  ) {
    return 'Branding & Design';
  }

  // Social Media signals
  if (
    s.includes('social') ||
    s.includes('instagram') ||
    s.includes('tiktok') ||
    s.includes('content creation') ||
    s.includes('community') ||
    s.includes('influencer') ||
    s.includes('linkedin')
  ) {
    return 'Social Media';
  }

  // Digital Advertising signals
  if (
    s.includes('ad') ||
    s.includes('ppc') ||
    s.includes('marketing') ||
    s.includes('seo') ||
    s.includes('google ads') ||
    s.includes('meta ads') ||
    s.includes('sem') ||
    s.includes('campaign') ||
    s.includes('media buying')
  ) {
    return 'Digital Advertising';
  }

  return 'Other';
}

/**
 * Deterministically normalizes currency symbols and codes to supported Currency types.
 */
export function normalizeCurrency(rawCurrency?: string | null): Currency {
  if (!rawCurrency || typeof rawCurrency !== 'string') return 'USD';

  const c = rawCurrency.trim().toUpperCase();
  if (c === 'EUR' || c === '€' || c.includes('EURO')) return 'EUR';
  if (c === 'GBP' || c === '£' || c.includes('POUND')) return 'GBP';
  if (c === 'CAD' || c === 'C$' || c === 'CAD$' || c.includes('CANADIAN')) return 'CAD';
  if (c === 'AUD' || c === 'A$' || c === 'AUD$' || c.includes('AUSTRALIAN')) return 'AUD';
  if (c === 'USD' || c === '$' || c === 'US$' || c.includes('DOLLAR')) return 'USD';

  return 'USD';
}

/**
 * Normalizes timeline string representations, fixing hyphens/formatting while preserving specific dates.
 */
export function normalizeTimeline(rawTimeline?: string | null): string | null {
  if (!rawTimeline || typeof rawTimeline !== 'string') return null;

  const t = rawTimeline.trim();
  if (!t) return null;

  const lower = t.toLowerCase();

  // Normalize common variations of standard categories
  if (lower === 'asap' || lower === 'immediately' || lower === 'as soon as possible' || lower === 'urgent') {
    return 'ASAP';
  }
  if (lower.includes('1 week') || lower.includes('one week')) {
    return 'Within 1 week';
  }
  if (lower.includes('1 month') || lower.includes('one month') || lower.includes('4 weeks')) {
    return 'Within 1 month';
  }
  if (
    lower.includes('1-3 months') ||
    lower.includes('1–3 months') ||
    lower.includes('1 to 3 months') ||
    lower.includes('three months') ||
    lower.includes('3 months') ||
    lower.includes('2-3 months') ||
    lower.includes('2–3 months')
  ) {
    return '1–3 months';
  }
  if (lower.includes('flexible') || lower.includes('no rush') || lower.includes('open')) {
    return 'Flexible';
  }
  if (lower.includes('not decided') || lower.includes('tbd') || lower.includes('undecided') || lower === 'unknown') {
    return 'Not decided';
  }

  // Preserve specific dates or natural phrases (e.g. "November 15", "Before holiday season")
  return t;
}
