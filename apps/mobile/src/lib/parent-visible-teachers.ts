export const PARENT_VISIBLE_TEACHERS = new Set([
  "Sabrina Obnamia",
  "Zelinda Melo",
  "Joy Paige",
]);

export function isParentVisibleTeacher(fullName: string): boolean {
  return PARENT_VISIBLE_TEACHERS.has(fullName);
}
