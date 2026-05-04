/* ===================================================
   ROAD TRIP COST CALCULATOR — app.js
   Regions: US · UK · France · Portugal · China
   i18n: loaded from /lang/{code}.json at runtime
   =================================================== */

'use strict';

// ── Progressive background ────────────────────────
const PLACEHOLDER_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAFA3PEY8MlBGQUZaVVBfeMiCeG5uePWvuZHI////////////////////////////////////////////////////2wBDAVVaWnhpeOuCguv/////////////////////////////////////////////////////////////////////////wAARCAAbACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCRNqLz1prsSx54qJGk7L+lKQ5PTB+tTcCVpFVAR1NAdQPmyT6VGY3KgGmGOQdqBk/mAj5RRVUhgeQaKBEiFm6UpJBOXH0p8H+rFEwAXoKRWw1WLOORxU+cVHGoUDAxTz1oARiCKKjJ4ooEf//Z';

(function initBackground() {
  document.getElementById('bg-placeholder').style.backgroundImage =
    `url('data:image/jpeg;base64,${PLACEHOLDER_B64}')`;
  const img = new Image();
  img.onload = () => {
    const full = document.getElementById('bg-full');
    full.style.backgroundImage = `url('bg.jpg')`;
    full.classList.add('loaded');
  };
  img.src = 'bg.jpg';
})();

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const KM_PER_MILE  = 1.60934;
const L_PER_US_GAL = 3.78541;
const L_PER_UK_GAL = 4.54609;

// ── Fuel metrics ─────────────────────────────────
const METRICS = {
  mpg_us: {
    label: 'MPG (US)',
    distanceUnit: 'mi',
    volumeUnit: 'us_gal',
    higherBetter: true,
    toLitresPerKm:   mpg  => L_PER_US_GAL / (mpg * KM_PER_MILE),
    fromLitresPerKm: lkm  => L_PER_US_GAL / (lkm * KM_PER_MILE),
    defaultHwy: 32, defaultCity: 24,
  },
  mpg_uk: {
    label: 'MPG (UK)',
    distanceUnit: 'mi',
    volumeUnit: 'uk_gal',
    higherBetter: true,
    toLitresPerKm:   mpg  => L_PER_UK_GAL / (mpg * KM_PER_MILE),
    fromLitresPerKm: lkm  => L_PER_UK_GAL / (lkm * KM_PER_MILE),
    defaultHwy: 50, defaultCity: 38,
  },
  l100km: {
    label: 'L/100km',
    distanceUnit: 'km',
    volumeUnit: 'litre',
    higherBetter: false,
    toLitresPerKm:   l100 => l100 / 100,
    fromLitresPerKm: lkm  => lkm * 100,
    defaultHwy: 6.0, defaultCity: 8.5,
  },
  kpl: {
    label: 'km/L',
    distanceUnit: 'km',
    volumeUnit: 'litre',
    higherBetter: true,
    toLitresPerKm:   kpl  => 1 / kpl,
    fromLitresPerKm: lkm  => 1 / lkm,
    defaultHwy: 16, defaultCity: 11,
  },
  kpg_us: {
    label: 'km/gal',
    distanceUnit: 'km',
    volumeUnit: 'us_gal',
    higherBetter: true,
    toLitresPerKm:   kpg  => L_PER_US_GAL / kpg,
    fromLitresPerKm: lkm  => L_PER_US_GAL / lkm,
    defaultHwy: 51, defaultCity: 38,
  },
};

const VOLUME_UNITS = {
  // `label` is the gas-price suffix ("$/gal", "€/L"); `unitLabel` is the
  // bare unit used in the breakdown line. `toLitres` converts price-per-unit
  // to price-per-litre; `fromLitres` converts a litre volume to this unit.
  us_gal: { label: '/gal', unitLabel: 'gal', toLitres: v => v / L_PER_US_GAL, fromLitres: l => l / L_PER_US_GAL },
  uk_gal: { label: '/gal', unitLabel: 'gal', toLitres: v => v / L_PER_UK_GAL, fromLitres: l => l / L_PER_UK_GAL },
  litre:  { label: '/L',   unitLabel: 'L',   toLitres: v => v,                fromLitres: l => l                },
};

// ── Regions — no i18n strings here, those live in /lang/*.json ──
const REGIONS = {
  us: {
    lang: 'en',
    defaultMetric: 'mpg_us',
    gasPriceVolumeUnit: 'us_gal',
    currency: 'USD', currencySymbol: '$', currencyPosition: 'prefix',
    defaultGasPrice: 3.89,
    defaultDieselPrice: 4.20,
    defaultElectricRate: 0.18,
    bias: { lat: 39.5, lon: -98.5 },
    bbox: [-125, 24, -66, 50],
    locale: 'en-US',
  },
  uk: {
    lang: 'en',
    defaultMetric: 'mpg_uk',
    gasPriceVolumeUnit: 'litre',
    currency: 'GBP', currencySymbol: '£', currencyPosition: 'prefix',
    defaultGasPrice: 1.55,
    defaultDieselPrice: 1.65,
    defaultElectricRate: 0.27,
    bias: { lat: 54.0, lon: -2.0 },
    bbox: [-8.7, 49.8, 1.8, 60.9],
    locale: 'en-GB',
  },
  fr: {
    lang: 'fr',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.85,
    defaultDieselPrice: 1.78,
    defaultElectricRate: 0.25,
    bias: { lat: 46.5, lon: 2.5 },
    bbox: [-5.5, 41.0, 10.0, 51.5],
    locale: 'fr-FR',
  },
  pt: {
    lang: 'pt',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.75,
    defaultDieselPrice: 1.65,
    defaultElectricRate: 0.18,
    bias: { lat: 39.5, lon: -8.0 },
    bbox: [-9.6, 36.9, -6.1, 42.2],
    locale: 'pt-PT',
  },
  cn: {
    lang: 'zh',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'CNY', currencySymbol: '¥', currencyPosition: 'prefix',
    defaultGasPrice: 7.80,
    defaultDieselPrice: 7.50,
    defaultElectricRate: 0.55,
    bias: { lat: 35.0, lon: 105.0 },
    bbox: [73.0, 18.0, 135.0, 54.0],
    locale: 'zh-CN',
  },
  cz: {
    lang: 'cs',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'CZK', currencySymbol: 'Kč', currencyPosition: 'suffix',
    defaultGasPrice: 38.00,
    defaultDieselPrice: 36.00,
    defaultElectricRate: 4.50,
    bias: { lat: 49.8, lon: 15.5 },
    bbox: [12.0, 48.5, 19.0, 51.1],
    locale: 'cs-CZ',
  },
  de: {
    lang: 'de',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.75,
    defaultDieselPrice: 1.70,
    defaultElectricRate: 0.35,
    bias: { lat: 51.0, lon: 10.0 },
    bbox: [5.8, 47.2, 15.1, 55.1],
    locale: 'de-DE',
  },
  dk: {
    lang: 'da',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'DKK', currencySymbol: 'kr', currencyPosition: 'suffix',
    defaultGasPrice: 13.50,
    defaultDieselPrice: 13.00,
    defaultElectricRate: 2.50,
    bias: { lat: 56.0, lon: 10.0 },
    bbox: [8.0, 54.5, 15.5, 58.0],
    locale: 'da-DK',
  },
  es: {
    lang: 'es',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.55,
    defaultDieselPrice: 1.45,
    defaultElectricRate: 0.16,
    bias: { lat: 40.0, lon: -3.7 },
    bbox: [-9.5, 35.9, 4.4, 43.8],
    locale: 'es-ES',
  },
  fi: {
    lang: 'fi',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.85,
    defaultDieselPrice: 1.80,
    defaultElectricRate: 0.12,
    bias: { lat: 64.0, lon: 26.0 },
    bbox: [20.0, 59.5, 31.6, 70.1],
    locale: 'fi-FI',
  },
  gr: {
    lang: 'el',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.85,
    defaultDieselPrice: 1.65,
    defaultElectricRate: 0.20,
    bias: { lat: 39.0, lon: 22.0 },
    bbox: [19.4, 34.8, 28.3, 41.8],
    locale: 'el-GR',
  },
  hu: {
    lang: 'hu',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'HUF', currencySymbol: 'Ft', currencyPosition: 'suffix',
    defaultGasPrice: 620,
    defaultDieselPrice: 620,
    defaultElectricRate: 36,
    bias: { lat: 47.2, lon: 19.5 },
    bbox: [16.1, 45.7, 22.9, 48.6],
    locale: 'hu-HU',
  },
  id: {
    lang: 'id',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'IDR', currencySymbol: 'Rp', currencyPosition: 'prefix',
    defaultGasPrice: 10000,
    defaultDieselPrice: 6800,
    defaultElectricRate: 1500,
    bias: { lat: -2.5, lon: 118.0 },
    bbox: [95.0, -11.0, 141.0, 6.0],
    locale: 'id-ID',
  },
  in: {
    lang: 'hi',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'INR', currencySymbol: '₹', currencyPosition: 'prefix',
    defaultGasPrice: 100,
    defaultDieselPrice: 92,
    defaultElectricRate: 8,
    bias: { lat: 22.0, lon: 79.0 },
    bbox: [68.0, 6.0, 97.5, 35.7],
    locale: 'hi-IN',
  },
  it: {
    lang: 'it',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'suffix',
    defaultGasPrice: 1.85,
    defaultDieselPrice: 1.75,
    defaultElectricRate: 0.30,
    bias: { lat: 42.5, lon: 12.5 },
    bbox: [6.6, 36.6, 18.5, 47.1],
    locale: 'it-IT',
  },
  jp: {
    lang: 'ja',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'JPY', currencySymbol: '¥', currencyPosition: 'prefix',
    defaultGasPrice: 175,
    defaultDieselPrice: 155,
    defaultElectricRate: 30,
    bias: { lat: 36.0, lon: 138.0 },
    bbox: [122.0, 24.0, 146.0, 46.0],
    locale: 'ja-JP',
  },
  kr: {
    lang: 'ko',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'KRW', currencySymbol: '₩', currencyPosition: 'prefix',
    defaultGasPrice: 1700,
    defaultDieselPrice: 1550,
    defaultElectricRate: 150,
    bias: { lat: 36.5, lon: 127.5 },
    bbox: [125.0, 33.0, 130.0, 39.0],
    locale: 'ko-KR',
  },
  nl: {
    lang: 'nl',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'EUR', currencySymbol: '€', currencyPosition: 'prefix',
    defaultGasPrice: 2.00,
    defaultDieselPrice: 1.80,
    defaultElectricRate: 0.30,
    bias: { lat: 52.2, lon: 5.3 },
    bbox: [3.4, 50.7, 7.2, 53.6],
    locale: 'nl-NL',
  },
  no: {
    lang: 'no',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'NOK', currencySymbol: 'kr', currencyPosition: 'suffix',
    defaultGasPrice: 22.00,
    defaultDieselPrice: 20.00,
    defaultElectricRate: 1.50,
    bias: { lat: 64.5, lon: 11.0 },
    bbox: [4.6, 57.9, 31.1, 71.2],
    locale: 'nb-NO',
  },
  pl: {
    lang: 'pl',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'PLN', currencySymbol: 'zł', currencyPosition: 'suffix',
    defaultGasPrice: 6.50,
    defaultDieselPrice: 6.50,
    defaultElectricRate: 0.85,
    bias: { lat: 52.0, lon: 19.0 },
    bbox: [14.1, 49.0, 24.2, 54.9],
    locale: 'pl-PL',
  },
  ro: {
    lang: 'ro',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'RON', currencySymbol: 'lei', currencyPosition: 'suffix',
    defaultGasPrice: 7.50,
    defaultDieselPrice: 7.80,
    defaultElectricRate: 1.30,
    bias: { lat: 46.0, lon: 25.0 },
    bbox: [20.3, 43.6, 29.7, 48.3],
    locale: 'ro-RO',
  },
  ru: {
    lang: 'ru',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'RUB', currencySymbol: '₽', currencyPosition: 'suffix',
    defaultGasPrice: 55.00,
    defaultDieselPrice: 65.00,
    defaultElectricRate: 5.50,
    bias: { lat: 60.0, lon: 90.0 },
    bbox: [19.6, 41.2, 180.0, 81.9],
    locale: 'ru-RU',
  },
  se: {
    lang: 'sv',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'SEK', currencySymbol: 'kr', currencyPosition: 'suffix',
    defaultGasPrice: 18.00,
    defaultDieselPrice: 19.00,
    defaultElectricRate: 2.00,
    bias: { lat: 62.0, lon: 15.0 },
    bbox: [11.0, 55.3, 24.2, 69.1],
    locale: 'sv-SE',
  },
  tr: {
    lang: 'tr',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'TRY', currencySymbol: '₺', currencyPosition: 'suffix',
    defaultGasPrice: 45.00,
    defaultDieselPrice: 47.00,
    defaultElectricRate: 2.50,
    bias: { lat: 39.0, lon: 35.0 },
    bbox: [25.6, 35.8, 44.8, 42.1],
    locale: 'tr-TR',
  },
  vn: {
    lang: 'vi',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'VND', currencySymbol: '₫', currencyPosition: 'suffix',
    defaultGasPrice: 23000,
    defaultDieselPrice: 22000,
    defaultElectricRate: 3000,
    bias: { lat: 16.0, lon: 108.0 },
    bbox: [102.1, 8.4, 109.5, 23.4],
    locale: 'vi-VN',
  },
  // ── Rest-of-world additions — no native lang files yet, so each
  // falls back to an existing language. Defaults reflect typical 2025
  // pump prices (these go stale fast — "↻ update?" prompt nudges users
  // after 30 days).
  ae: {
    lang: 'en',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'AED', currencySymbol: 'AED', currencyPosition: 'prefix',
    defaultGasPrice: 3.05,
    defaultDieselPrice: 3.30,
    defaultElectricRate: 0.30,
    bias: { lat: 23.4, lon: 53.8 },
    bbox: [51.0, 22.0, 57.0, 26.5],
    locale: 'en-AE',
  },
  ar: {
    // Argentine Spanish reads the existing es bundle fine; locale just
    // governs number formatting (1.234,56 in es-AR).
    lang: 'es',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'ARS', currencySymbol: '$', currencyPosition: 'prefix',
    defaultGasPrice: 1500,
    defaultDieselPrice: 1450,
    defaultElectricRate: 100,
    bias: { lat: -38.4, lon: -63.6 },
    bbox: [-74.0, -55.0, -53.0, -22.0],
    locale: 'es-AR',
  },
  au: {
    lang: 'en',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'AUD', currencySymbol: '$', currencyPosition: 'prefix',
    defaultGasPrice: 1.95,
    defaultDieselPrice: 2.00,
    defaultElectricRate: 0.30,
    bias: { lat: -25.3, lon: 133.8 },
    bbox: [113.0, -44.0, 154.0, -10.0],
    locale: 'en-AU',
  },
  br: {
    // Brazil reads the (European) Portuguese bundle — same words for
    // the most part; "gasóleo"→"diesel" is the only common divergence
    // and both forms are widely understood.
    lang: 'pt',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'BRL', currencySymbol: 'R$', currencyPosition: 'prefix',
    defaultGasPrice: 5.85,
    defaultDieselPrice: 6.20,
    defaultElectricRate: 0.85,
    bias: { lat: -14.0, lon: -51.5 },
    bbox: [-74.0, -34.0, -34.0, 5.5],
    locale: 'pt-BR',
  },
  mx: {
    lang: 'es',
    defaultMetric: 'kpl',
    gasPriceVolumeUnit: 'litre',
    currency: 'MXN', currencySymbol: '$', currencyPosition: 'prefix',
    defaultGasPrice: 24.00,
    defaultDieselPrice: 26.00,
    defaultElectricRate: 4.00,
    bias: { lat: 23.6, lon: -102.5 },
    bbox: [-117.0, 14.5, -86.0, 33.0],
    locale: 'es-MX',
  },
  nz: {
    lang: 'en',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'NZD', currencySymbol: '$', currencyPosition: 'prefix',
    // Diesel is sold considerably cheaper than gas because diesel
    // vehicles pay road-user charges separately at the licensing step
    // — reflected in the default to avoid wildly off comparisons.
    defaultGasPrice: 2.85,
    defaultDieselPrice: 2.20,
    defaultElectricRate: 0.30,
    bias: { lat: -41.0, lon: 174.0 },
    bbox: [166.0, -47.5, 179.0, -34.0],
    locale: 'en-NZ',
  },
  sa: {
    lang: 'en',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'SAR', currencySymbol: 'SAR', currencyPosition: 'prefix',
    // Saudi sets pump prices by decree, with diesel heavily subsidised
    // for commercial vehicles — diesel is roughly half the gas price.
    defaultGasPrice: 2.33,
    defaultDieselPrice: 1.04,
    defaultElectricRate: 0.18,
    bias: { lat: 23.9, lon: 45.0 },
    bbox: [34.0, 16.0, 56.0, 33.0],
    locale: 'en-SA',
  },
  za: {
    lang: 'en',
    defaultMetric: 'l100km',
    gasPriceVolumeUnit: 'litre',
    currency: 'ZAR', currencySymbol: 'R', currencyPosition: 'prefix',
    defaultGasPrice: 23.50,
    defaultDieselPrice: 22.00,
    defaultElectricRate: 3.50,
    bias: { lat: -28.5, lon: 24.5 },
    bbox: [16.0, -35.0, 33.0, -22.0],
    locale: 'en-ZA',
  },
};

