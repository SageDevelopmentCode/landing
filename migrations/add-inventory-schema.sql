-- =====================================================================
-- INVENTORY SCHEMA
-- Sage Field School — Classroom Supply Tracking
-- Paste this entire block into the Supabase SQL Editor and run it.
-- =====================================================================

-- ─── 1. Schema ────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS inventory;

-- ─── 2. Role helper functions ─────────────────────────────────────────────────
-- SECURITY DEFINER lets the authenticated role check admin.users
-- without needing a direct schema grant on the admin schema.

CREATE OR REPLACE FUNCTION inventory.is_teacher_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;

CREATE OR REPLACE FUNCTION inventory.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_deleted = false
  );
$$;

GRANT USAGE ON SCHEMA inventory TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION inventory.is_teacher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION inventory.is_admin() TO authenticated;

-- ─── 3. inventory.items ───────────────────────────────────────────────────────
-- Shared classroom supply items. One row = one supply type, not individual units.

CREATE TABLE inventory.items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN (
                'Arts','Crafts','Science','Math',
                'Writing','Sensory','Outdoor','General'
              )),
  status      TEXT        CHECK (status IN ('Full','Running Out','Low')),
  count       INTEGER     CHECK (count >= 0),
  notes       TEXT,
  classroom   TEXT,
  added_by    UUID        NOT NULL REFERENCES auth.users(id),
  is_deleted  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. inventory.photos ──────────────────────────────────────────────────────
-- Multiple photos per item. storage_path is relative to the inventory-photos
-- bucket — signed URLs are generated at read time, not stored here.

CREATE TABLE inventory.photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID        NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  caption      TEXT,
  is_primary   BOOLEAN     NOT NULL DEFAULT false,
  uploaded_by  UUID        NOT NULL REFERENCES auth.users(id),
  is_deleted   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. inventory.history_events ──────────────────────────────────────────────
-- Append-only audit log. Rows are only ever inserted, never updated or deleted.
-- The absence of an UPDATE/DELETE RLS policy enforces this at the database layer.

CREATE TABLE inventory.history_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID        NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  action_type  TEXT        NOT NULL CHECK (action_type IN (
                 'taken','restocked','photo_added','note_added',
                 'status_changed','shopping_requested','created'
               )),
  performed_by UUID        NOT NULL REFERENCES auth.users(id),
  count_before INTEGER,
  count_after  INTEGER,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. inventory.shopping_requests ───────────────────────────────────────────
-- Purchase requests with an admin approval workflow.
-- pending → approved/denied → purchased once item arrives.

CREATE TABLE inventory.shopping_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID        NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  requested_by    UUID        NOT NULL REFERENCES auth.users(id),
  note            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','purchased','denied')),
  resolved_by     UUID        REFERENCES auth.users(id),
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  is_deleted      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. updated_at triggers ───────────────────────────────────────────────────
-- Reuses the public.update_updated_at_column() function already in the project.

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON inventory.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_inventory_shopping_requests_updated_at
  BEFORE UPDATE ON inventory.shopping_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 8. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_inventory_items_is_deleted   ON inventory.items(is_deleted);
CREATE INDEX idx_inventory_items_category     ON inventory.items(category)  WHERE is_deleted = false;
CREATE INDEX idx_inventory_items_status       ON inventory.items(status)    WHERE is_deleted = false;
CREATE INDEX idx_inventory_items_created_at   ON inventory.items(created_at DESC);
CREATE INDEX idx_inventory_photos_item_id     ON inventory.photos(item_id)  WHERE is_deleted = false;
CREATE INDEX idx_inventory_history_item_id    ON inventory.history_events(item_id, created_at DESC);
CREATE INDEX idx_inventory_shopping_item_id   ON inventory.shopping_requests(item_id) WHERE is_deleted = false;
CREATE INDEX idx_inventory_shopping_status    ON inventory.shopping_requests(status)  WHERE is_deleted = false;

-- ─── 9. Grants ────────────────────────────────────────────────────────────────

