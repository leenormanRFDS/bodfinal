// Central site configuration — edit values here and they update everywhere.

export const SITE = {
  name: 'The Bombing of Darwin Experience',
  short: '1942',
  tagline: 'WW2 HAPPENED HERE',
  domain: 'thebombingofdarwin.com.au',
  description:
    'Stand on Stokes Hill Wharf and live the day the war reached Australia. An immersive VR, hologram and theatre experience of the 19 February 1942 Bombing of Darwin, with the Royal Flying Doctor Service.',
  // Our own booking skin lives here (reached via Book buttons only — not in the nav):
  bookPath: '/tickets',
  // The Rezdy hosted checkout the skin hands off to for secure payment.
  bookingUrl: 'https://rfdsdarwin1.rezdy.com',
};

// ---- Ticket packages: each is a booking pathway on /tickets ----
export interface TicketTier { code: string; label: string; price: number; note?: string; max?: number }
export interface TicketPackage {
  slug: string;
  name: string;
  image: string;         // card image in /public/images/tickets
  lead: { label: string; price: number }; // honest headline price, e.g. Adult $30
  includes: string[];    // the ✓ list — makes tiers compare naturally
  meta: { icon: 'clock' | 'family' | 'plane' | 'headset' | 'bus' | 'ticket'; label: string }[];
  checkoutUrl?: string;  // Fallback Rezdy checkout URL (dynamically updated from API)
  flag?: string;         // e.g. "Best value"
  glow?: boolean;        // the gold glowing panel
  tiers: TicketTier[];
}

export const PACKAGES: TicketPackage[] = [
  {
    slug: 'general-entry',
    name: 'General Entry',
    image: '/images/tickets/general-entry.webp',
    lead: { label: 'Family Pass', price: 90 },
    includes: ['Bombing of Darwin Experience', 'RFDS Museum & hologram cinema'],
    meta: [
      { icon: 'clock', label: '2 hours' },
      { icon: 'family', label: 'Great for families' },
      { icon: 'plane', label: 'Step aboard the PC-12' },
      { icon: 'headset', label: 'VR & holograms' },
    ],
    checkoutUrl: 'https://rfdsdarwin1.rezdy.com/433258/rfds-darwin-tourist-facility-general-entry',
    flag: 'Best value',
    glow: true,
    tiers: [
      { code: 'adult', label: 'Adult', price: 30, max: 20 },
      { code: 'child', label: 'Child', price: 18, note: 'Ages 5–15', max: 20 },
      { code: 'concession', label: 'Senior / Concession', price: 26, note: 'With proof', max: 20 },
      { code: 'family', label: 'Family', price: 90, note: '2 adults + 3 children', max: 10 },
    ],
  },
  {
    slug: 'aviation-combo',
    name: 'Aviation Combo',
    image: '/images/tickets/aviation-combo.webp',
    lead: { label: 'Adult', price: 47 },
    includes: ['Everything in General Entry', 'Second aviation attraction entry'],
    meta: [
      { icon: 'clock', label: 'Flexible · 1 day' },
      { icon: 'plane', label: "NT's aviation story" },
      { icon: 'ticket', label: 'One ticket, two venues' },
    ],
    checkoutUrl: 'https://rfdsdarwin1.rezdy.com/433269/aviation-attraction-combo-ticket',
    tiers: [
      { code: 'adult', label: 'Adult', price: 47, max: 20 },
      { code: 'senior', label: 'Senior', price: 38, note: 'With proof', max: 20 },
      { code: 'child', label: 'Child', price: 25, note: 'Ages 5–15', max: 20 },
      { code: 'family', label: 'Family of 5', price: 132, note: '2 adults + 3 children', max: 10 },
    ],
  },
  {
    slug: 'croc-n-history',
    name: 'Croc N History',
    image: '/images/tickets/croc-n-history.webp',
    lead: { label: 'Adult', price: 70 },
    includes: ['Everything in General Entry', 'Full-day entry to Crocosaurus Cove'],
    meta: [
      { icon: 'clock', label: '≈ 6 hours' },
      { icon: 'family', label: 'Two premier attractions' },
      { icon: 'ticket', label: 'Flexible entry, one ticket' },
    ],
    checkoutUrl: 'https://rfdsdarwin1.rezdy.com/433980/croc-n-history-ticket',
    tiers: [
      { code: 'adult', label: 'Adult', price: 70, max: 20 },
      { code: 'senior', label: 'Senior', price: 58, note: 'With proof', max: 20 },
      { code: 'child', label: 'Child', price: 44, note: 'Ages 4–15', max: 20 },
    ],
  },
  {
    slug: 'croc-explorer',
    name: 'Croc N History Explorer',
    image: '/images/tickets/croc-explorer.webp',
    lead: { label: 'Adult', price: 118 },
    includes: ['Everything in Croc N History', 'Darwin Explorer hop-on hop-off bus'],
    meta: [
      { icon: 'clock', label: '≈ 8 hours' },
      { icon: 'bus', label: 'See the whole city' },
      { icon: 'ticket', label: 'Three attractions, one ticket' },
    ],
    checkoutUrl: 'https://rfdsdarwin1.rezdy.com/435215/croc-n-history-explorer-ticket',
    flag: 'Best of Darwin',
    tiers: [
      { code: 'adult', label: 'Adult', price: 118, max: 20 },
      { code: 'senior', label: 'Senior', price: 100, note: 'With proof', max: 20 },
      { code: 'child', label: 'Child', price: 75, note: 'Ages 4–15', max: 20 },
    ],
  },
];

