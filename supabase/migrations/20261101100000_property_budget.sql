-- New property (Hutto) conversion budget and timeline, seeded from Complete_property_budget.csv

CREATE TABLE IF NOT EXISTS admin.property_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  category text NOT NULL,
  scope text NOT NULL,
  favorable_usd numeric(12, 2) NOT NULL DEFAULT 0 CHECK (favorable_usd >= 0),
  working_usd numeric(12, 2) NOT NULL DEFAULT 0 CHECK (working_usd >= 0),
  difficult_usd numeric(12, 2) NOT NULL DEFAULT 0 CHECK (difficult_usd >= 0),
  priority_code text NOT NULL CHECK (priority_code IN ('A', 'B', 'C', 'D')),
  start_week integer NOT NULL CHECK (start_week >= 1),
  end_week integer NOT NULL,
  activities text,
  completion_gate text,
  dependencies text,
  exclusions text,
  notes text,
  deferral_rule text,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'done', 'deferred')),
  actual_spent_usd numeric(12, 2) NOT NULL DEFAULT 0 CHECK (actual_spent_usd >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_week >= start_week)
);

CREATE TABLE IF NOT EXISTS admin.property_timeline_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  start_week integer NOT NULL CHECK (start_week >= 1),
  end_week integer NOT NULL,
  activities text,
  completion_gate text,
  dependencies text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_week >= start_week)
);

CREATE TABLE IF NOT EXISTS admin.property_project_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  project_start_date date NOT NULL DEFAULT '2026-12-15',
  contingency_favorable numeric(4, 3) NOT NULL DEFAULT 0.15,
  contingency_working numeric(4, 3) NOT NULL DEFAULT 0.20,
  contingency_difficult numeric(4, 3) NOT NULL DEFAULT 0.20,
  repair_reserve_low_usd numeric(12, 2) NOT NULL DEFAULT 15000,
  repair_reserve_high_usd numeric(12, 2) NOT NULL DEFAULT 25000,
  assumptions text,
  exclusions text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin.property_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.property_timeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.property_project_settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE admin.property_budget_items TO service_role;
GRANT ALL ON TABLE admin.property_timeline_phases TO service_role;
GRANT ALL ON TABLE admin.property_project_settings TO service_role;

