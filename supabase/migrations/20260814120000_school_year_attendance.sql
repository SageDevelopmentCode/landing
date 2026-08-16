-- School year weekday attendance + school year Field Fun Friday attendance.
-- Run manually in Supabase SQL editor for production.

CREATE TABLE IF NOT EXISTS attendance.school_year_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    student_id uuid NOT NULL,
    recorded_by uuid NOT NULL,
    notes text,
    paid_for_day boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    pickup_time text,
    picked_up_by_name text,
    picked_up_by_relationship text,
    pickup_recorded_by uuid,
    CONSTRAINT school_year_records_pkey PRIMARY KEY (id),
    CONSTRAINT school_year_records_date_student_id_key UNIQUE (date, student_id)
);

CREATE TABLE IF NOT EXISTS attendance.school_year_field_friday_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    date date NOT NULL,
    recorded_by uuid NOT NULL,
    notes text,
    paid_for_day boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    pickup_time text,
    picked_up_by_name text,
    picked_up_by_relationship text,
    pickup_recorded_by uuid,
    CONSTRAINT school_year_field_friday_records_pkey PRIMARY KEY (id),
    CONSTRAINT school_year_field_friday_records_student_id_date_key UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_school_year_records_date
    ON attendance.school_year_records USING btree (date);

CREATE INDEX IF NOT EXISTS idx_school_year_records_student
    ON attendance.school_year_records USING btree (student_id);

CREATE INDEX IF NOT EXISTS idx_school_year_field_friday_records_date
    ON attendance.school_year_field_friday_records USING btree (date);

CREATE INDEX IF NOT EXISTS idx_school_year_field_friday_records_student
    ON attendance.school_year_field_friday_records USING btree (student_id);

ALTER TABLE attendance.school_year_records
    ADD CONSTRAINT school_year_records_pickup_recorded_by_fkey
    FOREIGN KEY (pickup_recorded_by) REFERENCES auth.users (id);

ALTER TABLE attendance.school_year_records
    ADD CONSTRAINT school_year_records_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES admin.users (id);

ALTER TABLE attendance.school_year_records
    ADD CONSTRAINT school_year_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES admin.students (id);

ALTER TABLE attendance.school_year_field_friday_records
    ADD CONSTRAINT school_year_field_friday_records_pickup_recorded_by_fkey
    FOREIGN KEY (pickup_recorded_by) REFERENCES auth.users (id);

ALTER TABLE attendance.school_year_field_friday_records
    ADD CONSTRAINT school_year_field_friday_records_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES auth.users (id);

ALTER TABLE attendance.school_year_field_friday_records
    ADD CONSTRAINT school_year_field_friday_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES admin.students (id);

ALTER TABLE attendance.school_year_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.school_year_field_friday_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active grantee can view school year attendance"
    ON attendance.school_year_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM admin.students s
            JOIN parent_app.dashboard_access_grants g ON g.owner_id = s.parent_id
            WHERE s.id = school_year_records.student_id
              AND g.grantee_id = auth.uid()
              AND g.status = 'active'
        )
    );

CREATE POLICY "Active grantee can view school year field friday attendance"
    ON attendance.school_year_field_friday_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM admin.students s
            JOIN parent_app.dashboard_access_grants g ON g.owner_id = s.parent_id
            WHERE s.id = school_year_field_friday_records.student_id
              AND g.grantee_id = auth.uid()
              AND g.status = 'active'
        )
    );

CREATE POLICY "staff_delete_school_year_records"
    ON attendance.school_year_records
    FOR DELETE TO authenticated
    USING (public.is_staff());

CREATE POLICY "staff_insert_school_year_records"
    ON attendance.school_year_records
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff() AND recorded_by = auth.uid());

CREATE POLICY "staff_select_school_year_records"
    ON attendance.school_year_records
    FOR SELECT TO authenticated
    USING (public.is_staff());

CREATE POLICY "staff_update_school_year_records"
    ON attendance.school_year_records
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "staff_delete_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR DELETE TO authenticated
    USING (true);

CREATE POLICY "staff_insert_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "staff_select_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "staff_update_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_read_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "authenticated_insert_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR INSERT TO authenticated
    WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "authenticated_update_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR UPDATE TO authenticated
    USING (recorded_by = auth.uid())
    WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "authenticated_delete_school_year_field_friday_records"
    ON attendance.school_year_field_friday_records
    FOR DELETE TO authenticated
    USING (recorded_by = auth.uid());

GRANT ALL ON TABLE attendance.school_year_records TO anon;
GRANT ALL ON TABLE attendance.school_year_records TO authenticated;
GRANT ALL ON TABLE attendance.school_year_records TO service_role;

GRANT ALL ON TABLE attendance.school_year_field_friday_records TO anon;
GRANT ALL ON TABLE attendance.school_year_field_friday_records TO authenticated;
GRANT ALL ON TABLE attendance.school_year_field_friday_records TO service_role;