// ═══════════════════════════════════════════════════
// i18n — load JSON, apply to DOM via data-i18n
// ═══════════════════════════════════════════════════

// Language data is fetched on demand from lang/*.json and titles/*.json.
// English is already in the HTML so is never fetched for default users.
// Results are cached in-session so each file is fetched at most once.
const langCache   = {};
const titlesCache = {};

// Latest applied translation strings — kept so dynamic UI text (route
// status messages) can look up the same keys the DOM was painted with.
let currentStrings = {};
function t(key, fallback) {
  return currentStrings[key] !== undefined ? currentStrings[key] : fallback;
}

// Snapshot of the English strings as they were in the HTML at script load.
// We use this for English instead of fetching lang/en.json so the HTML
// stays the single source of truth — but unlike the previous return-{}
// shortcut, this also lets us *re-apply* English when the user switches
// back to it after picking another language (otherwise the previous
// language's text stayed painted because no key→value pairs got walked).
const ENGLISH_SNAPSHOT = (function captureEnglishSnapshot() {
  const s = {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    s[el.dataset.i18n] = el.textContent;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    s[el.dataset.i18nAria] = el.getAttribute('aria-label');
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    s[el.dataset.i18nPlaceholder] = el.getAttribute('placeholder');
  });
  // Mode-aware label variants — only one of "Gas Price" / "Diesel Price"
  // / "Fuel Price" is mounted on the label at a time (applyPriceMode
  // swaps `data-i18n`), so explicitly stash the two that aren't in the
  // initial DOM. Without this, switching back to English from another
  // language would leave the foreign text painted on the label.
  s['fuel.gasPrice']      = 'Gas Price';
  s['fuel.dieselPrice']   = 'Diesel Price';
  s['fuel.electricPrice'] = 'Electric Rate';
  return s;
})();

async function loadLanguage(langCode) {
  if (langCode === 'en') return ENGLISH_SNAPSHOT;
  if (langCache[langCode]) return langCache[langCode];
  try {
    const res = await fetch(`lang/${langCode}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const strings = await res.json();
    langCache[langCode] = strings;
    return strings;
  } catch (err) {
    console.warn(`Could not load lang/${langCode}.json`, err);
    return {};
  }
}

async function loadTitles(langCode) {
  if (titlesCache[langCode]) return titlesCache[langCode];
  try {
    const res = await fetch(`titles/${langCode}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const titles = await res.json();
    titlesCache[langCode] = titles;
    return titles;
  } catch (err) {
    console.warn(`Could not load titles/${langCode}.json`, err);
    return [];
  }
}

function applyRandomTitle(titles) {
  if (!titles || titles.length === 0) return;
  const t = titles[Math.floor(Math.random() * titles.length)];
  const plainEl    = document.querySelector('[data-i18n="title.plain"]');
  const emEl       = document.querySelector('[data-i18n="title.em"]');
  const subtitleEl = document.querySelector('[data-i18n="subtitle"]');
  if (plainEl)    plainEl.textContent    = t.plain;
  if (emEl)       emEl.textContent       = t.em;
  if (subtitleEl) subtitleEl.textContent = t.subtitle;
}

function applyTranslations(strings) {
  currentStrings = strings;

  // Text content: [data-i18n="key"] → strings[key]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (strings[key] !== undefined) el.textContent = strings[key];
  });

  // Aria labels: [data-i18n-aria="key"] → strings[key]
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (strings[key] !== undefined) el.setAttribute('aria-label', strings[key]);
  });

  // Placeholders: [data-i18n-placeholder="key"] → strings[key]
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (strings[key] !== undefined) el.setAttribute('placeholder', strings[key]);
  });

  // Car-lookup placeholder depends on the current stage, so the static
  // data-i18n-placeholder attribute can't carry it — refresh manually.
  if (typeof setCarPlaceholder === 'function') setCarPlaceholder();
}

// ═══════════════════════════════════════════════════
// STATE & STORAGE
// ═══════════════════════════════════════════════════

const LS_KEY = 'roadtrip_prefs_v2';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}

function savePrefs(patch) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...loadPrefs(), ...patch }));
  } catch {}
}

// ── Fuel-price staleness ──────────────────────────
// Default per-region prices go stale fast — gas swings several percent
// month-to-month. After ~30 days since the user last touched the price,
// surface a tiny "↻ update?" prompt next to the Fuel Price label so they
// know to re-enter a current value (the user knows their local price
// better than our hard-coded defaults ever could).
//
// Debug: append `?staleDebug=1` to the URL to force the prompt to show
// regardless of timestamp. Captured once at script load (not re-read on
// every check) because the URL gets rewritten by `updateShareUrl()` —
// `buildShareUrl()` re-appends the param so it survives navigation.
const STALE_THRESHOLD_DAYS = 30;
const STALE_THRESHOLD_MS   = STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
const DEBUG_STALE = new URLSearchParams(location.search).get('staleDebug') === '1';

function isFuelPriceStale(fuel) {
  if (DEBUG_STALE) return true;
  const key = fuel === 'diesel'   ? 'dieselPriceUpdatedAt'
            : fuel === 'electric' ? 'electricRateUpdatedAt'
                                  : 'gasPriceUpdatedAt';
  const ts  = loadPrefs()[key];
  if (typeof ts !== 'number') return false;
  return (Date.now() - ts) > STALE_THRESHOLD_MS;
}

function refreshStalePrompt() {
  if (gasPriceStaleEl)     gasPriceStaleEl.hidden     = !isFuelPriceStale('gas');
  if (dieselPriceStaleEl)  dieselPriceStaleEl.hidden  = !isFuelPriceStale('diesel');
  if (electricRateStaleEl) electricRateStaleEl.hidden = !isFuelPriceStale('electric');
}

// ── Fuel price modes ──────────────────────────────
// Multi-select set of active fuel inputs/costs: any non-empty subset of
// { gas, diesel, electric }. Persisted as a comma-separated string in
// prefs and the URL. Legacy 'both' value migrates to 'gas,diesel'.
const VALID_PRICE_MODES = ['gas', 'diesel', 'electric'];
const VALID_PRICE_MODES_SET = new Set(VALID_PRICE_MODES);

function parsePriceModes(input) {
  if (!input) return ['gas'];
  // Legacy single-string values kept in prefs from before multi-select.
  if (input === 'both') return ['gas', 'diesel'];
  let arr = Array.isArray(input) ? input
          : typeof input === 'string' ? input.split(',')
                                      : ['gas'];
  arr = arr.map(m => m.trim()).filter(m => VALID_PRICE_MODES_SET.has(m));
  return arr.length ? arr : ['gas'];
}

function currentPriceModes() {
  if (!fuelPriceZoneEl) return ['gas'];
  return VALID_PRICE_MODES.filter(m => fuelPriceZoneEl.classList.contains('has-mode-' + m));
}

function applyPriceModes(modes, { save = false } = {}) {
  const set = new Set(parsePriceModes(modes));
  // Always reflect the canonical order so storage/URL/UI agree.
  const ordered = VALID_PRICE_MODES.filter(m => set.has(m));
  // Toggle the has-mode-X classes on the zone (drives the input show/
  // hide rules and the eff-field show/hide rules via sibling selectors).
  VALID_PRICE_MODES.forEach(m => {
    fuelPriceZoneEl.classList.toggle('has-mode-' + m, set.has(m));
  });
  // Update the picker buttons' aria-pressed state.
  document.querySelectorAll('.price-mode-option').forEach(btn => {
    btn.setAttribute('aria-pressed', String(set.has(btn.dataset.mode)));
  });
  // Section label: when exactly one mode is active, use its specific
  // label ("Gas Price" / "Diesel Price" / "Electric Rate"). Multi-mode
  // falls back to the generic "Fuel Price". data-i18n updated so a
  // language switch later still paints the right translation.
  const labelEl = fuelPriceZoneEl.querySelector('.fuel-price-label');
  if (labelEl) {
    let labelKey, labelDefault;
    if (ordered.length === 1) {
      labelKey = ordered[0] === 'gas'    ? 'fuel.gasPrice'
               : ordered[0] === 'diesel' ? 'fuel.dieselPrice'
                                         : 'fuel.electricPrice';
      labelDefault = ordered[0] === 'gas'    ? 'Gas Price'
                   : ordered[0] === 'diesel' ? 'Diesel Price'
                                             : 'Electric Rate';
    } else {
      labelKey = 'fuel.price';
      labelDefault = 'Fuel Price';
    }
    labelEl.dataset.i18n = labelKey;
    labelEl.textContent  = t(labelKey, labelDefault);
  }
  if (save) savePrefs({ priceMode: ordered.join(',') });
  if (typeof calculate === 'function') calculate();
  refreshStalePrompt();
}

// ── Fuel-type categorisation ──────────────────────
// Groups FE.gov's `fuelType1` strings into four buckets we colour
// consistently across the saved-car pills, the cost-comparison row,
// and the fuel-price inputs themselves. "other" is everything that
// doesn't cleanly map to a single pump price (PHEVs, E85, CNG,
// hydrogen, plus blank for older saved cars without the field).
function fuelCategory(fuelType1) {
  if (!fuelType1) return 'other';
  const lower = fuelType1.toLowerCase();
  if (lower.includes('diesel'))      return 'diesel';
  if (lower === 'electricity')       return 'electric';
  // PHEVs come back as e.g. "Premium Gas or Electricity" — too
  // ambiguous to assign a single rate, so they fall through to
  // "other" with the existing warning hint.
  if (lower.includes('gasoline'))    return 'gas';
  return 'other';
}

// ── EV efficiency conversions ─────────────────────
// FE.gov ships kWh/100mi (`cityE`, `highwayE`). We store that as the
// canonical unit (matching how MPG-US is canonical for liquid fuels),
// and display in kWh/100mi or kWh/100km depending on the active
// distance unit.
function kwhPer100MiToDisplay(kwhPer100Mi, distanceUnit) {
  return distanceUnit === 'km'
    ? +(kwhPer100Mi / KM_PER_MILE).toFixed(1)
    : +kwhPer100Mi.toFixed(1);
}

function displayToKwhPer100Mi(displayed, distanceUnit) {
  return distanceUnit === 'km' ? displayed * KM_PER_MILE : displayed;
}

// ── Currency-aware price formatting ───────────────
// USD has 2 fraction digits, JPY has 0, BHD has 3, etc. Pad an input
// value to at least the active currency's standard precision so a user
// who types "4.2" sees "4.20", but preserve any extra precision they
// typed (electric rates often want 3 — "$0.187/kWh" should not
// truncate to "$0.19").
function currencyFractionDigits(currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency })
      .resolvedOptions().minimumFractionDigits;
  } catch {
    return 2;
  }
}
function padPriceForCurrency(value, currency) {
  const str = String(value ?? '');
  if (str === '') return '';
  const num = parseFloat(str);
  if (!Number.isFinite(num)) return str;
  const minDigits   = currencyFractionDigits(currency);
  const dotIdx      = str.indexOf('.');
  const typedDigits = dotIdx >= 0 ? str.length - dotIdx - 1 : 0;
  return num.toFixed(Math.max(minDigits, typedDigits));
}

// ═══════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════

const regionSelect   = document.getElementById('region-select');
const metricSelect   = document.getElementById('metric-select');
const distanceInput  = document.getElementById('distance');
const distanceUnitEl = document.getElementById('distance-unit-label');
const hwySlider      = document.getElementById('highway-pct');
const cityPctDisplay = document.getElementById('city-pct-display');
const hwyPctDisplay  = document.getElementById('hwy-pct-display');
const effHwyInput    = document.getElementById('efficiency-hwy');
const effCityInput   = document.getElementById('efficiency-city');
const effUnitHwy     = document.getElementById('eff-unit-hwy');
const effUnitCity    = document.getElementById('eff-unit-city');
const gasPriceInput     = document.getElementById('gas-price');
const gasPriceStaleEl   = document.getElementById('gas-price-stale');
const dieselPriceInput  = document.getElementById('diesel-price');
const dieselPriceStaleEl = document.getElementById('diesel-price-stale');
const electricRateInput  = document.getElementById('electric-rate');
const electricRateStaleEl = document.getElementById('electric-rate-stale');
const fuelPriceZoneEl   = document.getElementById('fuel-price-zone');
const dieselCurrencyPrefixEl   = document.getElementById('currency-prefix-diesel');
const dieselVolumeSuffixEl     = document.getElementById('volume-suffix-diesel');
const electricCurrencyPrefixEl = document.getElementById('currency-prefix-electric');
const evEffHwyInput  = document.getElementById('ev-eff-hwy');
const evEffCityInput = document.getElementById('ev-eff-city');
const evUnitHwy      = document.getElementById('ev-unit-hwy');
const evUnitCity     = document.getElementById('ev-unit-city');
const currencyPrefix = document.getElementById('currency-prefix');
const volumeSuffix   = document.getElementById('volume-suffix');
const resultEl       = document.getElementById('result');
const resultVolumeEl = document.getElementById('result-volume');
const splitLinkEl    = document.getElementById('split-link');
const shareLinkEl    = document.getElementById('share-link');
const splitModalEl   = document.getElementById('split-modal');
const splitTbodyEl   = document.getElementById('split-tbody');
const splitCloseEl   = document.getElementById('split-close');
const shareModalEl   = document.getElementById('share-modal');
const shareUrlEl     = document.getElementById('share-url');
const shareCopyEl    = document.getElementById('share-copy');
const shareNativeEl  = document.getElementById('share-native');
const shareCloseEl   = document.getElementById('share-close');
const installBannerEl    = document.getElementById('install-banner');
const installBannerActionEl  = document.getElementById('install-banner-action');
const installBannerDismissEl = document.getElementById('install-banner-dismiss');
const installModalEl     = document.getElementById('install-modal');
const installCloseEl     = document.getElementById('install-close');
const installConfirmEl   = document.getElementById('install-confirm');
const installCancelEl    = document.getElementById('install-cancel');
const routeOriginEl   = document.getElementById('route-origin');
const routeDestsEl    = document.getElementById('route-destinations');
const routeAddStopEl  = document.getElementById('route-add-stop');
const routeButtonEl   = document.getElementById('route-calculate');
const routeStatusEl   = document.getElementById('route-status');
const osmLinkEl       = document.getElementById('osm-link');
const costComparisonEl = document.getElementById('cost-comparison');

