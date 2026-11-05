ALTER TABLE waitlist.submissions
  DROP CONSTRAINT IF EXISTS submissions_program_interest_check;

ALTER TABLE waitlist.submissions
  ADD CONSTRAINT submissions_program_interest_check
  CHECK (
    program_interest = ANY (ARRAY[
      'summer-2026'::text,
      'school-year-2026'::text,
      'both'::text,
      'homeschool_drop_in'::text,
      'summer-2027'::text,
      'school-year-2027-2028'::text
    ])
  );
