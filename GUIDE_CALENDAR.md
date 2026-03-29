# GUIDE_CALENDAR.md — Parent Dashboard: Calendar Page

## Section 1: Current Web UI/UX

### Screen Layout
The Calendar page is a full-width single-panel view with:
- **Top bar:** Month/year label (e.g., "March 2026"), prev/next chevron buttons for navigation, a month/week **view toggle** (button group top-right), and a **program filter** selector (e.g., "Summer" vs "School Year").
- **Calendar grid (Monthly view):** 7-column grid (Sun–Sat), 5–6 rows. Days with events show colored dot indicators beneath the day number. Today's date is highlighted.
- **Calendar grid (Weekly view):** 5 columns (Mon–Fri), each column is a day with full event chips stacked vertically. Shows one week at a time.
- **Event detail panel:** When an event is clicked, a fixed-position slide-in panel appears on the right showing: event title, date/time, description, category, attachments (linked files).

### Key Components

| Component | Role |
|---|---|
| View toggle (month/week) | Controls `viewMode` state: `'monthly'` or `'weekly'` |
| Prev/Next chevrons | Navigates `currentDate` state backward/forward by month or week |
| Program filter | Controls which events are shown (by program tag) |
| Monthly grid | 7-col CSS grid; each cell = one calendar day |
| Event dots (monthly) | Colored dots (1 per category) under a day number |
| Event chips (weekly) | Colored pill chips inside day columns, showing event title |
| Event detail panel | Fixed-position right panel; slides in on event click |
| Category color coding | Each `event.category` maps to a color (e.g., blue=school, green=summer) |

### State Management
- `viewMode: 'monthly' | 'weekly'`
- `currentDate: Date` — the reference date for which month/week is shown
- `selectedEvent: CalendarEvent | null` — drives detail panel open/close
- `programFilter: string` — which program's events to show

### User Interactions
- Click prev/next chevrons → updates `currentDate`
- Click view toggle → updates `viewMode`
- Click day with events (monthly) → selects first event of that day OR shows a day popover
- Click event chip (weekly) → sets `selectedEvent`, opens detail panel
- Click event dot (monthly) → sets `selectedEvent`, opens detail panel
- Click X on detail panel → clears `selectedEvent`
- Click attachment link → opens file URL in new tab

### CalendarEvent Type
```ts
type CalendarEvent = {
  id: string
  title: string
  event_date: string       // 'YYYY-MM-DD'
  start_time?: string      // 'HH:MM'
  end_time?: string
  description?: string
  category?: string
  color?: string
  program?: string[]
  shared_with?: string[]   // e.g. ['Parents', 'Staff']
  attachments?: { name: string; url: string }[]
}
```

---

## Section 2: Mobile Layout Adaptation

### Screen Hierarchy
```
ParentTabNavigator
  └── CalendarStack
        ├── CalendarScreen          (calendar view + event list below)
        └── EventDetailSheet        (bottom sheet on event tap)
```

### Navigation Patterns
- **Monthly view (default):** Use `react-native-calendars` `Calendar` component or a custom grid. Mark dates with dots using the `markedDates` prop. Tapping a marked date scrolls to that day's events in a `FlatList` below the calendar.
- **Weekly view:** A horizontal swipeable strip showing Mon–Fri with event chips. Implement as a `FlatList` with `horizontal` + `pagingEnabled` for week-by-week swiping, or a custom week strip component.
- **Event detail:** `BottomSheetModal` with event title, date/time, description, category badge, and attachment links. No new screen needed.
- **Program filter:** Render as a `SegmentedControl` (iOS native) or a custom tab bar at the top.

### Mobile-Specific UX Considerations
- Calendar should be sticky at the top of a `ScrollView` (or use `StickyHeader` pattern) with events listed below — common mobile calendar pattern (like Google Calendar's agenda view).
- Attachment links: use `Linking.openURL(url)` — do not attempt to download, just open in the device browser.
- Swipe left/right on the calendar to navigate months (via `PanGestureHandler` or built-in `react-native-calendars` gestures).
- Category colors should use a consistent color map matching the web (same hex codes) — define a shared `CATEGORY_COLORS` constant.
- Empty state: if no events this month/week, show "No events scheduled" message in the events list area.
- Program filter only shown if parent has multiple enrolled programs (e.g., summer + school year).

### Component Mapping

| Web Component | React Native Equivalent |
|---|---|
| Monthly grid (CSS grid) | `react-native-calendars` `Calendar` or custom grid |
| Event dots under day | `markedDates` with `dots` array in react-native-calendars |
| Weekly grid (5 cols) | Horizontal swipeable `FlatList` (week strip) |
| Event chips (weekly) | Colored `TouchableOpacity` pills in day column |
| Event detail panel (slide-in) | `BottomSheetModal` |
| Prev/next chevrons | `TouchableOpacity` arrow buttons above calendar |
| View toggle (month/week) | Custom segmented button group or top tab |
| Program filter dropdown | `SegmentedControl` or `Picker` |
| Attachment link (new tab) | `TouchableOpacity` → `Linking.openURL(url)` |

---

## Section 3: Supabase Data

### Tables Read

| Table | Schema | Purpose |
|---|---|---|
| `events` | `calendar` | All parent-facing calendar events |

### Query Pattern

**Fetch all parent-visible events:**
```ts
// server-side (page.tsx) OR Edge Function, admin client
const { data: events } = await supabase
  .schema('calendar')
  .from('events')
  .contains('shared_with', ['Parents'])
  .order('event_date', { ascending: true })
  .select('*')
```

**Optional — filter by program (if parent has a specific program):**
```ts
// Add an overlap filter on the programs array column
.overlaps('program', parentPrograms)  // e.g., ['summer_26']
```

**Optional — filter to current month range (for performance):**
```ts
.gte('event_date', firstDayOfMonth)
.lte('event_date', lastDayOfMonth)
```

### Client Type
- Web: **admin client** used in `page.tsx` (server-side)
- Mobile: expose via **Edge Function** `GET /calendar-events?month=2026-03`
  - Returns events filtered by `shared_with` contains `Parents` and optional month range
  - No admin credentials on device

### Realtime
- **No realtime subscription needed** — calendar events are admin-managed and change infrequently
- On mobile: refetch on screen focus using `useFocusEffect`
- Optional: add a short polling interval (e.g., every 5 minutes) if near-live updates are desired

### Storage
- No storage operations on calendar page
- Attachment URLs in `attachments` array are direct public URLs — open with `Linking.openURL`

### No Per-Parent Filtering
- The calendar is **shared** — all parents see the same events that have `shared_with` containing `'Parents'`
- No `parent_id` filter needed on the `events` table
- Program filtering (summer vs school year) is purely client-side, using the `program` array on each event
