const FALLBACK_COLORS = [
  '#1976d2',
  '#9c27b0',
  '#2e7d32',
  '#ed6c02',
  '#d32f2f',
  '#0288d1',
  '#7b1fa2',
  '#388e3c',
];

const NAMED_COLORS: Record<string, string> = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  success: '#2e7d32',
  error: '#d32f2f',
  warning: '#ed6c02',
  info: '#0288d1',
  default: '#757575',
  hotlist: '#d32f2f',
  a_list: '#1976d2',
  b_list: '#9c27b0',
  c_list: '#0288d1',
  d_list: '#ed6c02',
  standard: '#757575',
};

export const getCategoryColor = (color?: string | null, index = 0): string => {
  if (!color) return FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  const cleaned = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) return cleaned;

  return NAMED_COLORS[cleaned.toLowerCase()] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

export const getContrastText = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.65 ? '#111111' : '#ffffff';
};

export const DEFAULT_CATEGORY_COLOR = '#1976d2';
