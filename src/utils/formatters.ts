/**
 * Formats a numeric price into Uzbek readable currency string: 200000 -> "200 000 so'm"
 */
export function formatCurrency(amount: number): string {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} so'm`;
}

/**
 * Returns current date string formatted as DD.MM.YYYY
 */
export function getCurrentDateStr(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Returns current time string formatted as HH:mm
 */
export function getCurrentTimeStr(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
