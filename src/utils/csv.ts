export type CsvField = keyof any;

function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  // Try to serialize date-like strings from API
  const maybeDate = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
  const s = maybeDate ? new Date(v).toISOString() : String(v);
  const needsQuotes = s.includes(',') || s.includes('\n') || s.includes('"');
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv<T extends Record<string, any>>(rows: T[], fields: (keyof T)[], headerLabels?: Record<string, string>) {
  const header = fields.map(f => headerLabels?.[String(f)] ?? String(f)).join(',');
  const lines = rows.map(row => fields.map(f => toCsvValue(row[f])).join(','));
  return [header, ...lines].join('\n');
}

export function downloadCsv(csv: string, filename = 'contacts.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Normalizes a phone number by removing spaces, hyphens, parentheses, and the "+" sign
 * @param phone - The phone number to normalize
 * @returns The normalized phone number (digits only)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove spaces, hyphens, parentheses, plus signs, and other non-digit characters
  return phone.replace(/[\s\-\(\)\+\.]/g, '');
}

/**
 * Removes duplicate contacts based on normalized phone numbers
 * @param contacts - Array of contact objects
 * @param phoneField - The field name containing the phone number (default: 'phone')
 * @returns Object containing deduplicated contacts and removal statistics
 */
export function removeDuplicateContacts<T extends Record<string, any>>(
  contacts: T[],
  phoneField: string = 'phone'
): {
  deduplicatedContacts: T[];
  duplicatesRemoved: number;
  duplicatePhoneNumbers: string[];
} {
  const seenPhoneNumbers = new Set<string>();
  const deduplicatedContacts: T[] = [];
  const duplicatePhoneNumbers: string[] = [];
  let duplicatesRemoved = 0;

  for (const contact of contacts) {
    const phone = contact[phoneField];
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // If phone is empty/null, keep the contact (treat as separate records)
    if (!normalizedPhone) {
      deduplicatedContacts.push(contact);
      continue;
    }
    
    // If we've seen this phone number before, skip this contact
    if (seenPhoneNumbers.has(normalizedPhone)) {
      duplicatesRemoved++;
      if (!duplicatePhoneNumbers.includes(normalizedPhone)) {
        duplicatePhoneNumbers.push(normalizedPhone);
      }
      continue;
    }
    
    // First time seeing this phone number, keep the contact
    seenPhoneNumbers.add(normalizedPhone);
    deduplicatedContacts.push(contact);
  }

  return {
    deduplicatedContacts,
    duplicatesRemoved,
    duplicatePhoneNumbers
  };
}