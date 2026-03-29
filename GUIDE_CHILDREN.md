# GUIDE_CHILDREN.md — Parent Dashboard: Children Page

## Section 1: Current Web UI/UX

### Screen Layout
The Children page has two main zones:
- **Left/Top: Child Switcher** — a horizontal row of pill buttons, one per enrolled child. Clicking a pill sets the active child index.
- **Main Content Area:** Below the switcher, a `ChildProfile` hero card shows the active child's photo, name, age, program, and enrollment status. Below that, **5 content tabs** (Teacher Info, Attendance, Learning, Photos, Profile).

### Key Components

| Component | Role |
|---|---|
| Child switcher pills | Toggle `activeChildIndex` state; renders one pill per student |
| `ChildProfile` hero card | Displays child's avatar, name, age, program label |
| Tab bar (5 tabs) | Controls `activeTab` state: `teacher`, `attendance`, `learning`, `photos`, `profile` |
| `TeacherTab` | Shows assigned teacher(s) via `TeacherCard` — photo, name, bio, message/email buttons |
| `AttendanceTab` | Static CTA — redirects user to download the school's attendance app |
| `LearningTab` | Learning goals, observations, or progress notes |
| `ProfileTab` | 4 section cards: Medical Info, Learning Profile, Regulation, Support |
| Non-enrolled alert banner | Shown when `nonEnrolledAppByStudent[id]` exists — links to dashboard to complete enrollment |

### State Management
- `activeChildIndex: number` — which child's data is shown (default 0)
- `activeTab: string` — which of the 5 content tabs is active
- Each tab renders independently; no nested tab state

### User Interactions
- Click child pill → updates `activeChildIndex`, re-renders all tabs with new child data
- Click tab → updates `activeTab`
- Click "Message" on TeacherCard → navigates to Messages page pre-filled with that teacher's conversation
- Click "Email" on TeacherCard → opens `mailto:` link
- Non-enrolled banner "Complete Enrollment" → navigates to dashboard/applications

---

## Section 2: Mobile Layout Adaptation

### Screen Hierarchy
```
ParentTabNavigator
  └── ChildrenStack
        ├── ChildrenHomeScreen       (child switcher + hero card + tab bar)
        ├── TeacherDetailScreen      (optional: full teacher bio)
        └── ProfileSectionScreen     (optional: drill into medical/learning sections)
```

### Navigation Patterns
- **Child switcher:** Horizontal `ScrollView` of pill `TouchableOpacity` buttons at the top of `ChildrenHomeScreen`. On small screens with 3+ children, pills scroll horizontally.
- **Content tabs:** Use a top tab navigator (`@react-navigation/material-top-tabs`) or a custom horizontal `ScrollView` tab bar beneath the hero card. Each tab renders its own scroll content below.
- **TeacherCard:** Full-width card in a `FlatList` (in case multiple teachers are assigned). "Message" button navigates to `ChatScreen` with `conversationId` param. "Email" uses `Linking.openURL('mailto:...')`.
- **ProfileTab sections:** Use a `SectionList` where each section header is one of the 4 categories (Medical, Learning Profile, Regulation, Support) and items are the fields within.

### Mobile-Specific UX Considerations
- Hero card should be compact on mobile — avatar 60–80px, name + program on one line.
- AttendanceTab: Show a prominent card with "Download the Sagefield App" button using `Linking.openURL(appStoreURL)`.
- Non-enrolled alert: Render as a `View` styled like a yellow/orange warning card pinned above the tab bar, with a "Complete Enrollment" button.
- Tab labels may need to be shortened on small screens (e.g., "Teacher" not "Teacher Info").
- Pull-to-refresh on each tab's `FlatList`/`ScrollView` to re-fetch child data.

### Component Mapping

| Web Component | React Native Equivalent |
|---|---|
| Child switcher pills (flex row) | `ScrollView horizontal` + `TouchableOpacity` pills |
| ChildProfile hero card | Custom `View` with `Image` (avatar) + `Text` |
| Tab bar (5 tabs) | `MaterialTopTabNavigator` or custom `ScrollView` tab bar |
| TeacherCard (grid card) | Full-width `View` card in `FlatList` |
| ProfileTab section cards | `SectionList` with styled section headers |
| Non-enrolled banner | Styled warning `View` with `Button` |
| Message button | `TouchableOpacity` → navigate to ChatScreen |
| Email button | `TouchableOpacity` → `Linking.openURL('mailto:...')` |

---

## Section 3: Supabase Data

### Tables Read

| Table | Schema | Purpose |
|---|---|---|
| `students` | `admin` | Fetch all children for this parent |
| `teacher_students` | `teachers` | Assignments linking teachers to students (with program/classroom) |
| `users` | `admin` | Fetch teacher full_name for each assigned teacher_id |
| `applications` | `parent_app` | Detect non-enrolled children |

### Query Patterns

**Fetch enrolled children:**
```ts
// server-side (page.tsx), admin client
const { data: students } = await supabase
  .schema('admin')
  .from('students')
  .eq('parent_id', userId)
  .eq('is_deleted', false)
  .select('*')
```

**Fetch non-enrolled applications:**
```ts
// server-side, admin client
const { data: apps } = await supabase
  .schema('parent_app')
  .from('applications')
  .eq('user_id', userId)
  .eq('approved', false)  // or status-based check
  .select('id, student_id, status, program')
```

**Fetch teacher assignments** (via `app/actions/teacherAssignments.ts` — `getAllStudentAssignments()`):
```ts
// Query 1: teachers schema, admin client
const { data: rows } = await supabase
  .schema('teachers')
  .from('teacher_students')
  .select('id, teacher_id, student_id, program, classroom')
  .eq('is_deleted', false)

// Query 2: resolve teacher names from admin.users
const { data: teacherUsers } = await supabase
  .schema('admin')
  .from('users')
  .select('id, full_name')
  .in('id', teacherIds)

// Returns: Record<studentId, TeacherAssignment[]>
// TeacherAssignment type: { id, teacher_id, teacher_name, program, classroom }
```

> **Note — hardcoded teacher display data:** Teacher `role`, `image`, `bio`, and `email` are **not stored in any database table**. They are sourced from the `TEACHER_CARD_DATA` constant hardcoded in `app/parent/children/ChildrenPage.tsx` — a `Record<teacherName, { role, image, about, email }>` object keyed by the teacher's full name. On mobile, replicate this constant in the app bundle or serve it from a static config endpoint.

### Client Type
- All fetches are **server-side** in `page.tsx` using the **admin Supabase client**
- Data is passed as props to `ChildrenPage` client component
- No realtime subscriptions on this page

### Mobile Fetching Strategy
- Fetch on screen focus using `useFocusEffect` + `useCallback`
- Cache result in component state or React Query
- Expose teacher assignment lookup via a dedicated **Edge Function** (since it requires admin client access not available on mobile)