INSERT INTO admin.property_budget_items (code, category, scope, favorable_usd, working_usd, difficult_usd, priority_code, start_week, end_week, activities, completion_gate, dependencies, exclusions, notes, deferral_rule, sort_order) VALUES
  ('S01', 'Planning', 'Design/code, structural and accessibility professionals', 6000, 10000, 16000, 'A', 1, 6, 'Measured layout; occupancy/egress review; structural input; accessibility coordination', 'Confirm approved capacity, upstairs residence and garage strategy', 'Site access; jurisdiction confirmation', 'Extensive civil engineering and septic design', 'Authorize feasibility before full drawings', 'Before construction commitment', 1),
  ('S02', 'Planning', 'Permits, reviews and inspections', 1500, 3000, 5000, 'A', 3, 19, 'Applications; review responses; inspections', 'Required approvals before applicable construction and occupancy', 'Preliminary design; authority confirmation', 'Unverified extraordinary fees', 'Placeholder fees, not published quotes', 'Before construction commitment', 2),
  ('S03', 'Fire/building', 'Three exterior classroom door openings', 12000, 18000, 24000, 'B', 8, 15, 'Headers; openings; doors; hardware; flashing; repairs; small landings', 'Approved egress and structural details', 'Design approval; door procurement', 'Long paths; major ramps', 'Working allowance $6,000 each; exact egress requirements unverified', 'Before students occupy; scope subject to approval', 3),
  ('S04', 'Fire/building', 'Basic fire-safety equipment', 2500, 4500, 7000, 'B', 8, 17, 'Exit signs; emergency lights; extinguishers; basic detection; testing', 'Approved fire scope', 'Electrical rough-in; fire review', 'Full commercial alarm; sprinklers; fire-water infrastructure', 'Additional systems may change budget', 'Before students occupy; scope subject to approval', 4),
  ('S05', 'Fire/building', 'School/residence separation and stair security', 4000, 10000, 22000, 'B', 8, 15, 'Targeted assemblies; doors; penetration sealing; stair security', 'Approved mixed-use arrangement', 'Code review; final layout', 'Upstairs kitchen; exterior stair; elevator; extensive reconstruction', 'High uncertainty; resolve early', 'Before students occupy; scope subject to approval', 5),
  ('S06', 'Accessibility', 'Accessible restroom retrofit', 6000, 11000, 18000, 'B', 8, 15, 'Existing bathroom adaptation; plumbing; clearances; door; bars; finishes', 'Approved layout', 'Measurements; accessibility review', 'Bathroom addition; multiple complete reconstructions', 'Assumes one suitable downstairs bathroom', 'Before students occupy; scope subject to approval', 6),
  ('S07', 'Accessibility', 'Accessible paths, entrances and landings', 5000, 9000, 16000, 'B', 11, 16, 'Entrance corrections; firm paths; grading; transitions; limited handrails', 'Continuous approved route', 'Fixed site/septic layout; underground coordination', 'Major retaining walls; long ramps', 'Reuse suitable paving; avoid door-landing overlap', 'Before students occupy; scope subject to approval', 7),
  ('S08', 'Accessibility', 'Accessible parking bay and access aisle', 2500, 4500, 7500, 'B', 13, 17, 'Surface corrections; markings; signs; transitions', 'Approved parking arrangement', 'Jurisdiction; site measurements', 'Full new parking lot', 'Existing surface suitability and legal parking scope unverified', 'Before students occupy; scope subject to approval', 8),
  ('S09', 'Accessibility', 'Other accessibility hardware and signage', 1000, 2000, 4000, 'B', 14, 17, 'Lever hardware; thresholds; identification', 'Required accessibility punch list complete', 'Final door/room layouts', 'Widespread doorway or corridor reconstruction', 'Limit to required changes', 'Before students occupy; scope subject to approval', 9),
  ('S10', 'Classroom', 'Limited garage classroom conversion', 18000, 32000, 50000, 'C', 8, 16, 'Insulation; walls; HVAC/ventilation; electrical; door/windows; flooring; minor moisture work', 'Needed before opening if main house cannot serve enrollment', 'Garage approval; septic capacity; accessible route', 'New bathroom; major foundation/roof/service work', 'Assumes 450–650 square feet; plan now even if built later', 'Before opening if essential to approval/safety/capacity; otherwise phase', 10),
  ('S11', 'Infrastructure', 'Septic assessment, design and corrections', 2000, 12000, 25000, 'B', 1, 16, 'Records; inspection; combined-use flow; design; permit; corrections', 'Approved system and applicable operating authorization', 'Designer; disposal area; site plan', 'Replacement beyond allowance', 'Replace overlapping allowances with actual quote; change-of-use review needed', 'Before students occupy; scope subject to approval', 11),
  ('S12', 'Fences', 'Interior metal fence removal', 1000, 2000, 3500, 'D', 20, 24, 'Remove selected fence; haul off; restore ground', 'Replacement containment ready', 'Pool/fence strategy', 'All perimeter fence demolition', 'Preserve useful barriers until replacements ready', 'After opening or planned closure', 12),
  ('S13', 'Fences', 'Perimeter fence extension/reinforcement', 10000, 18000, 30000, 'C', 10, 16, 'Measure; inspect posts; reinforce; wood rails/wire; installation', 'Opening-critical if existing containment unacceptable', 'Height permission; boundary; post condition', 'Guaranteed reuse; solid-wood extension everywhere', 'Unmeasured 700–850 linear-foot assumption', 'Before opening if essential to approval/safety/capacity; otherwise phase', 13),
  ('S14', 'Fences', 'Two manual sliding vehicle gates', 5000, 8000, 12000, 'C', 10, 16, 'Frames; infill; posts; foundations; hardware; installation', 'Required if safety/circulation plan demands', 'Openings; fabrication; circulation', 'Automation; long electrical runs', 'Powered working upgrade +$6,000 before contingency; separate pedestrian egress', 'Before opening if essential to approval/safety/capacity; otherwise phase', 14),
  ('S15', 'Outdoor', 'Playground/playset', 12000, 12000, 12000, 'D', 21, 28, 'Equipment; verify freight, assembly, anchoring and installation', 'Prepared site before use', 'Layout; surfacing; vendor availability', 'Unspecified vendor exclusions', 'Fixed owner allowance, not quote', 'After opening or planned closure', 15),
  ('S16', 'Outdoor', 'Playground preparation, surfacing and shade', 3000, 6000, 10000, 'D', 20, 28, 'Leveling; surfacing; containment; modest shade', 'Complete preparation before playset use', 'Equipment layout; clearances; underground constraints', 'Large engineered shade; poured rubber', 'Remove overlap with playset vendor scope', 'After opening or planned closure', 16),
  ('S17', 'Outdoor', 'Secure pool cover', 12000, 12000, 12000, 'C', 10, 17, 'Select; measure; procure; install cover/anchors', 'Before opening unless acceptable alternative confirmed', 'Authority/insurer acceptance; vendor lead time', 'Pool refurbishment; omitted electrical/deck work', 'Owner allowance; safe pool isolation cannot be deferred', 'Before opening if essential to approval/safety/capacity; otherwise phase', 17),
  ('S18', 'Outdoor', 'Pool barrier and safety corrections', 1000, 2500, 5000, 'B', 8, 16, 'Barrier/gate repairs; latches; specified safety items', 'Accepted pool exclusion before children arrive', 'Pool strategy; fence coordination', 'Complete enclosure; pool equipment repairs', 'Keep effective separation during works', 'Before students occupy; scope subject to approval', 18),
  ('S19', 'Outdoor', 'Chicken coop and initial supplies', 2500, 2500, 2500, 'D', 24, 30, 'Coop/run; feeders; waterers; chickens; initial supplies', 'Operations stabilized', 'Location; care/staffing plan', 'Recurring care/feed/vet costs', 'Fixed owner allowance; optional', 'After opening or planned closure', 19),
  ('S20', 'Setup', 'Furniture', 8000, 8000, 8000, 'C', 16, 20, 'Inventory; fill table/seating/storage gaps; assembly', 'Essential furnishings before opening', 'Room layout; existing inventory', 'Technology and curriculum', 'Fixed owner allowance; extras can wait', 'Before opening if essential to approval/safety/capacity; otherwise phase', 20),
  ('S21', 'Setup', 'Painting and minor finishes', 3500, 6000, 10000, 'C', 14, 17, 'Patch; paint selected rooms; trim touch-ups', 'Construction repairs complete before occupancy', 'Rough work complete', 'Whole-property interior/exterior repaint', 'Avoid duplicate garage/door repair costs', 'Before opening if essential to approval/safety/capacity; otherwise phase', 21),
  ('S22', 'Setup', 'Security and access control', 1500, 3000, 5000, 'B', 14, 18, 'Cameras; recording; entry controls; wiring; testing', 'Essential entry control before opening', 'Power/network; hardware', 'Subscriptions; gate automation', 'Premium features/additional cameras can wait', 'Before students occupy; scope subject to approval', 22),
  ('S23', 'Infrastructure', 'Drive/drop-off corrections', 1000, 4000, 10000, 'B', 11, 17, 'Minor surface repairs; local grading/drainage; signs', 'Safe circulation', 'Site layout; underground work; parking review', 'Large lot; major culvert/widening/stormwater', 'Reuse loop; rehearse actual vehicles', 'Before students occupy; scope subject to approval', 23),
  ('S24', 'Fire/building', 'Other minor electrical, HVAC and plumbing', 2500, 5000, 10000, 'B', 8, 15, 'Safety and operability repairs outside other scopes', 'Essential systems operational', 'Inspection findings; trade coordination', 'Full replacements; major upgrades/rewiring', 'Avoid duplicate restroom/garage charges', 'Before students occupy; scope subject to approval', 24),
  ('S25', 'Setup', 'Moving, cleaning, waste and setup', 2000, 3500, 6000, 'B', 17, 20, 'Local move; cleaning; haul-off; setup; staff rehearsal', 'Required approvals before students occupy', 'Finals; current-campus coordination', 'Rent overlap; lost tuition; temporary facilities', 'Owner/staff participation assumed; trade debris in trade scope', 'Before students occupy; scope subject to approval', 25)
