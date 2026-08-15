type ApplicationNameRow = {
  student_id: string;
  preferred_name: string | null;
  child_legal_name: string | null;
};

export function getStudentDisplayName(
  preferredName: string | null | undefined,
  legalName: string | null | undefined,
  fallback = "Student",
): string {
  const preferred = preferredName?.trim();
  if (preferred) return preferred;
  return legalName?.trim() || fallback;
}

export function buildDisplayNameMap(
  apps: ApplicationNameRow[],
): Map<string, string> {
  return new Map(
    apps.map((a) => [
      a.student_id,
      getStudentDisplayName(a.preferred_name, a.child_legal_name),
    ]),
  );
}