// Live array of destination <input> elements in render order. Always at
// least one entry; each input may carry a `_selectedCoords` property the
// autocomplete sets when the user picks a Photon suggestion.
const destinationInputs = [];
const oneWayCheckEl  = document.getElementById('route-one-way');
const carInputEl     = document.getElementById('car-input');
const carChipsEl     = document.getElementById('car-chips');
const carListEl      = document.getElementById('car-list');
const carClearEl     = document.getElementById('car-clear');
const carStatusEl    = document.getElementById('car-status');
const savedCarsEl    = document.getElementById('saved-cars');
const customVehicleModalEl = document.getElementById('custom-vehicle-modal');
const customVehicleFormEl  = document.getElementById('custom-vehicle-form');
const customVehicleNameEl  = document.getElementById('custom-vehicle-name');

// Most recent successful route's one-way distance, in km. Used so toggling
// the "one way" checkbox can re-derive the displayed distance without
// re-fetching the route. Cleared whenever the user types a distance manually.
let lastRouteKm = null;
// Origin + destinations coords from the last successful calc, in forward
// order. Drives the "View route" link's URL — the round-trip path is
// constructed from this on the fly so toggling one-way after a calc
// flips the link too.
let lastRouteLocations = null;
// Session-only: starts false on every page load so the link only ever
// appears after a Calculate-in-this-session. Set true in planRoute,
// cleared on manual distance edit. Not persisted.
let osmLinkVisible = false;
// Snapshot of the most recently calculated trip cost — feeds the split
// modal. Cleared when the inputs go invalid.
let lastCostInfo = null;
// Suppress lastRouteKm clearing while we update distanceInput programmatically.
let suppressDistanceClear = false;

// ═══════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════

function applyMetricUI(metricKey, region) {
  const metric  = METRICS[metricKey];
  const volUnit = VOLUME_UNITS[region.gasPriceVolumeUnit];

  distanceUnitEl.textContent = metric.distanceUnit;
  effUnitHwy.textContent     = metric.label;
  effUnitCity.textContent    = metric.label;

  // EV efficiency unit follows the active distance unit — kWh/100mi
  // when MPG-style metric, kWh/100km when L/100km-style.
  const evUnitLabel = metric.distanceUnit === 'mi' ? 'kWh/100mi' : 'kWh/100km';
  if (evUnitHwy)  evUnitHwy.textContent  = evUnitLabel;
  if (evUnitCity) evUnitCity.textContent = evUnitLabel;

  if (region.currencyPosition === 'prefix') {
    currencyPrefix.textContent  = region.currencySymbol;
    currencyPrefix.style.display = '';
    volumeSuffix.textContent    = volUnit.label;
    if (electricCurrencyPrefixEl) {
      electricCurrencyPrefixEl.textContent  = region.currencySymbol;
      electricCurrencyPrefixEl.style.display = '';
    }
    if (dieselCurrencyPrefixEl) {
      dieselCurrencyPrefixEl.textContent  = region.currencySymbol;
      dieselCurrencyPrefixEl.style.display = '';
    }
    if (dieselVolumeSuffixEl) dieselVolumeSuffixEl.textContent = volUnit.label;
  } else {
    currencyPrefix.textContent  = '';
    currencyPrefix.style.display = 'none';
    volumeSuffix.textContent    = volUnit.label + '\u00A0' + region.currencySymbol;
    if (electricCurrencyPrefixEl) {
      electricCurrencyPrefixEl.textContent  = '';
      electricCurrencyPrefixEl.style.display = 'none';
    }
    if (dieselCurrencyPrefixEl) {
      dieselCurrencyPrefixEl.textContent  = '';
      dieselCurrencyPrefixEl.style.display = 'none';
    }
    if (dieselVolumeSuffixEl) {
      dieselVolumeSuffixEl.textContent = volUnit.label + '\u00A0' + region.currencySymbol;
    }
  }
  // Electric is always per-kWh \u2014 suffix doesn't take a volume unit,
  // just a currency cue when the region's currency position is suffix.
  const electricSuffix = document.getElementById('volume-suffix-electric');
  if (electricSuffix) {
    electricSuffix.textContent = region.currencyPosition === 'prefix'
      ? '/kWh'
      : '/kWh\u00A0' + region.currencySymbol;
  }
}

function updateSliderDisplay() {
  const hwy  = parseInt(hwySlider.value, 10);
  const city = 100 - hwy;
  hwyPctDisplay.textContent  = hwy  + '%';
  cityPctDisplay.textContent = city + '%';
  // aria-valuetext updated here; translation of hwy/city words happens via
  // the live strings kept in the closure below
  hwySlider.setAttribute('aria-valuetext', `${hwy}% / ${city}%`);
}

// ═══════════════════════════════════════════════════
// CALCULATION
// ═══════════════════════════════════════════════════

function calculate() {
  const region   = REGIONS[regionSelect.value];
  const metric   = METRICS[metricSelect.value];

  const dist     = parseFloat(distanceInput.value);
  const hwyPct   = parseInt(hwySlider.value, 10) / 100;
  const cityPct  = 1 - hwyPct;
  const effHwy        = parseFloat(effHwyInput.value);
  const effCity       = parseFloat(effCityInput.value);
  const evHwy         = parseFloat(evEffHwyInput.value);
  const evCity        = parseFloat(evEffCityInput.value);
  const gasPrice      = parseFloat(gasPriceInput.value);
  const dieselPrice   = parseFloat(dieselPriceInput.value);
  const electricRate  = parseFloat(electricRateInput.value);
  const modes         = currentPriceModes();

  // Validate per active mode. Liquid modes need MPG inputs + their
  // price; electric mode needs kWh inputs + electric rate. Common
  // requirements: distance.
  if (isNaN(dist) || dist <= 0) return showInvalidResult();
  const usesLiquid = modes.includes('gas') || modes.includes('diesel');
  if (usesLiquid && [effHwy, effCity].some(v => isNaN(v) || v <= 0)) return showInvalidResult();
  if (modes.includes('electric') && [evHwy, evCity].some(v => isNaN(v) || v <= 0)) return showInvalidResult();
  if (modes.includes('gas')      && (isNaN(gasPrice)     || gasPrice     <= 0)) return showInvalidResult();
  if (modes.includes('diesel')   && (isNaN(dieselPrice)  || dieselPrice  <= 0)) return showInvalidResult();
  if (modes.includes('electric') && (isNaN(electricRate) || electricRate <= 0)) return showInvalidResult();

  const distKm     = metric.distanceUnit === 'mi' ? dist * KM_PER_MILE : dist;

  // Liquid fuel calc — same lkm canonical as before.
  const lkmMixed   = usesLiquid
    ? metric.toLitresPerKm(effHwy) * hwyPct + metric.toLitresPerKm(effCity) * cityPct
    : 0;
  const litresUsed = distKm * lkmMixed;
  const gasCost    = litresUsed * VOLUME_UNITS[region.gasPriceVolumeUnit].toLitres(gasPrice || 0);
  const dieselCost = litresUsed * VOLUME_UNITS[region.gasPriceVolumeUnit].toLitres(dieselPrice || 0);

  // EV calc — kWh inputs are in kWh/100<distanceUnit>; convert to
  // kWh/km canonical, multiply by distKm, multiply by $/kWh.
  const evKwhPerKmHwy = metric.distanceUnit === 'mi'
    ? (evHwy || 0) / 100 / KM_PER_MILE
    : (evHwy || 0) / 100;
  const evKwhPerKmCity = metric.distanceUnit === 'mi'
    ? (evCity || 0) / 100 / KM_PER_MILE
    : (evCity || 0) / 100;
  const kwhUsed       = distKm * (evKwhPerKmHwy * hwyPct + evKwhPerKmCity * cityPct);
  const electricCost  = kwhUsed * (electricRate || 0);

  // Build per-mode cost spans with their own threshold colour. Order
  // is canonical: gas, diesel, electric. The threshold class drives
  // the colour (green/amber/red); fuel-specific colour is reserved
  // for the saved-car pills + cost-comparison row.
  const costEntries = [];
  if (modes.includes('gas'))      costEntries.push({ key: 'gas',      cost: gasCost });
  if (modes.includes('diesel'))   costEntries.push({ key: 'diesel',   cost: dieselCost });
  if (modes.includes('electric')) costEntries.push({ key: 'electric', cost: electricCost });

  const buildSpan = ({ key, cost }) => {
    const span = document.createElement('span');
    span.className = 'result-cost result-cost-' + key +
      (cost >= 80 ? ' is-high' : cost >= 30 ? ' is-mid' : '');
    span.textContent = formatMoney(cost, region);
    return span;
  };

  resultEl.innerHTML = '';
  resultEl.classList.remove('is-three-fuels');

  if (modes.length === 3) {
    // Special layout: gas+diesel half-size stacked left, electric
    // full-size right. The user spec'd this; the existing single-line
    // approach doesn't accommodate three values gracefully.
    // DOM order is [electric, liquids] (visual order is reversed by
    // CSS `flex-direction: row-reverse`). Putting electric first in
    // DOM makes the inline-flex container's baseline come from the
    // electric span — matching single-fuel mode's baseline so the
    // headline doesn't shift vertically when switching to 3-fuel.
    resultEl.classList.add('is-three-fuels');
    const electric = document.createElement('span');
    electric.className = 'result-electric';
    electric.appendChild(buildSpan(costEntries[2])); // electric
    const liquids = document.createElement('span');
    liquids.className = 'result-liquids';
    liquids.appendChild(buildSpan(costEntries[0])); // gas
    liquids.appendChild(buildSpan(costEntries[1])); // diesel
    resultEl.appendChild(electric);
    resultEl.appendChild(liquids);
  } else {
    // 1 or 2 modes — render spans inline with a "/" separator. For
    // a single mode this collapses to one span (no separator), same
    // visual as the pre-multi-mode era.
    costEntries.forEach((entry, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'result-cost-sep';
        sep.textContent = '/';
        resultEl.appendChild(sep);
      }
      resultEl.appendChild(buildSpan(entry));
    });
  }

  // Snapshot for the split-cost modal: split the highest cost (worst
  // case). Lets the user "split the bill" on the most expensive
  // outcome regardless of which fuel they end up using.
  const peakCost = Math.max(...costEntries.map(e => e.cost));
  lastCostInfo  = { total: peakCost, region };
  splitLinkEl.hidden = false;

  // Volume readout. Each active fuel category contributes one figure:
  // liquid (gallons or litres) and electric (kWh) — joined with " / "
  // when both are present. Electric-only mode hides the liquid figure
  // entirely, since the user isn't burning fuel.
  const volParts = [];
  if (usesLiquid) {
    const volUnit    = VOLUME_UNITS[metric.volumeUnit];
    const volumeUsed = volUnit.fromLitres(litresUsed);
    volParts.push(
      `${volumeUsed.toLocaleString(region.locale, { maximumFractionDigits: 1 })} ${volUnit.unitLabel}`
    );
  }
  if (modes.includes('electric')) {
    volParts.push(
      `${kwhUsed.toLocaleString(region.locale, { maximumFractionDigits: 1 })} kWh`
    );
  }
  resultVolumeEl.textContent = volParts.join(' / ');
  fitResultValue();
  renderCostComparison();
}

// Shared "no valid input" path — keeps calculate() readable.
function showInvalidResult() {
  resultEl.textContent       = '—';
  resultEl.className         = 'result-value';
  resultVolumeEl.textContent = '';
  splitLinkEl.hidden         = true;
  lastCostInfo               = null;
  fitResultValue();
  renderCostComparison();
}

// Scale the cost number's font-size down whenever the formatted text would
// overflow the room left in .result-numbers (e.g. high-currency regions or
// 7+ digit prices). We always reset to '' first so the CSS clamp() drives
// the measurement baseline; a previous override doesn't compound.
function fitResultValue() {
  if (!resultEl) return;
  resultEl.style.fontSize = '';
  const row = resultEl.parentElement; // .result-numbers
  if (!row) return;
  const available = row.clientWidth;
  const needed    = resultEl.scrollWidth;
  if (available > 0 && needed > available) {
    const ratio = (available / needed) * 0.96;     // 4% safety margin
    const base  = parseFloat(getComputedStyle(resultEl).fontSize);
    resultEl.style.fontSize = (base * ratio).toFixed(1) + 'px';
  }
}