ON CONFLICT (code) DO NOTHING;

INSERT INTO admin.property_timeline_phases (code, name, start_week, end_week, activities, completion_gate, dependencies, sort_order) VALUES
  ('P01', 'Feasibility', 1, 3, 'Use/jurisdiction; title; measurements; preliminary fire/accessibility; septic', 'No unresolved fatal feasibility issue', 'Site access and authorization', 1),
  ('P02', 'Design and pricing', 3, 6, 'Layout; exits; separation; restroom; routes; septic design; bids', 'Defined opening scope and updated budget', 'Preliminary feasibility', 2),
  ('P03', 'Review and procurement', 5, 10, 'Applications; revisions; scheduling; approved-material procurement', 'Required approvals before work', 'Sufficient design; funding; available contractors', 3),
  ('P04', 'Main construction', 8, 15, 'Doors; separation; restroom; utilities; septic/site; garage if included', 'Ready for inspections and finishes', 'Permits; materials', 4),
  ('P05', 'Finish and commission', 14, 17, 'Painting; hardware; signs; tests; security; cleaning', 'Punch list substantially complete', 'Rough work complete', 5),
  ('P06', 'Finals and corrections', 16, 19, 'Applicable inspections; corrections; reinspection', 'Required occupancy/operating approvals', 'Inspection-ready work', 6),
  ('P07', 'Move and rehearse', 18, 20, 'Furniture; staff setup; arrival/dismissal and emergency procedures', 'Approved student-ready campus', 'Approvals before student occupancy', 7),
  ('P08', 'Optional improvements', 20, 30, 'Playground; chickens; deferred aesthetics; separately schedule deferred garage', 'Safe isolation of construction', 'Opening stabilized; funds available', 8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO admin.property_project_settings (id, project_start_date, assumptions, exclusions) VALUES (
  true,
  '2026-12-15',
  'USD planning estimates, not bids or authority approvals. Weeks measured from feasibility authorization and property access; overlapping target windows, not active work durations. Verify capacity, use, residential separation, septic, accessibility, fire systems, pool and parking before commitment.',
  'Purchase; mortgage; closing/financing; taxes; insurance; utilities; operations; rent overlap; temporary premises; lost revenue; major roof/foundation/HVAC/utility replacement; new upstairs kitchen/stair/elevator; major parking/stormwater; additional fire systems or septic work exceeding allowance'
)
ON CONFLICT (id) DO NOTHING;
