/**
 * The coverage window, in one place so the pipeline and the UI cannot disagree.
 *
 * Exactly ten calendar years ending with the current one. Kept free of Node-only
 * imports so client components can read it too.
 */
export const WINDOW_YEARS = 10;
export const LAST_YEAR = new Date().getFullYear();
export const FIRST_YEAR = LAST_YEAR - WINDOW_YEARS + 1;
export const WINDOW_START = `${FIRST_YEAR}-01-01`;
export const WINDOW_LABEL = `${FIRST_YEAR}–${LAST_YEAR}`;

/** Records outside the window never enter the dataset. */
export function withinWindow(year: number): boolean {
  return year >= FIRST_YEAR && year <= LAST_YEAR;
}