export const NAV: { label: string; href: string; key: string }[] = [
  { label: 'The Experience', href: '/experience', key: 'nav.experience' },
  { label: 'The Story', href: '/story', key: 'nav.story' },
  { label: 'Visit', href: '/visit', key: 'nav.visit' },
  { label: 'Programs', href: '/schools', key: 'nav.schools' },
  { label: 'Contact', href: '/contact', key: 'nav.contact' },
];

export const LOCALES: { code: string; label: string; name: string; tolgeeTag?: string }[] = [
  { code: 'en', label: 'EN', name: 'English', tolgeeTag: 'en' },
  { code: 'zh', label: '中文', name: '简体中文', tolgeeTag: 'zh' },
  { code: 'ja', label: '日本語', name: '日本語', tolgeeTag: 'ja' },
  { code: 'de', label: 'DE', name: 'Deutsch', tolgeeTag: 'de-DE' },
];

export const PRICES: { tier: string; price: number; note?: string }[] = [
  { tier: 'Adult', price: 30 },
  { tier: 'Child', price: 18 },
  { tier: 'Concession', price: 26 },
  { tier: 'Family', price: 90, note: '2 adults + 3 children' },
];

export const CONTACT = {
  address: '45 Stokes Hill Road, Stokes Hill Wharf, Darwin NT 0800',
  phone: '(08) 8983 5700',
  email: 'rfdsdarwin@flyingdoctor.net',
};

// Measurement & advertising tags — loaded by components/Analytics.astro, events sent via
// src/lib/tracking.ts. Tags only run on the production hostnames below, so previews,
// *.vercel.app and localhost never pollute GA4 or the Meta dataset.
export const ANALYTICS = {
  ga4MeasurementId: 'G-MQ9641V0NY',
  ga4PropertyId: '545435638', // GA4 admin reference only
  // Dedicated "Bombing of Darwin" Meta dataset (pixel). null = Meta not loaded.
  // Do not use the shared RFDS pixel 773978734609862: Meta has flagged it as serving
  // health-related sites, which restricts optimisation.
  metaPixelId: null as string | null,
  // Google Tag Manager container. null = GA4 loads directly (lighter). See SHIP_STATUS.
  gtmContainerId: null as string | null,
  productionHosts: ['thebombingofdarwin.com.au', 'www.thebombingofdarwin.com.au'],
};

// The opening cinematic (components/Opening.astro). Voices are dramatised re-creations.
// soundApproved: the owner confirmed the recorded voice lines against the logged record on
// 25 Oct 2026 (docs/SHIP_STATUS.md, "Opening"). While false, the sound gate is hidden everywhere;
// ?opening=sound previews the sound path and ?opening=silent forces the silent path.
export const OPENING = {
  soundApproved: true,
  audio: '/audio/bod-opening.m4a?v=088a3b26',
  videoWide: '/video/bod-paper-wide.mp4?v=91d565c3',
  videoPhone: '/video/bod-paper-phone.mp4?v=c29d4c11',
  poster: '/images/opening/paper-poster.webp?v=44cace07',
};
