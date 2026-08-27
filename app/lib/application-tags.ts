export const DONT_INCLUDE_TAG = "Don't Include";

export function applicationHasDontIncludeTag(
  adminTags: string[] | null,
): boolean {
  return (adminTags ?? []).includes(DONT_INCLUDE_TAG);
}
