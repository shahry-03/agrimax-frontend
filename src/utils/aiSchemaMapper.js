/**
 * aiSchemaMapper.js (v2.1 — Enterprise + Bulletproof)
 */

// ══════════════════════════════════════════════════════
// Labels Dictionary
// ══════════════════════════════════════════════════════
export const KEY_LABELS = {
  // ── Pricing & Crop ──
  currentMinPrice: { en: 'Minimum Price', ur: 'کم از کم قیمت' },
  currentMaxPrice: { en: 'Maximum Price', ur: 'زیادہ سے زیادہ قیمت' },
  currentAvgPrice: { en: 'Average Price', ur: 'اوسط قیمت' },
  minPrice: { en: 'Minimum Price', ur: 'کم از کم قیمت' },
  maxPrice: { en: 'Maximum Price', ur: 'زیادہ سے زیادہ قیمت' },
  avgPrice: { en: 'Average Price', ur: 'اوسط قیمت' },
  currentPrice: { en: 'Market Price', ur: 'مارکیٹ ریٹ' },
  cropName: { en: 'Crop', ur: 'فصل' },
  cropNameEn: { en: 'Crop Variety', ur: 'فصل کی قسم' },
  cropNameUr: { en: 'Crop (Urdu)', ur: 'فصل (اردو)' },
  crop: { en: 'Crop', ur: 'فصل' },
  cropUr: { en: 'Crop (Urdu)', ur: 'فصل (اردو)' },
  cropUnit: { en: 'Unit', ur: 'پیمانہ / اکائی' },
  unit: { en: 'Unit', ur: 'پیمانہ / اکائی' },
  cropCategory: { en: 'Category', ur: 'کیٹیگری' },
  cropGrade: { en: 'Grade', ur: 'درجہ' },
  cropQuality: { en: 'Quality', ur: 'معیار' },
  marketName: { en: 'Mandi / Market', ur: 'منڈی کا نام' },
  market: { en: 'Mandi / Market', ur: 'منڈی کا نام' },
  priceDate: { en: 'Rate Date', ur: 'ریٹ کی تاریخ' },
  date: { en: 'Date', ur: 'تاریخ' },
  currentDate: { en: 'Date', ur: 'تاریخ' },
  season: { en: 'Agricultural Season', ur: 'زرعی سیزن' },

  // ── Marketplace ──
  activePostsCount: { en: 'Active Listings', ur: 'فعال اشتہارات' },
  hasActiveListings: { en: 'Active Seller', ur: 'فعال فروخت کنندہ' },
  postId: { en: 'Listing ID', ur: 'اشتہار نمبر' },
  quantity: { en: 'Quantity', ur: 'مقدار' },
  askingPrice: { en: 'Asking Price', ur: 'طلب کردہ قیمت' },
  price: { en: 'Price', ur: 'قیمت' },
  status: { en: 'Status', ur: 'حیثیت' },
  expiresAt: { en: 'Expires On', ur: 'میعاد' },
  location: { en: 'Location', ur: 'مقام' },
  city: { en: 'City', ur: 'شہر' },
  province: { en: 'Province', ur: 'صوبہ' },
  address: { en: 'Address', ur: 'پتہ' },

  // ── Fintech ──
  balance: { en: 'Wallet Balance', ur: 'والیٹ بیلنس' },
  walletBalance: { en: 'Wallet Balance', ur: 'والیٹ بیلنس' },
  availableBalance: { en: 'Available Balance', ur: 'دستیاب بیلنس' },
  currency: { en: 'Currency', ur: 'کرنسی' },
  walletId: { en: 'Wallet ID', ur: 'والیٹ نمبر' },
  isActive: { en: 'Account Status', ur: 'اکاؤنٹ کی حیثیت' },
  amount: { en: 'Amount', ur: 'رقم' },
  totalAmount: { en: 'Total Amount', ur: 'کل رقم' },
  subtotal: { en: 'Subtotal', ur: 'ذیلی رقم' },
  tax: { en: 'Tax', ur: 'ٹیکس' },
  discount: { en: 'Discount', ur: 'رعایت' },
  type: { en: 'Type', ur: 'قسم' },
  description: { en: 'Description', ur: 'تفصیل' },
  transactionId: { en: 'Transaction ID', ur: 'ٹرانزیکشن نمبر' },
  paymentMethod: { en: 'Payment Method', ur: 'ادائیگی کا طریقہ' },
  paymentStatus: { en: 'Payment Status', ur: 'ادائیگی کی حیثیت' },

  // ── User ──
  userId: { en: 'User ID', ur: 'صارف نمبر' },
  name: { en: 'Name', ur: 'نام' },
  email: { en: 'Email', ur: 'ای میل' },
  phone: { en: 'Phone', ur: 'فون نمبر' },
  role: { en: 'Role', ur: 'کردار' },
  isVerified: { en: 'Verified', ur: 'تصدیق شدہ' },
  createdAt: { en: 'Created On', ur: 'تاریخِ تخلیق' },
  updatedAt: { en: 'Updated On', ur: 'آخری اپڈیٹ' },

  // ── General ──
  topic: { en: 'Advice Topic', ur: 'موضوع' },
  contextUsed: { en: 'Data Sources', ur: 'معلومات کی بنیاد' },
  capabilities: { en: 'Supported Actions', ur: 'دستیاب سہولیات' },
  action: { en: 'Action', ur: 'عمل' },
  target: { en: 'Destination', ur: 'منزل' },
  label: { en: 'Page', ur: 'صفحہ' },
  confidence: { en: 'Confidence', ur: 'اعتماد' },
  intent: { en: 'Intent', ur: 'ارادہ' },
  detectedLanguage: { en: 'Detected Language', ur: 'شناخت شدہ زبان' },
};