// ── Split-cost modal ──────────────────────────────
function formatMoney(amount, region) {
  try {
    return new Intl.NumberFormat(region.locale, {
      style: 'currency', currency: region.currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return region.currencySymbol + amount.toFixed(2);
  }
}

// ── Model-name aliases ────────────────────────────
// Loaded once from model-aliases.json. Each rule rewrites a saved car's
// `model` for display + disambiguation in the cost-comparison row only
// — the saved-car pills and breadcrumb chips above the MPG inputs keep
// the raw FE.gov text. Optional `make` field constrains the rule to a
// specific make (exact match); omit for any.
let modelAliases = [];

async function loadModelAliases() {
  try {
    const res = await fetch('model-aliases.json');
    if (!res.ok) return;
    const raw = await res.json();
    modelAliases = raw.map(r => ({
      make:        r.make || null,
      regex:       new RegExp(r.pattern, r.flags || ''),
      replacement: r.replacement || '',
    }));
  } catch (err) {
    console.warn('model-aliases.json load failed:', err);
    modelAliases = [];
  }
}

function aliasModel(make, model) {
  if (!model) return model;
  for (const rule of modelAliases) {
    if (rule.make && rule.make !== make) continue;
    if (rule.regex.test(model)) return model.replace(rule.regex, rule.replacement);
  }
  return model;
}

// Live cost comparison across saved cars. Recomputed on every calculate()
// (so distance / highway-mix / fuel-price changes flow through) and on
// every renderSavedCars() (so add/remove of saved cars updates the row).
// Hidden when there are <2 saved cars or when inputs are invalid.
function renderCostComparison() {
  if (!costComparisonEl) return;
  const cars = getSavedCars();
  if (cars.length < 2) {
    costComparisonEl.hidden = true;
    return;
  }

  const region        = REGIONS[regionSelect.value];
  const metric        = METRICS[metricSelect.value];
  const dist          = parseFloat(distanceInput.value);
  const gasPrice      = parseFloat(gasPriceInput.value);
  const dieselPrice   = parseFloat(dieselPriceInput.value);
  const electricRate  = parseFloat(electricRateInput.value);
  const hwyPct        = parseInt(hwySlider.value, 10) / 100;
  const cityPct       = 1 - hwyPct;

  // The row needs at least gas price (the fallback for cars whose
  // fuel type doesn't cleanly map to gas/diesel/electric — flagged
  // visually as "other"). Diesel and electric rates each only matter
  // if the user has matching saved cars, but we read them anyway so
  // the row updates immediately when the user types.
  if (isNaN(dist) || dist <= 0 || isNaN(gasPrice) || gasPrice <= 0) {
    costComparisonEl.hidden = true;
    return;
  }

  const distKm = metric.distanceUnit === 'mi' ? dist * KM_PER_MILE : dist;
  // null when the matching rate isn't filled in — the loop below shows
  // "—" rather than silently falling back to gas (which would mislead
  // for a diesel or electric car). Gas rate is always present here
  // because the row is gated on a valid gasPrice above.
  const costPerL_gas    = VOLUME_UNITS[region.gasPriceVolumeUnit].toLitres(gasPrice);
  const costPerL_diesel = !isNaN(dieselPrice) && dieselPrice > 0
    ? VOLUME_UNITS[region.gasPriceVolumeUnit].toLitres(dieselPrice)
    : null;
  const ratePerKwh = !isNaN(electricRate) && electricRate > 0
    ? electricRate
    : null;

  // Apply model-name aliases before sort/disambiguation so the rewritten
  // labels drive both the display text and the uniqueness ladder. Doing
  // it here (not at save time) keeps the saved-car pills above untouched.
  const aliased = cars.map(car => ({ ...car, model: aliasModel(car.make, car.model) }));

  // Sort by Make, Model, Year, Trim, then build the smallest label that
  // distinguishes each car from the others (model, escalating to year+,
  // year+trim, then make+model+ as needed).
  const sorted = aliased.sort((a, b) =>
    (a.make  || '').localeCompare(b.make  || '') ||
    (a.model || '').localeCompare(b.model || '') ||
    (a.year  || 0) - (b.year || 0) ||
    (a.trim  || '').localeCompare(b.trim  || '')
  );
  const labels = sorted.map(car => uniqueCarLabel(car, sorted));

  costComparisonEl.innerHTML = '';
  sorted.forEach((car, i) => {
    const fuel = fuelCategory(car.fuelType1);
    // cost stays null when the rate matching this car's fuel isn't
    // filled in — we render "—" instead of silently using a wrong rate.
    let cost = null;
    if (fuel === 'electric') {
      if (car.kwhCity > 0 && car.kwhHwy > 0 && ratePerKwh !== null) {
        // Saved kWh values are in kWh/100mi (FE.gov canonical) —
        // convert to kWh/km, multiply by km × $/kWh.
        const kwhPerKmHwy  = car.kwhHwy  / 100 / KM_PER_MILE;
        const kwhPerKmCity = car.kwhCity / 100 / KM_PER_MILE;
        cost = distKm * (kwhPerKmHwy * hwyPct + kwhPerKmCity * cityPct) * ratePerKwh;
      }
    } else if (fuel === 'diesel') {
      if (costPerL_diesel !== null) {
        const lkmHwy  = METRICS.mpg_us.toLitresPerKm(car.hwy);
        const lkmCity = METRICS.mpg_us.toLitresPerKm(car.city);
        cost = distKm * (lkmHwy * hwyPct + lkmCity * cityPct) * costPerL_diesel;
      }
    } else {
      // 'gas' or 'other' — both use the gas rate. 'other' (PHEVs,
      // hydrogen, alt-fuel) fall back to gas with the existing ⚠
      // glyph on the saved-car pill, since we have no honest rate
      // for them and the user picked them as a comparison reference.
      const lkmHwy  = METRICS.mpg_us.toLitresPerKm(car.hwy);
      const lkmCity = METRICS.mpg_us.toLitresPerKm(car.city);
      cost = distKm * (lkmHwy * hwyPct + lkmCity * cityPct) * costPerL_gas;
    }

    const item = document.createElement('span');
    item.className = 'cost-comparison-item is-fuel-' + fuel;

    const name = document.createElement('span');
    name.className = 'cost-comparison-name';
    name.textContent = `${labels[i]}:`;

    const costEl = document.createElement('span');
    if (cost === null) {
      costEl.className = 'cost-comparison-cost is-missing-rate';
      costEl.textContent = '—';
    } else {
      costEl.className = 'cost-comparison-cost' +
        (cost >= 80 ? ' is-high' : cost >= 30 ? ' is-mid' : '');
      costEl.textContent = formatMoney(cost, region);
    }

    item.appendChild(name);
    item.appendChild(costEl);
    costComparisonEl.appendChild(item);
  });
  costComparisonEl.hidden = false;
}

// Smallest label for `car` that uniquely identifies it within `allCars`.
// Climbs the specificity ladder: model → year+model → year+model+trim →
// make+model → make+year+model → make+year+model+trim. Empty fields are
// dropped from the joined string.
function uniqueCarLabel(car, allCars) {
  const ladder = [
    ['model'],
    ['year', 'model'],
    ['year', 'model', 'trim'],
    ['make', 'model'],
    ['make', 'year', 'model'],
    ['make', 'year', 'model', 'trim'],
  ];
  for (const fields of ladder) {
    const sameOnFields = allCars.filter(c =>
      fields.every(f => String(c[f] ?? '') === String(car[f] ?? ''))
    );
    if (sameOnFields.length === 1) {
      return fields
        .map(f => car[f])
        .filter(v => v != null && v !== '')
        .join(' ');
    }
  }
  // Defensive fallback (saveSavedCar dedupes by FE.gov vehicle id, so two
  // cars with all four fields identical shouldn't actually exist).
  return [car.make, car.year, car.model, car.trim]
    .filter(v => v != null && v !== '')
    .join(' ');
}

function renderSplitTable() {
  if (!lastCostInfo) return;
  splitTbodyEl.innerHTML = '';
  for (const n of [2, 3, 4, 5]) {
    const tr = document.createElement('tr');
    const tdN = document.createElement('td');
    tdN.textContent = String(n);
    const tdAmount = document.createElement('td');
    tdAmount.textContent = formatMoney(lastCostInfo.total / n, lastCostInfo.region);
    tr.appendChild(tdN);
    tr.appendChild(tdAmount);
    splitTbodyEl.appendChild(tr);
  }
  // Custom row — input + live-updated per-person amount. Defaults to the
  // last value the user typed, falling back to 6.
  const tr = document.createElement('tr');
  const tdInput = document.createElement('td');
  tdInput.className = 'split-input-cell';
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'numeric';
  input.min = '2';
  input.id = 'split-custom';
  const savedN = parseInt(loadPrefs().splitCustom, 10);
  const initialN = savedN >= 2 ? savedN : 6;
  input.value = initialN;
  tdInput.appendChild(input);
  const tdAmount = document.createElement('td');
  tdAmount.id = 'split-custom-result';
  tdAmount.textContent = formatMoney(lastCostInfo.total / initialN, lastCostInfo.region);
  tr.appendChild(tdInput);
  tr.appendChild(tdAmount);
  splitTbodyEl.appendChild(tr);

  input.addEventListener('input', () => {
    const n = parseInt(input.value, 10);
    if (n >= 2 && lastCostInfo) {
      tdAmount.textContent = formatMoney(lastCostInfo.total / n, lastCostInfo.region);
      savePrefs({ splitCustom: n });
      updateShareUrl();
    } else {
      tdAmount.textContent = '';
    }
  });

  // Fun tagline row — full-width, centred, italic.
  const funTr = document.createElement('tr');
  funTr.className = 'split-fun';
  const funTd = document.createElement('td');
  funTd.colSpan = 2;
  funTd.textContent = t('split.tagline', 'Road trips are fun!');
  funTr.appendChild(funTd);
  splitTbodyEl.appendChild(funTr);
}

function openSplitModal() {
  if (!lastCostInfo) return;
  renderSplitTable();
  splitModalEl.showModal();
}

// ═══════════════════════════════════════════════════
// ROUTE PLANNING — Nominatim (geocoding) + Valhalla
// (routing + per-edge road class). All keyless, public
// community endpoints. Best-effort, fair-use only.
// ═══════════════════════════════════════════════════

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const VALHALLA  = 'https://valhalla1.openstreetmap.de';
const PHOTON    = 'https://photon.komoot.io/api';

// Photon currently localises results into these languages; for anything else
// it returns names in the local OSM language.
const PHOTON_LANGS = new Set(['de', 'en', 'es', 'fr', 'it']);

// Road classes Valhalla returns. We treat motorway + trunk as "highway"
// (controlled-access roads); everything else folds into "city". Primary
// roads vary by country so we leave them out of the highway bucket.
const HIGHWAY_CLASSES = new Set(['motorway', 'trunk']);

// ── Address autocomplete (Photon) ────────────────

async function photonSearch(query, lang, signal, region) {
  const code = PHOTON_LANGS.has(lang) ? lang : 'default';
  const base = [
    `q=${encodeURIComponent(query)}`,
    `limit=5`,
    `lang=${code}`,
  ];

  const fetchWith = async (extras) => {
    const res = await fetch(`${PHOTON}?${[...base, ...extras].join('&')}`, { signal });
    if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
    const data = await res.json();
    return (data.features || []).map(f => {
      const props = f.properties || {};
      return {
        lat:         f.geometry.coordinates[1],
        lon:         f.geometry.coordinates[0],
        label:       photonLabel(props),
        housenumber: props.housenumber || null,
      };
    });
  };

  // Primary: hard-restrict to the selected region's country bounding box.
  // Photon's `lat`/`lon` is only a ranking bias, so to actually keep
  // out-of-country hits out of the list we need bbox.
  if (region?.bbox) {
    const [w, s, e, n] = region.bbox;
    const inCountry = await fetchWith([`bbox=${w},${s},${e},${n}`]);
    if (inCountry.length) return inCountry;
  }

  // Fallback: bbox returned nothing (cross-border lookup, or region had
  // no bbox). Drop the filter and rely on centroid bias so home-country
  // alternatives still rank first when relevant.
  const biasParams = region?.bias
    ? [`lat=${region.bias.lat}`, `lon=${region.bias.lon}`, `zoom=6`, `location_bias_scale=1`]
    : [];
  return fetchWith(biasParams);
}

function photonLabel(p) {
  // "Name, City/State, Country" — drop empties and consecutive duplicates
  const raw = [p.name, p.city || p.state, p.country].filter(Boolean);
  const out = [];
  for (const part of raw) if (out[out.length - 1] !== part) out.push(part);
  return out.join(', ');
}

function attachAutocomplete(inputEl, listEl) {
  let suggestions   = [];
  let activeIndex   = -1;
  let debounceTimer = null;
  let abortCtrl     = null;

  inputEl.addEventListener('input', () => {
    // User edited after picking — drop the cached coords so planRoute
    // falls back to Nominatim if they don't pick a new suggestion.
    inputEl._selectedCoords = null;
    schedule();
  });

  inputEl.addEventListener('focus', () => {
    if (suggestions.length) show();
  });

  // Run *before* the planRoute Enter handler so a highlighted suggestion
  // gets selected instead of triggering a route calculation.
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      if (!suggestions.length) return;
      e.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
      paintActive();
    } else if (e.key === 'ArrowUp') {
      if (!suggestions.length) return;
      e.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
      paintActive();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        select(activeIndex);
      }
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  document.addEventListener('click', e => {
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) hide();
  });

  function schedule() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (abortCtrl) abortCtrl.abort();
    const raw = inputEl.value.trim();
    if (raw.length < 3) { hide(); return; }

    // If the user typed a leading house number ("123 Main St", "12A Maple"),
    // remember it. Two-stage strategy:
    //   1. Try the *full* query first — when OSM has the exact address point
    //      Photon returns a feature with properties.housenumber matching what
    //      the user typed. Use those results as-is (most precise).
    //   2. If no feature comes back with a matching housenumber, retry with
    //      the number stripped and prepend it back onto every label. Photon's
    //      relevance is much sharper without the number; the street-centroid
    //      coords it returns are well within fuel-cost-relevant accuracy.
    const m = raw.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
    const num      = m && m[2].length >= 3 ? m[1] : null;
    const stripped = num ? m[2] : null;

    debounceTimer = setTimeout(async () => {
      abortCtrl = new AbortController();
      try {
        const lang   = (document.documentElement.lang || 'en').slice(0, 2);
        const region = REGIONS[regionSelect.value];

        let results = await photonSearch(raw, lang, abortCtrl.signal, region);

        const numMatched = num && results.length &&
          (results[0].housenumber || '').toLowerCase() === num.toLowerCase();

        if (num && !numMatched) {
          const strip = await photonSearch(stripped, lang, abortCtrl.signal, region);
          results = strip.map(s => ({ ...s, label: num + ' ' + s.label }));
        }

        suggestions = results;
        activeIndex = -1;
        render();
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Autocomplete failed:', err);
      }
    }, 250);
  }

  function render() {
    if (!suggestions.length) { hide(); return; }
    listEl.innerHTML = '';
    suggestions.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      li.textContent = s.label;
      li.setAttribute('role', 'option');
      li.id = `${listEl.id}-item-${i}`;
      // mousedown (not click) so the input doesn't blur first and hide the list
      li.addEventListener('mousedown', e => { e.preventDefault(); select(i); });
      li.addEventListener('mouseenter', () => { activeIndex = i; paintActive(); });
      listEl.appendChild(li);
    });
    show();
  }

  function paintActive() {
    const items = listEl.querySelectorAll('.autocomplete-item');
    items.forEach((it, i) => {
      const on = i === activeIndex;
      it.classList.toggle('is-active', on);
      it.setAttribute('aria-selected', on);
    });
    if (activeIndex >= 0) {
      inputEl.setAttribute('aria-activedescendant', items[activeIndex].id);
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else {
      inputEl.removeAttribute('aria-activedescendant');
    }
  }

  function show() {
    listEl.hidden = false;
    inputEl.setAttribute('aria-expanded', 'true');
  }

  function hide() {
    listEl.hidden = true;
    inputEl.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
    inputEl.removeAttribute('aria-activedescendant');
  }

  function select(i) {
    const s = suggestions[i];
    inputEl.value = s.label;
    inputEl._selectedCoords = { lat: s.lat, lon: s.lon };
    suggestions = [];
    hide();
  }
}

