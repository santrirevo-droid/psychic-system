export const MONTH_LABELS: Record<number, string> = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

/** Formats birth year/month for display, e.g. "Maret 1990", "1990", or "Maret". */
export function formatBirth(year: number | null, month: number | null): string | null {
  const monthLabel = month ? MONTH_LABELS[month] : null;
  if (monthLabel && year) return `${monthLabel} ${year}`;
  if (monthLabel) return monthLabel;
  if (year) return `${year}`;
  return null;
}
