/**
 * Parses a date string in DD/MM/YYYY format and returns a Date object
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date object representing the parsed date
 */
export function parseDateDDMMYYYY(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number)
  // JS months are 0-based
  return new Date(year, month - 1, day)
}