GRANT ALL ON inventory.items             TO authenticated, service_role;
GRANT ALL ON inventory.photos            TO authenticated, service_role;
GRANT ALL ON inventory.history_events    TO authenticated, service_role;
GRANT ALL ON inventory.shopping_requests TO authenticated, service_role;

-- ─── 10. Enable RLS ───────────────────────────────────────────────────────────

ALTER TABLE inventory.items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.history_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.shopping_requests ENABLE ROW LEVEL SECURITY;

-- ─── 11. RLS: inventory.items ─────────────────────────────────────────────────

CREATE POLICY "teachers_read_items"
  ON inventory.items FOR SELECT TO authenticated
  USING (is_deleted = false AND inventory.is_teacher_or_admin());

CREATE POLICY "teachers_insert_items"
  ON inventory.items FOR INSERT TO authenticated
  WITH CHECK (inventory.is_teacher_or_admin() AND added_by = auth.uid());

CREATE POLICY "teachers_update_items"
  ON inventory.items FOR UPDATE TO authenticated
  USING (is_deleted = false AND inventory.is_teacher_or_admin())
  WITH CHECK (inventory.is_teacher_or_admin());

-- No DELETE policy — hard deletes are blocked for all authenticated users.
-- Soft delete (is_deleted = true) is handled by the UPDATE policy above.

-- ─── 12. RLS: inventory.photos ────────────────────────────────────────────────

CREATE POLICY "teachers_read_photos"
  ON inventory.photos FOR SELECT TO authenticated
  USING (is_deleted = false AND inventory.is_teacher_or_admin());

CREATE POLICY "teachers_insert_photos"
  ON inventory.photos FOR INSERT TO authenticated
  WITH CHECK (inventory.is_teacher_or_admin() AND uploaded_by = auth.uid());

CREATE POLICY "teachers_softdelete_photos"
  ON inventory.photos FOR UPDATE TO authenticated
  USING (inventory.is_teacher_or_admin() AND (uploaded_by = auth.uid() OR inventory.is_admin()))
  WITH CHECK (inventory.is_teacher_or_admin());

-- ─── 13. RLS: inventory.history_events ────────────────────────────────────────

CREATE POLICY "teachers_read_history"
  ON inventory.history_events FOR SELECT TO authenticated
  USING (inventory.is_teacher_or_admin());

CREATE POLICY "teachers_insert_history"
  ON inventory.history_events FOR INSERT TO authenticated
  WITH CHECK (inventory.is_teacher_or_admin() AND performed_by = auth.uid());

-- No UPDATE or DELETE policies — append-only is enforced at the RLS layer.

-- ─── 14. RLS: inventory.shopping_requests ─────────────────────────────────────

CREATE POLICY "teachers_read_shopping"
  ON inventory.shopping_requests FOR SELECT TO authenticated
  USING (is_deleted = false AND inventory.is_teacher_or_admin());

CREATE POLICY "teachers_insert_shopping"
  ON inventory.shopping_requests FOR INSERT TO authenticated
  WITH CHECK (inventory.is_teacher_or_admin() AND requested_by = auth.uid());

-- Teachers can only soft-delete their own pending requests.
-- Only admins (super_admin) can change status, set resolved_by/resolved_at.
CREATE POLICY "admin_update_shopping"
  ON inventory.shopping_requests FOR UPDATE TO authenticated
  USING (
    is_deleted = false
    AND (
      inventory.is_admin()
      OR (requested_by = auth.uid() AND status = 'pending')
    )
  )
  WITH CHECK (
    inventory.is_admin()
    OR (requested_by = auth.uid() AND status = 'pending')
  );

-- ─── 15. Storage Bucket: inventory-photos ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-photos',
  'inventory-photos',
  false,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic']
);

CREATE POLICY "teachers_upload_inventory_photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory-photos' AND inventory.is_teacher_or_admin());

CREATE POLICY "teachers_read_inventory_photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inventory-photos' AND inventory.is_teacher_or_admin());

CREATE POLICY "teachers_delete_inventory_photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventory-photos' AND inventory.is_teacher_or_admin());
