// Date formatting utilities - USA format (MM/DD/YYYY)

/**
 * Formats a date to USA format (MM/DD/YYYY)
 */
export function formatDateUSA(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Formats a date to USA format with time (MM/DD/YYYY HH:MM AM/PM)
 */
export function formatDateTimeUSA(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatDateUSA(d);
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${dateStr} ${timeStr}`;
}

/**
 * Formats a date to USA short format (M/D/YY)
 */
export function formatDateUSAShort(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear().toString().slice(-2);
  
  return `${month}/${day}/${year}`;
}

/**
 * Parses USA date format (MM/DD/YYYY) to Date object
 */
export function parseUSADate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[0]) - 1; // Month is 0-indexed
  const day = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Validates USA date format (MM/DD/YYYY)
 */
export function isValidUSADate(dateStr: string): boolean {
  const usaDateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!usaDateRegex.test(dateStr)) return false;
  
  return parseUSADate(dateStr) !== null;
}

/**
 * Gets current date in USA format
 */
export function getCurrentDateUSA(): string {
  return formatDateUSA(new Date());
}