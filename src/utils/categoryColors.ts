import { Contact, CustomCategory } from '../types';

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

  const cleaned = color.trim().toLowerCase().replace(/[\s-]/g, '_');
  if (/^#[0-9a-f]{6}$/i.test(cleaned)) return cleaned;

  const key = cleaned.replace(/_/g, '');
  return NAMED_COLORS[cleaned] || NAMED_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
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

export const resolveContactCategory = (
  contact: Contact,
  customCategories: CustomCategory[] = []
): CustomCategory | undefined => {
  if (contact.customCategory) return contact.customCategory;

  if (contact.customCategoryId !== undefined && contact.customCategoryId !== null) {
    const cat = customCategories.find((c) => Number(c.id) === Number(contact.customCategoryId));
    if (cat) return cat;
  }

  if (contact.category) {
    const legacyNameLower = contact.category.toLowerCase();
    
    const matchesCategoryName = (customCatName: string): boolean => {
      const catNameLower = customCatName.toLowerCase();
      if (legacyNameLower === 'hotlist' && (catNameLower === 'hotlist' || catNameLower === 'hot list')) return true;
      if (legacyNameLower === 'a_list' && (catNameLower === 'a list' || catNameLower === 'a-list')) return true;
      if (legacyNameLower === 'b_list' && (catNameLower === 'b list' || catNameLower === 'b-list')) return true;
      if (legacyNameLower === 'c_list' && (catNameLower === 'c list' || catNameLower === 'c-list')) return true;
      if (legacyNameLower === 'd_list' && (catNameLower === 'd list' || catNameLower === 'd-list')) return true;
      if (legacyNameLower === 'standard' && catNameLower === 'standard') return true;
      
      const legacyNameNormalized = legacyNameLower.replace('_', ' ');
      return catNameLower === legacyNameNormalized || catNameLower === legacyNameLower;
    };

    const cat = customCategories.find((c) => matchesCategoryName(c.name));
    if (cat) return cat;
  }

  return undefined;
};

export const resolveContactCategoryColor = (
  contact: Contact,
  customCategories: CustomCategory[] = [],
  index = 0
): string => {
  const customCat = resolveContactCategory(contact, customCategories);
  if (customCat && customCat.color) {
    return getCategoryColor(customCat.color, index);
  }
  
  if (contact.category) {
    return getCategoryColor(contact.category, index);
  }
  
  return getCategoryColor(undefined, index);
};

export const resolveContactCategoryName = (
  contact: Contact,
  customCategories: CustomCategory[] = []
): string => {
  const customCat = resolveContactCategory(contact, customCategories);
  if (customCat) return customCat.name;
  
  if (!contact.category) return '';
  
  const name: string = contact.category;
  if (name === 'HOTLIST') return 'Hot List';
  if (name === 'A_LIST') return 'A List';
  if (name === 'B_LIST') return 'B List';
  if (name === 'C_LIST') return 'C List';
  if (name === 'D_LIST') return 'D List';
  if (name === 'STANDARD') return 'Standard';
  
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace('_', ' ');
};