async function geocode(query, lang) {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const headers = {};
  if (lang) headers['Accept-Language'] = lang;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`No geocoding result for: ${query}`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function valhallaRoute(locations) {
  const body = {
    locations: locations.map(({ lat, lon }) => ({ lat, lon })),
    costing: 'auto',
    directions_options: { units: 'kilometers' },
  };
  // GET form avoids a CORS preflight that POST+JSON would trigger.
  const res = await fetch(`${VALHALLA}/route?json=${encodeURIComponent(JSON.stringify(body))}`);
  if (!res.ok) throw new Error(`Valhalla /route HTTP ${res.status}`);
  const data = await res.json();
  return {
    distanceKm: data.trip.summary.length,                // total over all legs, kilometres
    legShapes:  data.trip.legs.map(l => l.shape),        // array of polyline6 strings
  };
}

// Highway %  for a multi-leg route. Each leg's encoded polyline is sent
// to /trace_attributes separately; the per-edge lengths are summed across
// legs. Calls run in parallel so a 4-leg round trip costs ~one request
// of latency, not four.
async function valhallaHighwayFraction(legShapes) {
  const filters = { attributes: ['edge.length', 'edge.road_class'], action: 'include' };
  const results = await Promise.all(legShapes.map(async (encoded) => {
    const body = { encoded_polyline: encoded, shape_match: 'edge_walk', costing: 'auto', filters };
    const res = await fetch(`${VALHALLA}/trace_attributes?json=${encodeURIComponent(JSON.stringify(body))}`);
    if (!res.ok) throw new Error(`Valhalla /trace_attributes HTTP ${res.status}`);
    const data = await res.json();
    let highwayKm = 0, totalKm = 0;
    for (const e of data.edges || []) {
      const len = e.length || 0;
      totalKm += len;
      if (HIGHWAY_CLASSES.has(e.road_class)) highwayKm += len;
    }
    return { highwayKm, totalKm };
  }));
  const highwayKm = results.reduce((s, r) => s + r.highwayKm, 0);
  const totalKm   = results.reduce((s, r) => s + r.totalKm,   0);
  return totalKm > 0 ? highwayKm / totalKm : null;
}

// Apply the round-trip multiplier (×2 unless "one way" is checked) and
// write the value into the distance input in whatever unit the metric uses.
function setDistanceFromRouteKm(km) {
  const factor = oneWayCheckEl.checked ? 1 : 2;
  const metric = METRICS[metricSelect.value];
  const inUnits = metric.distanceUnit === 'mi'
    ? (km * factor) / KM_PER_MILE
    : (km * factor);
  suppressDistanceClear = true;
  distanceInput.value = Math.max(1, Math.round(inUnits));
  distanceInput.dispatchEvent(new Event('input'));
  suppressDistanceClear = false;
}

async function planRoute() {
  // Drop any empty stop rows before we evaluate — pressing Calculate is
  // commit intent, so stale empty rows shouldn't block the calculation.
  // Iterate backwards to safely splice, and keep at least one destination
  // so the UI never collapses to zero.
  for (let i = destinationInputs.length - 1; i >= 0; i--) {
    if (!destinationInputs[i].value.trim() && destinationInputs.length > 1) {
      const el = destinationInputs[i];
      destinationInputs.splice(i, 1);
      const field = el.closest('.route-field');
      if (field) field.remove();
    }
  }
  refreshRemoveButtons();

  const originText = routeOriginEl.value.trim();
  const destStates = destinationInputs.map(el => ({
    text:   el.value.trim(),
    coords: el._selectedCoords || null,
  }));
  if (!originText || destStates.some(d => !d.text)) return;

  routeButtonEl.disabled = true;
  routeStatusEl.classList.remove('is-error');
  routeStatusEl.textContent = t('route.calculating', 'Calculating…');

  try {
    const lang = (document.documentElement.lang || 'en').slice(0, 2);
    // Use cached Photon coords where available; Nominatim-geocode anything
    // that was typed but not picked from a suggestion.
    const oCoords = routeOriginEl._selectedCoords || await geocode(originText, lang);
    const dCoords = await Promise.all(destStates.map(d =>
      d.coords ? Promise.resolve(d.coords) : geocode(d.text, lang)
    ));

    // Build the locations Valhalla will route through. For a round trip
    // we go A → … → Z → … → A in a single multi-stop query (rather than
    // running a one-way query and doubling — which gets the wrong number
    // when one-way streets / different return roads are involved).
    const fwd       = [oCoords, ...dCoords];
    const oneWay    = oneWayCheckEl.checked;
    const locations = oneWay ? fwd : [...fwd, ...fwd.slice(0, -1).reverse()];

    const route = await valhallaRoute(locations);

    // `lastRouteKm` represents the one-way equivalent so the existing
    // toggle math (×1 / ×2) still works when the user flips the
    // checkbox without re-fetching.
    const oneWayKm = oneWay ? route.distanceKm : route.distanceKm / 2;
    lastRouteKm = oneWayKm;
    // Stash forward-direction coords for the OSM link (round trip is
    // derived on the fly from the current one-way state).
    lastRouteLocations = fwd.map(({ lat, lon }) => ({ lat, lon }));
    osmLinkVisible = true;
    setDistanceFromRouteKm(oneWayKm);
    refreshOsmLink();
    routeStatusEl.textContent = '';

    // Persist the inputs that drove this calculation so they can be
    // restored on next load (without re-running the route).
    saveRouteState();

    // Highway %: best-effort. Distance is already applied.
    try {
      const hwyFrac = await valhallaHighwayFraction(route.legShapes);
      if (hwyFrac !== null) {
        hwySlider.value = Math.round(hwyFrac * 100);
        hwySlider.dispatchEvent(new Event('input'));
      }
    } catch (traceErr) {
      console.warn('Highway breakdown unavailable:', traceErr);
    }
  } catch (err) {
    console.warn('Route planning failed:', err);
    routeStatusEl.classList.add('is-error');
    routeStatusEl.textContent = t('route.error', "Couldn't find that route");
  } finally {
    routeButtonEl.disabled = false;
  }
}

// ── Shareable URL ─────────────────────────────────
// Encode every user-settable input into URL query params so a
// calculation can be sent in chat etc. Saved cars are intentionally
// excluded (they're tied to a specific person's library, not a single
// shared calc). Round-trip: readUrlParams() pulls these out on init,
// init() merges them over loadPrefs() so URL wins, and any present
// values are persisted to localStorage so a refresh keeps the state.
function buildShareUrl() {
  const params = new URLSearchParams();

  if (regionSelect.value) params.set('region', regionSelect.value);
  if (metricSelect.value) params.set('metric', metricSelect.value);
  if (distanceInput.value)  params.set('dist',  distanceInput.value);
  if (hwySlider.value)      params.set('hwy',   hwySlider.value);
  if (effHwyInput.value)    params.set('mpg_h', effHwyInput.value);
  if (effCityInput.value)   params.set('mpg_c', effCityInput.value);
  if (gasPriceInput.value)     params.set('price',  gasPriceInput.value);
  if (dieselPriceInput.value)  params.set('priceD', dieselPriceInput.value);
  if (electricRateInput.value) params.set('priceE', electricRateInput.value);
  if (evEffHwyInput.value)     params.set('kwh_h',  evEffHwyInput.value);
  if (evEffCityInput.value)    params.set('kwh_c',  evEffCityInput.value);
  const modes = currentPriceModes();
  // Omit the param when only the default ('gas') is active — keeps the URL short.
  if (!(modes.length === 1 && modes[0] === 'gas')) {
    params.set('priceMode', modes.join(','));
  }
  if (oneWayCheckEl.checked) params.set('oneway', '1');

  const splitN = parseInt(loadPrefs().splitCustom, 10);
  if (splitN >= 2) params.set('split', String(splitN));

  const origin = routeOriginEl.value.trim();
  if (origin) params.set('o', origin);
  destinationInputs.forEach(el => {
    const text = el.value.trim();
    if (text) params.append('d', text);
  });

  // Sticky debug flag — re-emitted on every URL rewrite so it survives
  // the realtime replaceState updates triggered by user input.
  if (DEBUG_STALE) params.set('staleDebug', '1');

  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function readUrlParams() {
  const params = new URLSearchParams(location.search);
  if (![...params].length) return {};

  const out = {};
  if (params.has('region')) out.region   = params.get('region');
  if (params.has('metric')) out.metric   = params.get('metric');
  if (params.has('dist'))   out.distance = params.get('dist');
  if (params.has('hwy'))    out.hwyPct   = params.get('hwy');
  if (params.has('mpg_h'))  out.effHwy   = params.get('mpg_h');
  if (params.has('mpg_c'))  out.effCity  = params.get('mpg_c');
  if (params.has('price'))     out.gasPrice     = params.get('price');
  if (params.has('priceD'))    out.dieselPrice  = params.get('priceD');
  if (params.has('priceE'))    out.electricRate = params.get('priceE');
  if (params.has('kwh_h'))     out.evEffHwy     = params.get('kwh_h');
  if (params.has('kwh_c'))     out.evEffCity    = params.get('kwh_c');
  if (params.has('priceMode')) {
    const m = parsePriceModes(params.get('priceMode'));
    if (m.length) out.priceMode = m.join(',');
  }
  if (params.has('oneway')) out.oneWay   = params.get('oneway') === '1';
  if (params.has('split')) {
    const n = parseInt(params.get('split'), 10);
    if (n >= 2) out.splitCustom = n;
  }
  if (params.has('o')) out.routeOrigin = { text: params.get('o'), coords: null };
  if (params.has('d')) {
    out.routeDestinations = params.getAll('d').map(text => ({ text, coords: null }));
  }
  // The shared URL doesn't carry the cached route distance/coords from
  // the sender's session — they wouldn't match the recipient's route
  // texts anyway. Drop the local cache so the OSM link stays hidden
  // until the recipient runs Calculate themselves.
  if (params.has('dist') || params.has('o') || params.has('d')) {
    out.lastRouteKm = null;
    out.lastRouteLocations = null;
  }
  return out;
}

// Live URL sync — every user-initiated change rewrites the address bar
// to encode the new state. replaceState (not pushState) so back-button
// history isn't polluted with one entry per keystroke.
function updateShareUrl() {
  try { history.replaceState(null, '', buildShareUrl()); } catch {}
}

function openShareModal() {
  // Re-build the URL each open — anything could have changed since the
  // last open, including the URL bar itself (we replaceState on every
  // input).
  shareUrlEl.value = buildShareUrl();
  // navigator.share is mobile-mostly; only surface the button when
  // present so desktop doesn't get a non-functional control.
  shareNativeEl.hidden = typeof navigator.share !== 'function';
  resetShareCopyLabel();
  shareModalEl.showModal();
  // Pre-select the URL so a single Cmd/Ctrl-C works without clicking
  // Copy. Defer to next tick so the dialog's own focus management
  // (focus-trap on first tabbable) doesn't fight us.
  setTimeout(() => {
    shareUrlEl.focus();
    shareUrlEl.select();
  }, 0);
}

let shareCopiedTimeout = null;
async function copyShareUrl() {
  const url = shareUrlEl.value;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback for non-secure contexts: select + execCommand. The
    // textarea is already in the DOM and readonly so this is safe.
    shareUrlEl.focus();
    shareUrlEl.select();
    try { document.execCommand('copy'); } catch {}
  }
  flashShareCopied();
}

function flashShareCopied() {
  shareCopyEl.textContent = t('share.copied', 'Copied!');
  shareCopyEl.classList.add('share-action-copied');
  if (shareCopiedTimeout) clearTimeout(shareCopiedTimeout);
  shareCopiedTimeout = setTimeout(resetShareCopyLabel, 1800);
}

function resetShareCopyLabel() {
  if (shareCopiedTimeout) { clearTimeout(shareCopiedTimeout); shareCopiedTimeout = null; }
  shareCopyEl.textContent = t('share.copy', 'Copy link');
  shareCopyEl.classList.remove('share-action-copied');
}

async function nativeShare() {
  if (typeof navigator.share !== 'function') return;
  try {
    await navigator.share({ title: 'Mileage', url: shareUrlEl.value });
  } catch (err) {
    // User cancelled the OS sheet — leave the modal open so they can
    // copy instead.
    if (err && err.name === 'AbortError') return;
  }
}

// ── PWA install nudge ─────────────────────────────
// Most users don't know browsers have an install button. The browser
// fires `beforeinstallprompt` when it considers the page eligible —
// we stash that event, surface a discreet banner, and only fire the
// actual prompt when the user confirms via the modal. Once dismissed
// (any path: install, cancel, ×, or external install), we never
// surface the banner again.
let deferredInstallPrompt = null;

function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

function installNudgeDismissed() {
  return loadPrefs().pwaPromptDismissed === true;
}

function dismissInstallNudge() {
  savePrefs({ pwaPromptDismissed: true });
  installBannerEl.hidden = true;
}

window.addEventListener('beforeinstallprompt', e => {
  // Browser is suppressing its own native mini-infobar (which we don't
  // want anyway since we're showing our own banner). Stash the event;
  // calling .prompt() later opens the actual install dialog.
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!installNudgeDismissed() && !isInstalled()) {
    installBannerEl.hidden = false;
  }
});

// User installed via any path (our prompt OR the browser's menu) —
// suppress the banner permanently.
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  dismissInstallNudge();
});

function openInstallModal() {
  installModalEl.showModal();
}

async function confirmInstall() {
  installModalEl.close();
  if (!deferredInstallPrompt) {
    // Event was consumed already or never fired (rare but possible if
    // the browser revoked eligibility between banner-show and click).
    dismissInstallNudge();
    return;
  }
  try {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
  } catch (err) {
    console.warn('Install prompt failed:', err);
  } finally {
    // The event is single-use — null it whether or not the user
    // accepted, so a stale reference can't be re-prompted.
    deferredInstallPrompt = null;
    dismissInstallNudge();
  }
}

// ── Multi-stop destination inputs ─────────────────
function addDestination(initial) {
  const idx = destinationInputs.length;
  const inputId = `route-destination-${idx}`;

  const field = document.createElement('div');
  field.className = 'route-field';

  const label = document.createElement('label');
  label.setAttribute('for', inputId);
  const labelSpan = document.createElement('span');
  labelSpan.dataset.i18n = 'route.destination';
  labelSpan.textContent = t('route.destination', 'To');
  label.appendChild(labelSpan);

  const wrap = document.createElement('div');
  wrap.className = 'autocomplete-with-remove';

  const ac = document.createElement('div');
  ac.className = 'autocomplete';

  const input = document.createElement('input');
  input.id = inputId;
  input.type = 'text';
  input.className = 'route-input';
  input.autocomplete = 'off';
  input.placeholder = t('route.placeholder', 'City or Zip');
  input.dataset.i18nPlaceholder = 'route.placeholder';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', `${inputId}-list`);
  if (initial && initial.text) input.value = initial.text;
  if (initial && initial.coords) input._selectedCoords = initial.coords;

  const list = document.createElement('ul');
  list.className = 'autocomplete-list';
  list.id = `${inputId}-list`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  ac.appendChild(input);
  ac.appendChild(list);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'route-destination-remove';
  remove.textContent = '×';
  remove.setAttribute('aria-label', t('route.removeStop', 'Remove stop'));
  remove.addEventListener('click', () => removeDestination(input));

  wrap.appendChild(ac);
  wrap.appendChild(remove);
  field.appendChild(label);
  field.appendChild(wrap);
  routeDestsEl.appendChild(field);

  destinationInputs.push(input);
  attachAutocomplete(input, list);
  // Listeners that are wired once on the static origin input — for
  // dynamic destinations we attach the same behaviour per input.
  input.addEventListener('input', () => {
    updateOneWayDisabled();
    updateShareUrl();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); planRoute(); }
  });

  refreshRemoveButtons();
  updateOneWayDisabled();
}

function removeDestination(input) {
  const idx = destinationInputs.indexOf(input);
  if (idx === -1 || destinationInputs.length <= 1) return;
  destinationInputs.splice(idx, 1);
  // Walk up to .route-field and remove that whole row.
  const field = input.closest('.route-field');
  if (field) field.remove();
  refreshRemoveButtons();
  updateOneWayDisabled();
  saveRouteState();
  updateShareUrl();
}

function refreshRemoveButtons() {
  const show = destinationInputs.length > 1;
  destinationInputs.forEach(el => {
    const btn = el.parentElement.parentElement.querySelector('.route-destination-remove');
    if (btn) btn.hidden = !show;
  });
}

function saveRouteState() {
  const o = {
    text:   routeOriginEl.value.trim(),
    coords: routeOriginEl._selectedCoords
      ? { lat: routeOriginEl._selectedCoords.lat, lon: routeOriginEl._selectedCoords.lon }
      : null,
  };
  const d = destinationInputs.map(el => ({
    text:   el.value.trim(),
    coords: el._selectedCoords
      ? { lat: el._selectedCoords.lat, lon: el._selectedCoords.lon }
      : null,
  }));
  savePrefs({
    routeOrigin:        o,
    routeDestinations:  d,
    lastRouteKm:        lastRouteKm,
    lastRouteLocations: lastRouteLocations,
  });
}

