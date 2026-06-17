import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ContactCategory } from '../types';

/**
 * Format a phone number for display
 */
export const formatPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US format with country code: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
  } else {
    // International or unknown format - just return with basic formatting
    return phone;
  }
};

/**
 * Format a date for display
 */
export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date relative to now (e.g., "2 hours ago", "Yesterday")
 */
export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    if (isToday(dateObj)) {
      return `Today, ${format(dateObj, 'h:mm a')}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday, ${format(dateObj, 'h:mm a')}`;
    } else {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    }
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Unknown time';
  }
};

/**
 * Format contact category for display
 */
export const formatContactCategory = (category: ContactCategory): string => {
  switch (category) {
    case 'HOTLIST':
      return 'Hot List';
    case 'A_LIST':
      return 'A List';
    case 'B_LIST':
      return 'B List';
    case 'C_LIST':
      return 'C List';
    case 'D_LIST':
      return 'D List';
    case 'STANDARD':
      return 'Standard';
    default:
      return category;
  }
};

/**
 * Format a percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
}; 