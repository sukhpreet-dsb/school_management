'use client';

/**
 * Keeps `page` within `[1, totalPages]`. When the current page falls out of
 * range (e.g. rows were deleted and the page count shrank), re-syncs it by
 * calling `onChange`. Calling `onChange` during render is guarded so it
 * cannot loop (after re-render `page === safe`). Pass `totalPages` only when
 * the data has actually loaded (undefined while loading → no clamping).
 */
export function useSafePage(
  page: number,
  totalPages: number | undefined,
  onChange: (page: number) => void
): number {
  if (totalPages === undefined) return page;
  const safe = Math.min(page, Math.max(1, totalPages));
  if (safe !== page) {
    onChange(safe);
  }
  return safe;
}