// Show the "View route" link only when the distance came from a real
// calculation (lastRouteKm not null) AND we have coords to build the
// URL. Round trip is derived on the fly from the current one-way state
// so toggling the checkbox flips the URL.
//
// OSM's directions UI accepts multi-waypoint routes via the `route`
// param: semicolon-separated `lat,lon` pairs. Using the OSRM engine
// (fossgis_osrm_car) here — Valhalla on OSM doesn't reliably honour
// extra waypoints, but OSRM does. Our internal distance calculation
// still uses Valhalla; the two engines may compute marginally different
// shortest paths but the difference is negligible for cost purposes.
const OSM_DIRECTIONS_BASE = 'https://www.openstreetmap.org/directions';
function refreshOsmLink() {
  if (!osmLinkEl) return;
  if (!osmLinkVisible || lastRouteKm === null ||
      !Array.isArray(lastRouteLocations) || lastRouteLocations.length < 2) {
    osmLinkEl.hidden = true;
    return;
  }
  const fwd = lastRouteLocations;
  const oneWay = oneWayCheckEl.checked;
  const all = oneWay ? fwd : [...fwd, ...fwd.slice(0, -1).reverse()];
  const route = all.map(p => `${p.lat},${p.lon}`).join(';');
  osmLinkEl.href = `${OSM_DIRECTIONS_BASE}?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
  osmLinkEl.hidden = false;
}

// ═══════════════════════════════════════════════════
// CAR LOOKUP — FuelEconomy.gov (keyless, US-market data)
// Single input, four stages: year → make → model → trim.
// Each pick lands as a chip above the input. After trim is
// chosen we fetch the vehicle record and write its city /
// highway MPG into the existing efficiency inputs.
// ═══════════════════════════════════════════════════

const FE_BASE = 'https://www.fueleconomy.gov/ws/rest';

// Cached FE.gov menu responses; same year/make never re-fetches.
const feCache = { make: {}, model: {}, options: {} };

const carState = {
  stage: 'year',     // 'year' | 'make' | 'model' | 'options' | 'done'
  year:  null,
  make:  null,
  model: null,
  trim:  null,
  optionsId: null,
  list:   [],        // current stage's pickable items
  active: -1,        // keyboard-highlighted item in the dropdown
};

const CAR_FALLBACK = { year: 'Year', make: 'Make', model: 'Model', trim: 'Trim' };

async function feFetch(path) {
  const res = await fetch(`${FE_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`FuelEconomy HTTP ${res.status}`);
  return res.json();
}

// FE.gov menu endpoints return { menuItem: [...] } — but a single result
// arrives as an object, not an array. Normalise both shapes.
function feItems(json) {
  if (!json || !json.menuItem) return [];
  const arr = Array.isArray(json.menuItem) ? json.menuItem : [json.menuItem];
  return arr.map(m => ({ label: String(m.text), value: String(m.value) }));
}

async function feMakes(year) {
  if (feCache.make[year]) return feCache.make[year];
  return feCache.make[year] = feItems(await feFetch(`/vehicle/menu/make?year=${year}`));
}
async function feModels(year, make) {
  const k = `${year}|${make}`;
  if (feCache.model[k]) return feCache.model[k];
  return feCache.model[k] = feItems(
    await feFetch(`/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`));
}
async function feOptions(year, make, model) {
  const k = `${year}|${make}|${model}`;
  if (feCache.options[k]) return feCache.options[k];
  return feCache.options[k] = feItems(
    await feFetch(`/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`));
}
async function feVehicle(id) {
  const json = await feFetch(`/vehicle/${id}`);
  // FE.gov reports passenger volume in three slots split by body style
  // (`pv4` for sedans, `pv2` for coupes, `hpv` for hatchbacks). Only one
  // is populated per vehicle, so the max collapses them into a single
  // number (cu. ft.). Zero means "no data" — older or non-passenger
  // vehicles sometimes return all zeros.
  const pv = Math.max(+json.pv4 || 0, +json.pv2 || 0, +json.hpv || 0);
  // EV efficiency in kWh/100mi — populated for full EVs and PHEVs.
  // city08/highway08 are blank/zero for pure EVs (no gallons-per-mile),
  // but the conversion fallback inside the regular MPG path returns NaN
  // gracefully so that's fine.
  return {
    city:            parseFloat(json.city08),
    hwy:             parseFloat(json.highway08),
    kwhCity:         parseFloat(json.cityE)    || null,
    kwhHwy:          parseFloat(json.highwayE) || null,
    fuelType1:       json.fuelType1 || '',
    passengerVolume: pv || null,
  };
}

function renderCarChips() {
  const parts = [carState.year, carState.make, carState.model, carState.trim].filter(Boolean);
  carChipsEl.innerHTML = '';
  // Once the lookup is complete the chosen car shows up as a pill in the
  // saved-cars row, so the breadcrumb here would be redundant. Keep the
  // chips during the in-progress stages where they double as
  // navigate-back buttons.
  if (carState.stage !== 'done') {
    parts.forEach((p, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'car-chip-sep';
        sep.textContent = '›'; // ›
        carChipsEl.appendChild(sep);
      }
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'car-chip';
      chip.textContent = p;
      chip.title = `${t('car.clear', 'Clear')} – ${p}`;
      chip.addEventListener('click', () => removeFromChip(i));
      carChipsEl.appendChild(chip);
    });
  }
  carClearEl.hidden = parts.length === 0;
}

// Click a chip → drop it and every chip to its right, then resume from the
// stage that produced it. Index 0 is year; that's a full reset.
async function removeFromChip(idx) {
  if (idx <= 0) {
    resetCarLookup();
    carInputEl.focus();
    return;
  }
  if (idx <= 1) carState.make  = null;
  if (idx <= 2) carState.model = null;
  if (idx <= 3) { carState.trim = null; carState.optionsId = null; }
  const targetStage = ['year', 'make', 'model', 'options'][idx];
  // skipAutoPick: the trim auto-picks when there's only one option, but on
  // re-entry from a chip click that would just re-pick the same trim.
  await advanceCarTo(targetStage, { skipAutoPick: true });
  carInputEl.focus();
}

function setCarPlaceholder() {
  if (!carInputEl) return;
  // In `done`, the input still accepts typing — that starts a fresh lookup.
  // Show the year placeholder there so the affordance is obvious.
  const stageKey = carState.stage === 'options' ? 'trim' :
                   carState.stage === 'done'    ? 'year' :
                   carState.stage;
  carInputEl.placeholder = t(`car.${stageKey}`, CAR_FALLBACK[stageKey] || '');
}

function setCarStatus(msg, isError) {
  carStatusEl.textContent = msg || '';
  carStatusEl.classList.toggle('is-error', !!isError);
}

function showCarList() {
  carListEl.hidden = false;
  carInputEl.setAttribute('aria-expanded', 'true');
}

function hideCarList() {
  carListEl.hidden = true;
  carInputEl.setAttribute('aria-expanded', 'false');
  carState.active = -1;
  carInputEl.removeAttribute('aria-activedescendant');
}

function renderCarList(items) {
  while (carListEl.firstChild) carListEl.removeChild(carListEl.firstChild);
  if (!items.length) {
    // FE.gov is US-only and only covers vehicles that submitted economy
    // testing — non-US makes (Peugeot, Dacia, Lada, …) and many older /
    // niche vehicles never appear. Offer to add a custom vehicle instead.
    const empty = document.createElement('li');
    empty.className = 'autocomplete-empty';
    const msg = document.createElement('em');
    msg.className = 'autocomplete-empty-msg';
    msg.textContent = t(
      'car.noResults',
      'Data is only available for vehicles that report fuel economy testing to the EPA.'
    );
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'autocomplete-empty-action';
    btn.textContent = t('car.addCustom', 'Add your own vehicle');
    // mousedown blur-prevention so clicking the button doesn't blur the
    // input first (which would re-render and remove the button before
    // the click registers).
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => openCustomVehicleModal(carInputEl.value.trim()));
    empty.appendChild(msg);
    empty.appendChild(btn);
    carListEl.appendChild(empty);
    showCarList();
    return;
  }
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'autocomplete-item';
    li.textContent = item.label;
    li.setAttribute('role', 'option');
    li.id = `car-list-item-${i}`;
    li.dataset.value = item.value;
    li.addEventListener('mousedown', e => { e.preventDefault(); pickCarItem(item); });
    li.addEventListener('mouseenter', () => { carState.active = i; paintCarActive(); });
    carListEl.appendChild(li);
  });
  showCarList();
}

function paintCarActive() {
  const items = carListEl.querySelectorAll('.autocomplete-item');
  items.forEach((it, i) => {
    const on = i === carState.active;
    it.classList.toggle('is-active', on);
    it.setAttribute('aria-selected', on);
  });
  if (carState.active >= 0) {
    carInputEl.setAttribute('aria-activedescendant', items[carState.active].id);
    items[carState.active].scrollIntoView({ block: 'nearest' });
  } else {
    carInputEl.removeAttribute('aria-activedescendant');
  }
}

function filterCarList() {
  const q = carInputEl.value.trim().toLowerCase();
  const list = q
    ? carState.list.filter(i => i.label.toLowerCase().includes(q))
    : carState.list;
  carState.active = -1;
  renderCarList(list);
}

async function advanceCarTo(stage, opts = {}) {
  carState.stage = stage;
  carInputEl.value = '';
  carState.list = [];
  hideCarList();
  setCarPlaceholder();
  renderCarChips();

  if (stage === 'make' || stage === 'model' || stage === 'options') {
    setCarStatus('…');
    try {
      let list;
      if (stage === 'make')    list = await feMakes(carState.year);
      if (stage === 'model')   list = await feModels(carState.year, carState.make);
      if (stage === 'options') list = await feOptions(carState.year, carState.make, carState.model);
      carState.list = list;
      setCarStatus('');
      // Auto-pick when a trim list has just one option — but skip when the
      // user re-entered the stage by clicking a chip (otherwise we'd
      // immediately re-pick the same trim and "reset" wouldn't feel like one).
      if (stage === 'options' && list.length === 1 && !opts.skipAutoPick) {
        await pickCarItem(list[0]);
        return;
      }
      renderCarList(list);
    } catch (err) {
      console.warn('FuelEconomy.gov fetch failed:', err);
      setCarStatus(t('car.error', "Couldn't find that car"), true);
    }
  } else if (stage === 'done') {
    setCarStatus('…');
    // Show a placeholder pill immediately so the user gets feedback while
    // the FE.gov vehicle fetch runs (can take a couple of seconds).
    pendingSavedCar = true;
    renderSavedCars();
    try {
      const v = await feVehicle(carState.optionsId);
      // Pure EVs report city08/highway08 as MPGe (positive), so the
      // existing check still passes. We do require *something* useful:
      // either MPG/MPGe pair or kWh pair.
      const hasLiquid = v.city > 0 && v.hwy > 0;
      const hasKwh    = v.kwhCity > 0 && v.kwhHwy > 0;
      if (!hasLiquid && !hasKwh) throw new Error('No efficiency data');
      // Save first so the input listener (fired by applyMpgFromVehicle)
      // sees the new entry when it re-renders the saved-cars row.
      saveSavedCar({
        id:              carState.optionsId,
        year:            carState.year,
        make:            carState.make,
        model:           carState.model,
        trim:            carState.trim,
        city:            v.city,
        hwy:             v.hwy,
        kwhCity:         v.kwhCity,
        kwhHwy:          v.kwhHwy,
        fuelType1:       v.fuelType1,
        passengerVolume: v.passengerVolume,
      });
      // Clear the placeholder flag *before* applyMpgFromVehicle's
      // dispatched input events trigger a re-render, otherwise the
      // placeholder would briefly sit alongside the real new car.
      pendingSavedCar = false;
      applyMpgFromVehicle(v);
      setCarStatus('');
    } catch (err) {
      pendingSavedCar = false;
      renderSavedCars();
      console.warn('FuelEconomy.gov vehicle fetch failed:', err);
      setCarStatus(t('car.error', "Couldn't find that car"), true);
    }
  }
}

async function pickCarItem(item) {
  if (carState.stage === 'make') {
    carState.make = item.label;
    await advanceCarTo('model');
  } else if (carState.stage === 'model') {
    carState.model = item.label;
    await advanceCarTo('options');
  } else if (carState.stage === 'options') {
    carState.trim = item.label;
    carState.optionsId = item.value;
    await advanceCarTo('done');
  }
}

function applyMpgFromVehicle(v) {
  // FE.gov reports MPG (US gallons) for liquid fuels and MPGe for EVs in
  // the same city08/highway08 fields. Writing MPGe into the MPG inputs
  // would silently overwrite the user's real liquid-fuel car efficiency
  // when they click an EV saved-car pill — skip the MPG write for
  // pure-electric vehicles. PHEVs (category 'other') keep both writes
  // since their city08/highway08 is genuine gasoline MPG.
  const cur = METRICS[metricSelect.value];
  const distanceUnit = cur.distanceUnit;
  const fuel = fuelCategory(v.fuelType1);
  // Ensure the picked car's fuel mode is active so its values are
  // visible in the UI and considered by the highlight/cost logic. PHEVs
  // (category 'other') default to gas — matches the cost-comparison
  // fallback. Additive: never removes existing modes.
  const requiredMode = fuel === 'electric' ? 'electric'
                     : fuel === 'diesel'   ? 'diesel'
                     : 'gas';
  const modes = currentPriceModes();
  if (!modes.includes(requiredMode)) {
    applyPriceModes([...modes, requiredMode], { save: true });
  }
  if (v.city > 0 && v.hwy > 0 && fuel !== 'electric') {
    const cityVal = +cur.fromLitresPerKm(METRICS.mpg_us.toLitresPerKm(v.city)).toFixed(1);
    const hwyVal  = +cur.fromLitresPerKm(METRICS.mpg_us.toLitresPerKm(v.hwy)).toFixed(1);
    effHwyInput.value  = hwyVal;
    effCityInput.value = cityVal;
  }
  // EV efficiency, when present (true EVs and PHEVs). Stored in
  // kWh/100mi; converted to display unit before painting.
  if (v.kwhCity > 0 && v.kwhHwy > 0) {
    evEffHwyInput.value  = kwhPer100MiToDisplay(v.kwhHwy,  distanceUnit);
    evEffCityInput.value = kwhPer100MiToDisplay(v.kwhCity, distanceUnit);
  }
  // Run the downstream effects directly *once* instead of dispatching
  // `input` on both inputs — that would fire the listener twice, doing
  // two reflow-forcing calculate()s, two localStorage writes, and two
  // full saved-cars DOM rebuilds. Visibly laggy when switching saved
  // cars on a mobile device.
  calculate();
  savePrefs({
    effHwy:    effHwyInput.value,
    effCity:   effCityInput.value,
    evEffHwy:  evEffHwyInput.value,
    evEffCity: evEffCityInput.value,
  });
  renderSavedCars();
  updateShareUrl();
}

// ── Saved cars ────────────────────────────────────
// Each saved car: { id, year, make, model, trim, city, hwy }. city/hwy
// are stored in MPG (US) — the unit FE.gov ships — so matching against
// the current display values is just a unit conversion + tolerance check.
const SAVED_CAR_LIMIT = 10;

// While the FE.gov vehicle fetch is in flight (after the user picks a trim,
// before MPG comes back), we render a placeholder pill at the head of the
// saved-cars row so the user sees immediate feedback.
let pendingSavedCar = false;

function getSavedCars() {
  return loadPrefs().savedCars || [];
}

