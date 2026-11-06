export const DONT_INCLUDE_TAG = "Don't Include";

export type SchoolYearAppFields = {
  program: string | null;
  drop_in_program: string | null;
};

export function isSchoolYearApp(app: SchoolYearAppFields): boolean {
  return (
    app.program === "school_year_26_27" ||
    app.program === "both" ||
    app.program === "school_year_26_27_summer_27" ||
    (app.program === "homeschool_drop_in" &&
      (app.drop_in_program === "school_year_26_27" ||
        app.drop_in_program === "both" ||
        app.drop_in_program === "school_year_26_27_summer_27"))
  );
}

export function hasDontIncludeTag(adminTags: string[] | null | undefined): boolean {
  return (adminTags ?? []).includes(DONT_INCLUDE_TAG);
}