// ══════════════════════════════════════════════════════
// Enums
// ══════════════════════════════════════════════════════
const TYPE_LABELS = {
  CREDIT: { en: 'Credit', ur: 'جمع' },
  DEBIT: { en: 'Debit', ur: 'خرچ' },
  WITHDRAWAL: { en: 'Withdrawal', ur: 'رقم نکالی' },
  DEPOSIT: { en: 'Deposit', ur: 'رقم جمع' },
  TRANSFER: { en: 'Transfer', ur: 'منتقلی' },
  REFUND: { en: 'Refund', ur: 'واپسی' },
};

const STATUS_LABELS = {
  ACTIVE: { en: 'Active', ur: 'فعال' },
  COMPLETED: { en: 'Completed', ur: 'مکمل' },
  CANCELLED: { en: 'Cancelled', ur: 'منسوخ' },
  PENDING: { en: 'Pending', ur: 'زیر التوا' },
  FAILED: { en: 'Failed', ur: 'ناکام' },
  EXPIRED: { en: 'Expired', ur: 'میعاد ختم' },
  SOLD: { en: 'Sold', ur: 'فروخت شدہ' },
  PAID: { en: 'Paid', ur: 'ادا شدہ' },
  UNPAID: { en: 'Unpaid', ur: 'غیر ادا شدہ' },
};

// ══════════════════════════════════════════════════════
// Key Sets
// ══════════════════════════════════════════════════════
const CURRENCY_KEYS = new Set([
  'currentMinPrice', 'currentMaxPrice', 'currentAvgPrice',
  'minPrice', 'maxPrice', 'avgPrice', 'currentPrice',
  'askingPrice', 'price', 'balance', 'walletBalance',
  'availableBalance', 'amount', 'totalAmount', 'subtotal',
  'tax', 'discount',
]);

const COUNT_KEYS = new Set([
  'activePostsCount', 'totalPosts', 'unreadCount', 'views',
  'likes', 'comments', 'shares',
]);

const DATE_KEYS = new Set([
  'createdAt', 'updatedAt', 'deletedAt', 'expiresAt',
  'date', 'priceDate', 'currentDate', 'deliveryDate',
  'startDate', 'endDate', 'scheduledAt', 'paidAt',
]);

// ✅ NEW — keys that must ALWAYS be treated as plain strings
// (protects phone numbers, IDs, postal codes from number formatting)
const STRING_PRESERVE_KEYS = new Set([
  'phone', 'phoneNumber', 'mobile', 'mobileNumber',
  'transactionId', 'transactionNumber', 'orderId', 'orderNumber',
  'userId', 'postId', 'walletId', 'id',
  'email', 'postalCode', 'zipCode', 'cnic', 'nic',
]);

const CURRENCY_SYMBOLS = {
  PKR: '₨', USD: '$', EUR: '€', GBP: '£',
  INR: '₹', AED: 'د.إ', SAR: '﷼',
};

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════
function isTimestamp(val) {
  return typeof val === 'number' && val > 1e9 && val < 1e13;
}

function timestampToDate(val) {
  return val > 1e12 ? new Date(val) : new Date(val * 1000);
}

// ✅ Bounded cache (300 entries max, then full reset)
const MAX_CACHE_ENTRIES = 300;
const _humanizeCache = new Map();

export function humanizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  if (_humanizeCache.has(key)) return _humanizeCache.get(key);

  const result = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')     // camelCase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')   // APIClient
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  if (_humanizeCache.size >= MAX_CACHE_ENTRIES) _humanizeCache.clear();
  _humanizeCache.set(key, result);
  return result;
}

export function getHumanKeyLabel(key, language = 'ur') {
  if (!key) return '';
  const match = KEY_LABELS[key];
  if (match) return language === 'ur' ? match.ur : match.en;
  return humanizeKey(key);
}