function saveSavedCar(car) {
  // De-dupe by FE.gov vehicle id; newest first; cap at the limit.
  const cars = getSavedCars().filter(c => c.id !== car.id);
  cars.unshift(car);
  savePrefs({ savedCars: cars.slice(0, SAVED_CAR_LIMIT) });
}

function removeSavedCar(id) {
  savePrefs({ savedCars: getSavedCars().filter(c => c.id !== id) });
  renderSavedCars();
}

// Returns saved cars whose MPGs match the current Highway/City inputs.
// Each saved car's MPG-US is converted into the active display metric and
// rounded to the same 1-decimal precision the inputs already use, so we're
// comparing apples to apples — two cars whose MPGs differ by 1 (a common
// adjacent-year situation) won't both light up. The 0.05 epsilon is purely
// float-comparison hygiene around equal rounded values.
function matchingSavedCars() {
  const cars = getSavedCars();
  if (!cars.length) return [];
  const cityVal     = parseFloat(effCityInput.value);
  const hwyVal      = parseFloat(effHwyInput.value);
  const evCityVal   = parseFloat(evEffCityInput.value);
  const evHwyVal    = parseFloat(evEffHwyInput.value);
  const hasLiquidIn = cityVal > 0 && hwyVal > 0;
  const hasKwhIn    = evCityVal > 0 && evHwyVal > 0;
  if (!hasLiquidIn && !hasKwhIn) return [];
  const cur = METRICS[metricSelect.value];
  const distanceUnit = cur.distanceUnit;
  const toDisplayMpg = mpgUs =>
    +cur.fromLitresPerKm(METRICS.mpg_us.toLitresPerKm(mpgUs)).toFixed(1);
  const EPS = 0.05;
  // Pure EVs store MPGe in city/hwy — those don't correspond to the user's
  // MPG input, so only their kWh axis is comparable. PHEVs (category
  // 'other') have real MPG and real kWh; both must match. Liquid-only
  // cars have no kWh data; only MPG matters. Each axis is also gated
  // on the matching price mode being active: a diesel car's stored MPG
  // is per *diesel* gallon, so it isn't comparable to a gas-MPG input —
  // require 'diesel' mode for a diesel car to be eligible (and 'gas'
  // for gas/PHEV, 'electric' for kWh).
  const modes = currentPriceModes();
  return cars.filter(c => {
    const fuel = fuelCategory(c.fuelType1);
    const liquidModeActive = fuel === 'diesel'
      ? modes.includes('diesel')
      : modes.includes('gas');
    const carHasMpg = c.city > 0 && c.hwy > 0 && fuel !== 'electric' && liquidModeActive;
    const carHasKwh = c.kwhCity > 0 && c.kwhHwy > 0 && modes.includes('electric');
    if (!carHasMpg && !carHasKwh) return false;
    if (carHasMpg) {
      if (!hasLiquidIn) return false;
      if (Math.abs(toDisplayMpg(c.city) - cityVal) >= EPS) return false;
      if (Math.abs(toDisplayMpg(c.hwy)  - hwyVal)  >= EPS) return false;
    }
    if (carHasKwh) {
      if (!hasKwhIn) return false;
      const carKwhCity = kwhPer100MiToDisplay(c.kwhCity, distanceUnit);
      const carKwhHwy  = kwhPer100MiToDisplay(c.kwhHwy,  distanceUnit);
      if (Math.abs(carKwhCity - evCityVal) >= EPS) return false;
      if (Math.abs(carKwhHwy  - evHwyVal)  >= EPS) return false;
    }
    return true;
  });
}

function renderSavedCars() {
  if (!savedCarsEl) return;
  const cars = getSavedCars();
  savedCarsEl.innerHTML = '';
  const hasContent = pendingSavedCar || cars.length > 0;
  savedCarsEl.hidden = !hasContent;
  if (!hasContent) return;

  if (pendingSavedCar) {
    const wrap = document.createElement('span');
    wrap.className = 'saved-car saved-car-pending';
    wrap.setAttribute('aria-busy', 'true');
    const inner = document.createElement('span');
    inner.className = 'saved-car-pending-inner';
    const spin = document.createElement('span');
    spin.className = 'saved-car-spinner';
    spin.setAttribute('aria-hidden', 'true');
    inner.appendChild(spin);
    wrap.appendChild(inner);
    savedCarsEl.appendChild(wrap);
  }

  const matching = new Set(matchingSavedCars().map(c => c.id));
  cars.forEach(car => {
    const fuel = fuelCategory(car.fuelType1);
    const wrap = document.createElement('span');
    wrap.className = 'saved-car is-fuel-' + fuel;
    if (matching.has(car.id)) wrap.classList.add('is-active');

    // Visual hint that we're using gas-price as a fallback for a vehicle
    // whose fuel type isn't gas or diesel (EVs, hybrids, alt-fuel, or
    // older saves with no fuelType1 stored).
    if (fuel === 'other') {
      const warn = document.createElement('span');
      warn.className = 'saved-car-fuel-warn';
      warn.textContent = '⚠';
      warn.setAttribute('aria-hidden', 'true');
      warn.title = t('fuel.otherHint', 'Not gas or diesel — using gas price as a fallback');
      wrap.appendChild(warn);
    }

    const labelParts = [car.year, car.make, car.model].filter(v => v != null && v !== '');
    const label = labelParts.join(' ');
    const titleParts = [...labelParts, car.trim].filter(v => v != null && v !== '');
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'saved-car-pick';
    pick.textContent = label;
    pick.title = titleParts.join(' ');
    pick.addEventListener('click', () => applySavedCar(car));

    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'saved-car-remove';
    rm.textContent = '×';
    rm.setAttribute('aria-label', `${t('car.remove', 'Remove')} – ${label}`);
    rm.addEventListener('click', e => {
      e.stopPropagation();
      removeSavedCar(car.id);
    });

    wrap.appendChild(pick);
    wrap.appendChild(rm);
    savedCarsEl.appendChild(wrap);
  });
  // Saved-cars list may have just changed; the comparison row's
  // visibility (>=2 cars) and per-car costs need to track that.
  renderCostComparison();
}

// Apply a saved car as if the user had just walked through the lookup.
function applySavedCar(car) {
  carState.stage     = 'done';
  carState.year      = car.year;
  carState.make      = car.make;
  carState.model     = car.model;
  carState.trim      = car.trim;
  carState.optionsId = car.id;
  carState.list      = [];
  carState.active    = -1;
  carInputEl.value    = '';
  hideCarList();
  setCarPlaceholder();
  setCarStatus('');
  renderCarChips();
  applyMpgFromVehicle({
    city:      car.city,
    hwy:       car.hwy,
    kwhCity:   car.kwhCity,
    kwhHwy:    car.kwhHwy,
    fuelType1: car.fuelType1,
  });
}

// ── Custom vehicle modal ──────────────────────────
function getCustomFuelType() {
  const checked = customVehicleFormEl.querySelector('input[name="custom-fuel"]:checked');
  return checked ? checked.value : 'gas';
}

function updateCustomEffVisibility() {
  const fuel = getCustomFuelType();
  customVehicleFormEl.querySelector('.custom-eff-liquid').hidden   = fuel === 'electric';
  customVehicleFormEl.querySelector('.custom-eff-electric').hidden = fuel !== 'electric';
}

// Mirror the active-metric units into the modal so the user types in the
// same MPG/L-per-100km/kWh-per-100km unit they see everywhere else.
function syncCustomVehicleUnits() {
  const liquidLabel = effUnitHwy.textContent;
  const evLabel     = evUnitHwy.textContent;
  document.getElementById('custom-mpg-unit-hwy').textContent  = liquidLabel;
  document.getElementById('custom-mpg-unit-city').textContent = liquidLabel;
  document.getElementById('custom-kwh-unit-hwy').textContent  = evLabel;
  document.getElementById('custom-kwh-unit-city').textContent = evLabel;
}

function openCustomVehicleModal(prefill) {
  customVehicleFormEl.reset();
  customVehicleNameEl.value = prefill || '';
  syncCustomVehicleUnits();
  updateCustomEffVisibility();
  if (typeof customVehicleModalEl.showModal === 'function') {
    customVehicleModalEl.showModal();
  } else {
    customVehicleModalEl.setAttribute('open', '');
  }
  customVehicleNameEl.focus();
  customVehicleNameEl.select();
}

function closeCustomVehicleModal() {
  if (typeof customVehicleModalEl.close === 'function') {
    customVehicleModalEl.close();
  } else {
    customVehicleModalEl.removeAttribute('open');
  }
}