export function formatCurrency(val, currencyOrOptions = 'PKR') {
  if (val === null || val === undefined || val === '') return null;

  const num = Number(val);
  if (isNaN(num)) return String(val);

  const options =
    typeof currencyOrOptions === 'string'
      ? { currency: currencyOrOptions }
      : currencyOrOptions || {};

  const { currency = 'PKR', decimals = null, useSymbol = true, locale } = options;

  const symbol = useSymbol && CURRENCY_SYMBOLS[currency]
    ? CURRENCY_SYMBOLS[currency]
    : currency;

  const resolvedLocale = locale || (currency === 'PKR' ? 'en-PK' : 'en-US');

  const formattedNum = num.toLocaleString(resolvedLocale, {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 2,
  });

  return `${symbol} ${formattedNum}`;
}

export function formatNumber(val, language = 'ur') {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString(language === 'ur' ? 'en-PK' : 'en-US');
}

export function formatDate(val, language = 'ur') {
  if (val === null || val === undefined || val === '') return null;

  let d;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'number' && isTimestamp(val)) {
    d = timestampToDate(val);
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    // ✅ ONLY date-only strings (YYYY-MM-DD exactly) — replace hyphens to force local
    // Space or T separated strings keep standard parsing
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    d = new Date(isDateOnly ? trimmed.replace(/-/g, '/') : trimmed);
  } else {
    return String(val);
  }

  if (isNaN(d.getTime())) return String(val);

  return d.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(timestamp, language = 'ur') {
  if (!timestamp) return '';

  const ms = typeof timestamp === 'number' && timestamp < 1e12
    ? timestamp * 1000
    : Number(timestamp);
  if (isNaN(ms)) return '';

  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const isUrdu = language === 'ur';

  if (seconds < 60) return isUrdu ? 'ابھی' : 'Just now';
  if (minutes < 60) return isUrdu ? `${minutes} منٹ پہلے` : `${minutes}m ago`;
  if (hours < 24) return isUrdu ? `${hours} گھنٹے پہلے` : `${hours}h ago`;
  if (days < 7) return isUrdu ? `${days} دن پہلے` : `${days}d ago`;
  return formatDate(ms, language);
}

export function formatPercent(val, decimals = 1) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
}

export function truncateText(text, maxLength = 50, ellipsis = '…') {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

// ✅ Fixed for UPPER_SNAKE_CASE and mixed cases
export function normalizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  return key
    .toLowerCase()
    .replace(/[_-]+(.)/g, (_, char) => char.toUpperCase());
}

// ══════════════════════════════════════════════════════
// formatValue — fully hardened
// ══════════════════════════════════════════════════════
export function formatValue(key, val, language = 'ur') {
  if (val === null || val === undefined || val === '') return null;

  const isUrdu = language === 'ur';

  // ── ✅ NEW: Preserve string-typed keys before any number formatting
  // (phone, email, IDs, postal codes — never lose leading zeros)
  if (STRING_PRESERVE_KEYS.has(key)) {
    return String(val);
  }

  // ── Booleans ──
  if (typeof val === 'boolean') {
    return isUrdu ? (val ? 'جی ہاں' : 'نہیں') : val ? 'Yes' : 'No';
  }

  // ── Type enum ──
  if (key === 'type' && typeof val === 'string') {
    const mapped = TYPE_LABELS[val.toUpperCase()];
    if (mapped) return isUrdu ? mapped.ur : mapped.en;
  }

  // ── Status enum ──
  if (key === 'status' && typeof val === 'string') {
    const mapped = STATUS_LABELS[val.toUpperCase()];
    if (mapped) return isUrdu ? mapped.ur : mapped.en;
  }

  // ── Currency ──
  if (CURRENCY_KEYS.has(key)) {
    return formatCurrency(val);
  }

  // ── ✅ Specific: activePostsCount (with "active"/"فعال" suffix)
  if (key === 'activePostsCount') {
    const num = Number(val);
    if (!isNaN(num) && Number.isInteger(num)) {
      const formatted = num.toLocaleString(isUrdu ? 'en-PK' : 'en-US');
      return isUrdu ? `${formatted} فعال` : `${formatted} active`;
    }
  }

  // ── ✅ General numeric counts — NO "number" in regex
  // (so phoneNumber, transactionNumber, orderNumber are NOT matched)
  if (COUNT_KEYS.has(key) || /(?:count|qty|quantity)$/i.test(key)) {
    const num = Number(val);
    if (!isNaN(num) && Number.isInteger(num)) {
      return num.toLocaleString(isUrdu ? 'en-PK' : 'en-US');
    }
  }

  // ── Dates by key ──
  if (DATE_KEYS.has(key)) {
    return formatDate(val, language);
  }

  // ── Timestamps by value ──
  if (typeof val === 'number' && isTimestamp(val)) {
    return formatDate(val, language);
  }

  // ── ISO date string ──
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return formatDate(val, language);
  }

  // ── Arrays ──
  if (Array.isArray(val)) {
    return val.map((v) => (v && typeof v === 'object' ? '—' : String(v))).join(', ');
  }

  // ── Objects ──
  if (typeof val === 'object') return null;

  return String(val);
}

export default {
  KEY_LABELS,
  humanizeKey,
  getHumanKeyLabel,
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatPercent,
  truncateText,
  normalizeKey,
  formatValue,
};