function submitCustomVehicle(e) {
  e.preventDefault();
  const name = customVehicleNameEl.value.trim();
  if (!name) { customVehicleNameEl.focus(); return; }
  const fuel = getCustomFuelType();
  const cur  = METRICS[metricSelect.value];
  const distanceUnit = cur.distanceUnit;

  const car = {
    id:              `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    year:            null,
    make:            '',
    model:           name,
    trim:            null,
    city:            null,
    hwy:             null,
    kwhCity:         null,
    kwhHwy:          null,
    fuelType1:       fuel === 'diesel'   ? 'Diesel'
                   : fuel === 'electric' ? 'Electricity'
                                         : 'Regular Gasoline',
    passengerVolume: null,
  };

  if (fuel === 'electric') {
    const kwhHwy  = parseFloat(document.getElementById('custom-vehicle-kwh-hwy').value);
    const kwhCity = parseFloat(document.getElementById('custom-vehicle-kwh-city').value);
    if (!(kwhHwy > 0) || !(kwhCity > 0)) {
      document.getElementById('custom-vehicle-kwh-hwy').focus();
      return;
    }
    car.kwhHwy  = displayToKwhPer100Mi(kwhHwy,  distanceUnit);
    car.kwhCity = displayToKwhPer100Mi(kwhCity, distanceUnit);
  } else {
    const effHwy  = parseFloat(document.getElementById('custom-vehicle-mpg-hwy').value);
    const effCity = parseFloat(document.getElementById('custom-vehicle-mpg-city').value);
    if (!(effHwy > 0) || !(effCity > 0)) {
      document.getElementById('custom-vehicle-mpg-hwy').focus();
      return;
    }
    // Canonicalise the user's displayed-metric value to MPG-US (matches
    // FE.gov's stored shape, lets the rest of the codebase stay metric-
    // agnostic).
    car.hwy  = METRICS.mpg_us.fromLitresPerKm(cur.toLitresPerKm(effHwy));
    car.city = METRICS.mpg_us.fromLitresPerKm(cur.toLitresPerKm(effCity));
  }

  saveSavedCar(car);
  closeCustomVehicleModal();
  resetCarLookup();
  applyMpgFromVehicle(car);
}

// Reset everything except the input value — used when the user is mid-typing
// in `done` state and we want to interpret what they typed as the start of
// a new lookup.
function softResetCarLookup() {
  carState.stage     = 'year';
  carState.year      = null;
  carState.make      = null;
  carState.model     = null;
  carState.trim      = null;
  carState.optionsId = null;
  carState.list      = [];
  carState.active    = -1;
  hideCarList();
  setCarPlaceholder();
  setCarStatus('');
  renderCarChips();
}

function resetCarLookup() {
  softResetCarLookup();
  carInputEl.value = '';
}

// ═══════════════════════════════════════════════════
// REGION CHANGE
// ═══════════════════════════════════════════════════

async function onRegionChange(saveAfter = true) {
  const regionKey = regionSelect.value;
  const region    = REGIONS[regionKey];
  const prefs     = loadPrefs();

  // Fetch language strings and a random title (English skips the fetch)
  const [strings, titles] = await Promise.all([
    loadLanguage(region.lang),
    loadTitles(region.lang),
  ]);
  applyTranslations(strings);
  applyRandomTitle(titles);
  document.documentElement.lang = region.lang;

  // Set default metric
  metricSelect.value = region.defaultMetric;
  applyMetricUI(region.defaultMetric, region);

  const metric = METRICS[region.defaultMetric];
  effHwyInput.placeholder  = metric.defaultHwy;
  effCityInput.placeholder = metric.defaultCity;

  // Only reset values when switching to a new region
  const regionChanged = prefs.region !== regionKey;
  if (regionChanged) {
    effHwyInput.value       = metric.defaultHwy;
    effCityInput.value      = metric.defaultCity;
    gasPriceInput.value     = region.defaultGasPrice;
    dieselPriceInput.value  = region.defaultDieselPrice ?? region.defaultGasPrice;
    electricRateInput.value = region.defaultElectricRate ?? 0.18;
  }
  // Re-pad to the new region's currency precision regardless — both for
  // the just-loaded defaults and for previously-typed values whose
  // currency may have just changed.
  formatPriceInputs(region.currency);

  updateSliderDisplay();
  calculate();
  renderSavedCars();

  if (saveAfter) {
    const patch = {
      region:       regionKey,
      metric:       region.defaultMetric,
      effHwy:       effHwyInput.value,
      effCity:      effCityInput.value,
      gasPrice:     gasPriceInput.value,
      dieselPrice:  dieselPriceInput.value,
      electricRate: electricRateInput.value,
    };
    // Region switch reset all three prices to the new defaults → fresh
    // values for staleness purposes, so reset all three timers.
    if (regionChanged) {
      patch.gasPriceUpdatedAt     = Date.now();
      patch.dieselPriceUpdatedAt  = Date.now();
      patch.electricRateUpdatedAt = Date.now();
    }
    savePrefs(patch);
  }
  refreshStalePrompt();
  if (saveAfter) updateShareUrl();
}

// ═══════════════════════════════════════════════════
// METRIC CHANGE
// ═══════════════════════════════════════════════════

function onMetricChange() {
  const region    = REGIONS[regionSelect.value];
  const oldMetric = METRICS[loadPrefs().metric || region.defaultMetric];
  const newMetric = METRICS[metricSelect.value];

  [
    [effHwyInput,  oldMetric, newMetric],
    [effCityInput, oldMetric, newMetric],
  ].forEach(([input, old, nw]) => {
    const val = parseFloat(input.value);
    input.value = isNaN(val) || val <= 0
      ? nw.defaultHwy
      : +nw.fromLitresPerKm(old.toLitresPerKm(val)).toFixed(1);
  });

  // EV efficiency switches between kWh/100mi and kWh/100km only when
  // the distance unit changes (mpg ↔ l/100km). Skip the conversion
  // when both old and new are the same unit (e.g. mpg_us ↔ mpg_uk).
  if (oldMetric.distanceUnit !== newMetric.distanceUnit) {
    [evEffHwyInput, evEffCityInput].forEach(input => {
      const val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) return;
      const canonical = displayToKwhPer100Mi(val, oldMetric.distanceUnit);
      input.value = kwhPer100MiToDisplay(canonical, newMetric.distanceUnit);
    });
  }

  effHwyInput.placeholder  = newMetric.defaultHwy;
  effCityInput.placeholder = newMetric.defaultCity;

  applyMetricUI(metricSelect.value, region);
  calculate();
  savePrefs({
    metric:    metricSelect.value,
    effHwy:    effHwyInput.value,
    effCity:   effCityInput.value,
    evEffHwy:  evEffHwyInput.value,
    evEffCity: evEffCityInput.value,
  });
  renderSavedCars();
  updateShareUrl();
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

async function init() {
  // URL params override saved prefs — handles shared/deep-linked URLs.
  // Persist the URL state immediately so a refresh keeps the same view,
  // then clean the address bar so the params don't go stale as the user
  // makes changes.
  const urlParams = readUrlParams();
  if (Object.keys(urlParams).length > 0) {
    savePrefs(urlParams);
    // Strip the share params now so they don't go stale as the user
    // edits — but keep `staleDebug` if it was set, so it survives the
    // async language-load gap before updateShareUrl() re-emits it.
    const cleanUrl = location.pathname + (DEBUG_STALE ? '?staleDebug=1' : '');
    try { history.replaceState(null, '', cleanUrl); } catch {}
  }
  const prefs     = { ...loadPrefs(), ...urlParams };
  const regionKey = prefs.region && REGIONS[prefs.region] ? prefs.region : 'us';
  const region    = REGIONS[regionKey];
  const metricKey = prefs.metric && METRICS[prefs.metric] ? prefs.metric : region.defaultMetric;
  const metric    = METRICS[metricKey];

  regionSelect.value = regionKey;
  metricSelect.value = metricKey;

  effHwyInput.value       = prefs.effHwy   ?? metric.defaultHwy;
  effCityInput.value      = prefs.effCity  ?? metric.defaultCity;
  gasPriceInput.value     = prefs.gasPrice ?? region.defaultGasPrice;
  // Diesel default: if the user has a saved gas price but no diesel,
  // scale the region's default-diesel by their gas/region ratio so the
  // diesel default tracks how far above/below the region average their
  // gas price is. Falls back to the region's default-diesel when no
  // gas is saved either.
  const dieselDefault = (() => {
    if (prefs.gasPrice && region.defaultGasPrice && region.defaultDieselPrice) {
      const userGas = parseFloat(prefs.gasPrice);
      if (userGas > 0) {
        return +(region.defaultDieselPrice * (userGas / region.defaultGasPrice)).toFixed(2);
      }
    }
    return region.defaultDieselPrice ?? region.defaultGasPrice;
  })();
  dieselPriceInput.value  = prefs.dieselPrice ?? dieselDefault;
  electricRateInput.value = prefs.electricRate ?? region.defaultElectricRate ?? 0.18;
  formatPriceInputs(region.currency);
  // EV efficiency defaults: ~28 kWh/100mi hwy, ~32 kWh/100mi city
  // (typical mid-size EV). Stored values are already in display units
  // (kWh/100mi or kWh/100km); on metric change we convert as needed.
  const evDefaultHwy  = kwhPer100MiToDisplay(28, metric.distanceUnit);
  const evDefaultCity = kwhPer100MiToDisplay(32, metric.distanceUnit);
  evEffHwyInput.value     = prefs.evEffHwy  ?? evDefaultHwy;
  evEffCityInput.value    = prefs.evEffCity ?? evDefaultCity;
  distanceInput.value     = prefs.distance ?? '';
  hwySlider.value         = prefs.hwyPct   ?? 60;
  oneWayCheckEl.checked   = prefs.oneWay === true;
  applyPriceModes(prefs.priceMode);

  // Migration: users who saved a gas price before this feature shipped
  // have no `gasPriceUpdatedAt`. Stamp it as "now" so they get the full
  // 30-day grace period before being nagged, rather than seeing the
  // prompt immediately on first load after the update.
  if (prefs.gasPrice && typeof prefs.gasPriceUpdatedAt !== 'number') {
    savePrefs({ gasPriceUpdatedAt: Date.now() });
  }
  if (prefs.dieselPrice && typeof prefs.dieselPriceUpdatedAt !== 'number') {
    savePrefs({ dieselPriceUpdatedAt: Date.now() });
  }
  if (prefs.electricRate && typeof prefs.electricRateUpdatedAt !== 'number') {
    savePrefs({ electricRateUpdatedAt: Date.now() });
  }

  // Restore the inputs of the last calculated route, but DON'T re-fetch
  // the distance — the saved `prefs.distance` is already in the input.
  // `lastRouteKm` is restored so the one-way toggle math works without
  // needing a fresh Calculate.
  if (prefs.routeOrigin) {
    routeOriginEl.value = prefs.routeOrigin.text || '';
    if (prefs.routeOrigin.coords) routeOriginEl._selectedCoords = prefs.routeOrigin.coords;
  }
  if (prefs.routeDestinations && prefs.routeDestinations.length > 0) {
    prefs.routeDestinations.forEach(d => addDestination(d));
  } else {
    addDestination();
  }
  if (typeof prefs.lastRouteKm === 'number') lastRouteKm = prefs.lastRouteKm;
  if (Array.isArray(prefs.lastRouteLocations)) lastRouteLocations = prefs.lastRouteLocations;
  refreshOsmLink();

  effHwyInput.placeholder  = metric.defaultHwy;
  effCityInput.placeholder = metric.defaultCity;

  // Fetch language strings, a random title, and model-name aliases
  // (English skips the language fetch; alias load is best-effort).
  const [strings, titles] = await Promise.all([
    loadLanguage(region.lang),
    loadTitles(region.lang),
    loadModelAliases(),
  ]);
  applyTranslations(strings);
  applyRandomTitle(titles);
  document.documentElement.lang = region.lang;

  applyMetricUI(metricKey, region);
  updateSliderDisplay();
  calculate();
  renderSavedCars();
  refreshStalePrompt();
  updateShareUrl();
  distanceInput.focus();
}

// ═══════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════

regionSelect.addEventListener('change', () => onRegionChange(true));
metricSelect.addEventListener('change', onMetricChange);

hwySlider.addEventListener('input', () => {
  updateSliderDisplay();
  calculate();
  savePrefs({ hwyPct: hwySlider.value });
  updateShareUrl();
});

distanceInput.addEventListener('input', () => {
  // User typed manually → drop the cached one-way km so the checkbox can't
  // overwrite their entry. (Programmatic updates from setDistanceFromRouteKm
  // set the suppress flag while dispatching.) Also clear it from
  // localStorage so a reload doesn't restore a stale value, and hide the
  // "View on map" link since the distance is no longer calc-derived.
  const patch = { distance: distanceInput.value };
  if (!suppressDistanceClear) {
    lastRouteKm = null;
    patch.lastRouteKm = null;
    osmLinkVisible = false;
    refreshOsmLink();
  }
  calculate();
  savePrefs(patch);
  updateShareUrl();
});

oneWayCheckEl.addEventListener('change', () => {
  savePrefs({ oneWay: oneWayCheckEl.checked });
  if (lastRouteKm !== null) setDistanceFromRouteKm(lastRouteKm);
  // The OSM URL embeds the round-trip path, so flipping one-way flips
  // the link too.
  refreshOsmLink();
  updateShareUrl();
});

[effHwyInput, effCityInput].forEach(el => {
  el.addEventListener('input', () => {
    calculate();
    savePrefs({ effHwy: effHwyInput.value, effCity: effCityInput.value });
    renderSavedCars();
    updateShareUrl();
  });
});

gasPriceInput.addEventListener('input', () => {
  calculate();
  savePrefs({ gasPrice: gasPriceInput.value, gasPriceUpdatedAt: Date.now() });
  refreshStalePrompt();
  renderSavedCars();
  updateShareUrl();
});

dieselPriceInput.addEventListener('input', () => {
  calculate();
  savePrefs({ dieselPrice: dieselPriceInput.value, dieselPriceUpdatedAt: Date.now() });
  refreshStalePrompt();
  renderSavedCars();
  updateShareUrl();
});

electricRateInput.addEventListener('input', () => {
  calculate();
  savePrefs({ electricRate: electricRateInput.value, electricRateUpdatedAt: Date.now() });
  refreshStalePrompt();
  renderSavedCars();
  updateShareUrl();
});

// Pad displayed price values to the region's currency precision when the
// user finishes editing (blur / Enter). The 'input' listeners above
// already saved every keystroke; here we sync the displayed + saved
// value to the padded form (e.g. "4.2" → "4.20" for USD).
function formatPriceInputs(currency) {
  if (!currency) return;
  if (gasPriceInput.value)     gasPriceInput.value     = padPriceForCurrency(gasPriceInput.value,     currency);
  if (dieselPriceInput.value)  dieselPriceInput.value  = padPriceForCurrency(dieselPriceInput.value,  currency);
  if (electricRateInput.value) electricRateInput.value = padPriceForCurrency(electricRateInput.value, currency);
}
[
  [gasPriceInput,     'gasPrice'],
  [dieselPriceInput,  'dieselPrice'],
  [electricRateInput, 'electricRate'],
].forEach(([input, key]) => {
  input.addEventListener('change', () => {
    const region = REGIONS[regionSelect.value];
    if (!region || !input.value) return;
    input.value = padPriceForCurrency(input.value, region.currency);
    savePrefs({ [key]: input.value });
    updateShareUrl();
  });
});

[evEffHwyInput, evEffCityInput].forEach(el => {
  el.addEventListener('input', () => {
    calculate();
    savePrefs({ evEffHwy: evEffHwyInput.value, evEffCity: evEffCityInput.value });
    renderSavedCars();
    updateShareUrl();
  });
});

// Clicking any "↻ update?" prompt focuses + selects the matching price
// input so the user can overwrite it with one keystroke. The prompt
// itself doesn't dismiss on click — only on actual edit (the input
// listeners above hide it once a new value has been typed).
gasPriceStaleEl.addEventListener('click', () => {
  gasPriceInput.focus();
  gasPriceInput.select();
});
dieselPriceStaleEl.addEventListener('click', () => {
  dieselPriceInput.focus();
  dieselPriceInput.select();
});
electricRateStaleEl.addEventListener('click', () => {
  electricRateInput.focus();
  electricRateInput.select();
});

// Mode picker — toggles which fuel inputs/costs are shown (multi-
// select). At least one must remain active; clicking the only-active
// button is a no-op rather than letting the user end up with nothing
// selected (which would invalidate the calc + UI).
document.querySelectorAll('.price-mode-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode    = btn.dataset.mode;
    const current = new Set(currentPriceModes());
    if (current.has(mode)) {
      if (current.size === 1) return; // can't deselect the last one
      current.delete(mode);
    } else {
      current.add(mode);
    }
    applyPriceModes([...current], { save: true });
    updateShareUrl();
  });
});

// Attach autocomplete on the static origin input. Destination inputs get
// theirs attached when they're created in addDestination().
attachAutocomplete(routeOriginEl, document.getElementById('route-origin-list'));

routeAddStopEl.addEventListener('click', () => {
  addDestination();
  // Focus the freshly added input so the user can immediately type.
  destinationInputs[destinationInputs.length - 1].focus();
});

// "One way" only makes sense when there's a route to compute. The
// checkbox visibly disables when origin and every destination are blank.
function updateOneWayDisabled() {
  const allEmpty = !routeOriginEl.value.trim() &&
    destinationInputs.every(el => !el.value.trim());
  oneWayCheckEl.disabled = allEmpty;
}
routeOriginEl.addEventListener('input', () => {
  updateOneWayDisabled();
  updateShareUrl();
});

// ── Car lookup wiring ─────────────────────────────
carInputEl.addEventListener('input', () => {
  // Typing in `done` state means "search for a different car" — soft-reset
  // the lookup so the year-stage handler below can pick up what was typed.
  if (carState.stage === 'done') softResetCarLookup();

  if (carState.stage === 'year') {
    const v = carInputEl.value.trim();
    setCarStatus('');
    if (/^\d{4}$/.test(v)) {
      const y = parseInt(v, 10);
      const max = new Date().getFullYear() + 1;
      if (y >= 1985 && y <= max) {
        carState.year = y;
        advanceCarTo('make');
      } else {
        setCarStatus(t('car.error', "Couldn't find that car"), true);
      }
    }
  } else {
    filterCarList();
  }
});

carInputEl.addEventListener('keydown', e => {
  if (carState.stage === 'done') return;
  const items = carListEl.querySelectorAll('.autocomplete-item');
  if (e.key === 'ArrowDown' && items.length) {
    e.preventDefault();
    carState.active = (carState.active + 1) % items.length;
    paintCarActive();
  } else if (e.key === 'ArrowUp' && items.length) {
    e.preventDefault();
    carState.active = (carState.active - 1 + items.length) % items.length;
    paintCarActive();
  } else if (e.key === 'Enter') {
    if (carState.active >= 0 && items.length) {
      e.preventDefault();
      const value = items[carState.active].dataset.value;
      const item = carState.list.find(i => i.value === value);
      if (item) pickCarItem(item);
    }
  } else if (e.key === 'Escape') {
    hideCarList();
  }
});

carInputEl.addEventListener('focus', () => {
  if (carState.list.length && carState.stage !== 'year' && carState.stage !== 'done') {
    renderCarList(carState.list);
  }
});

document.addEventListener('click', e => {
  if (!carInputEl.contains(e.target) && !carListEl.contains(e.target) && !carClearEl.contains(e.target)) {
    hideCarList();
  }
});

carClearEl.addEventListener('click', () => {
  resetCarLookup();
  carInputEl.focus();
});

resetCarLookup();

// Share modal: open via the button beneath the cost. Backdrop-click
// closes (same trick as the split modal — the <dialog> has no padding,
// so any click whose target is the dialog itself was on the backdrop).
shareLinkEl.addEventListener('click', openShareModal);
shareCloseEl.addEventListener('click', () => shareModalEl.close());
shareCopyEl.addEventListener('click', copyShareUrl);
shareNativeEl.addEventListener('click', nativeShare);
shareModalEl.addEventListener('click', e => {
  if (e.target === shareModalEl) shareModalEl.close();
});

// Install nudge: banner action opens the modal, × dismisses for good.
// Modal Install/Cancel buttons fire the stashed prompt or close out.
installBannerActionEl.addEventListener('click', openInstallModal);
installBannerDismissEl.addEventListener('click', dismissInstallNudge);
installCloseEl.addEventListener('click', () => installModalEl.close());
installCancelEl.addEventListener('click', () => {
  installModalEl.close();
  dismissInstallNudge();
});
installConfirmEl.addEventListener('click', confirmInstall);
installModalEl.addEventListener('click', e => {
  if (e.target === installModalEl) installModalEl.close();
});

// Split-cost modal: open via the link beneath the cost. Backdrop-click
// closes (the dialog has no padding/background, so any click whose target
// is the dialog itself landed on the backdrop, not on content).
splitLinkEl.addEventListener('click', openSplitModal);
splitCloseEl.addEventListener('click', () => splitModalEl.close());
splitModalEl.addEventListener('click', e => {
  if (e.target === splitModalEl) splitModalEl.close();
});

// Custom-vehicle modal — opened from the no-results panel in the car
// search dropdown. Same backdrop-close pattern as the other modals.
document.getElementById('custom-vehicle-close').addEventListener('click', closeCustomVehicleModal);
document.getElementById('custom-vehicle-cancel').addEventListener('click', closeCustomVehicleModal);
customVehicleFormEl.addEventListener('submit', submitCustomVehicle);
customVehicleFormEl.querySelectorAll('input[name="custom-fuel"]').forEach(r => {
  r.addEventListener('change', updateCustomEffVisibility);
});
customVehicleModalEl.addEventListener('click', e => {
  if (e.target === customVehicleModalEl) closeCustomVehicleModal();
});

routeButtonEl.addEventListener('click', planRoute);
routeOriginEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    planRoute();
  }
});

init();

// Re-fit the cost number when the viewport changes (the clamp()-driven
// natural size scales with vw) or when web fonts arrive (font metrics
// shift slightly, which can tip a borderline result into overflow).
let fitResizeRaf = null;
window.addEventListener('resize', () => {
  if (fitResizeRaf) cancelAnimationFrame(fitResizeRaf);
  fitResizeRaf = requestAnimationFrame(fitResultValue);
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fitResultValue);
}

// ── Service worker registration (PWA) ─────────────
// Registered after `load` so it doesn't compete with the initial render.
// Failures are non-fatal — the app works fine without the SW.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
