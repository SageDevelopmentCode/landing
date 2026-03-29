# GUIDE_FORMS.md — Parent Dashboard: Forms Page

## Section 1: Current Web UI/UX

### Screen Layout
The Forms page is a single-panel document list with a child switcher:
- **Top: Child switcher pills** — one per enrolled child; clicking switches which child's documents are shown.
- **Document list:** A vertical list of document rows. Each row shows: document name, completion status badge (completed/incomplete), and a "View" or "Open" button.
- **Modals:** Clicking a document opens a **full-screen modal overlay** showing the read-only form content. The modal has a close (X) button.

Only **completed** documents are shown in the list. Incomplete forms are not displayed here (parents complete them during the enrollment application flow).

### 9 Document Types and Their Modals

| # | Document Name | Modal Component | Data Source |
|---|---|---|---|
| 1 | Enrollment Contract (School Year) | `ContractModal` | `enrollment_signatures` (contract_id = school year) |
| 2 | Enrollment Contract (Summer) | `ContractModal` | `enrollment_signatures` (contract_id = summer) |
| 3 | Health Information Form | `HealthFormModal` | `student_health_info` |
| 4 | Medication Plan | `MedicationPlanModal` | `student_medication_plan` + `student_medications` |
| 5 | Photo Release Consent | `PhotoReleaseModal` | `student_photo_release_consent` |
| 6 | Assumption of Risk | `AssumptionOfRiskModal` | `enrollment_signatures` (specific section) |
| 7 | Authorized Pickup Plan | `AuthorizedPickupModal` | `student_authorized_pickup_plan` + `student_authorized_pickup_persons` |
| 8 | Health Statement | `HealthStatementModal` | `student_health_statement` |
| 9 | Immunization Records | `ImmunizationModal` | Storage bucket file list |

### State Management
- `activeChildIndex: number` — which child's forms are shown
- `openModal: string | null` — which document modal is open (by document key)
- No form editing; all modals are read-only

### User Interactions
- Click child pill → updates `activeChildIndex`, re-renders document list
- Click document row / "View" button → sets `openModal`, renders that document's modal
- Click X or backdrop → clears `openModal`, closes modal
- Click immunization file link → opens file URL in new tab

---

## Section 2: Mobile Layout Adaptation

### Screen Hierarchy
```
ParentTabNavigator
  └── FormsStack
        ├── FormsHomeScreen           (child switcher + document list)
        ├── ContractScreen            (read-only contract view)
        ├── HealthFormScreen          (read-only health info)
        ├── MedicationPlanScreen      (read-only medication plan)
        ├── PhotoReleaseScreen        (read-only photo release)
        ├── AssumptionOfRiskScreen    (read-only risk form)
        ├── AuthorizedPickupScreen    (read-only pickup plan)
        ├── HealthStatementScreen     (read-only health statement)
        └── ImmunizationScreen        (file list with download links)
```

### Navigation Patterns
- **Document list:** `FlatList` in `FormsHomeScreen`. Each row is a `TouchableOpacity` that navigates to the corresponding screen passing `studentId` as a param.
- **Document screens:** Each is a dedicated **Stack screen** (not a modal) — this gives a natural back navigation experience on mobile, unlike the web's full-screen overlay.
- **Child switcher:** Horizontal `ScrollView` of `TouchableOpacity` pills at the top of `FormsHomeScreen`. Updates `activeChildId` in state, filtering the document list.
- **Immunization records:** `ImmunizationScreen` shows a `FlatList` of file entries with file name, size, and a "Download" / "View" button per file using `Linking.openURL(signedUrl)`.

### Mobile-Specific UX Considerations
- Read-only forms on mobile should use `ScrollView` with non-editable `Text` components (not `TextInput`). Format data as labeled fields: `Label: Value` pairs.
- For contracts with long legal text: render in a `ScrollView` with padded `Text` blocks. Consider a "Print" option (opens a web URL or PDF URL if available).
- No signature capture is needed — forms are completed during enrollment (web flow); mobile is view-only.
- Completion status badge: show a green checkmark icon + "Completed" or a gray dash + "Not submitted" per row.
- Immunization files: use signed URLs from Supabase Storage (since bucket is private). Fetch signed URLs server-side or via Edge Function.
- If a document hasn't been completed, do not show it in the list — consistent with web behavior.
- Completed-only filtering: determine completeness per document type before rendering the list (see data section).

### Component Mapping

| Web Component | React Native Equivalent |
|---|---|
| Child switcher pills | `ScrollView horizontal` + `TouchableOpacity` pills |
| Document list (div rows) | `FlatList` with `DocumentRow` component |
| "View" button → modal | `TouchableOpacity` → `navigation.navigate('ContractScreen', { studentId })` |
| Full-screen modal overlay | Dedicated Stack screen with back navigation |
| Completion badge (div/class) | `View` + icon + `Text` (green check or gray dash) |
| Contract text (HTML) | `ScrollView` + `Text` blocks (or `react-native-render-html`) |
| Immunization file link | `TouchableOpacity` → `Linking.openURL(signedUrl)` |
| ContractModal | `ContractScreen` |
| HealthFormModal | `HealthFormScreen` |
| MedicationPlanModal | `MedicationPlanScreen` |
| PhotoReleaseModal | `PhotoReleaseScreen` |
| AssumptionOfRiskModal | `AssumptionOfRiskScreen` |
| AuthorizedPickupModal | `AuthorizedPickupScreen` |
| HealthStatementModal | `HealthStatementScreen` |
| ImmunizationModal | `ImmunizationScreen` |

---

## Section 3: Supabase Data

All queries use the **user-scoped Supabase client** (RLS ensures parents only see their own children's data). No admin client needed for reads on this page.

### Tables Read

| Table | Schema | Purpose |
|---|---|---|
| `applications` | `parent_app` | Get list of approved children for the child switcher |
| `enrollment_signatures` | `parent_app` | Determine contract/section completion; read contract content |
| `student_health_info` | `parent_app` | Health Information Form data |
| `student_health_statement` | `parent_app` | Health Statement form data |
| `student_medication_plan` | `parent_app` | Medication Plan header data |
| `student_medications` | `parent_app` | Individual medications list (child of medication plan) |
| `student_photo_release_consent` | `parent_app` | Photo Release Consent data |
| `student_authorized_pickup_plan` | `parent_app` | Authorized Pickup Plan header |
| `student_authorized_pickup_persons` | `parent_app` | Individual pickup persons list |

### Query Patterns

**Get enrolled children for child switcher:**
```ts
// user-scoped client
const { data: applications } = await supabase
  .schema('parent_app')
  .from('applications')
  .eq('user_id', userId)
  .eq('approved', true)
  .select('id, student_id, student_first_name, student_last_name, program')
```

**Check contract completion (enrollment signatures):**
```ts
// user-scoped client — group by contract_id + section_id to check all sections signed
const { data: signatures } = await supabase
  .schema('parent_app')
  .from('enrollment_signatures')
  .eq('student_id', studentId)
  .select('id, contract_id, section_id, signed_at, signer_name')
```
- A contract is "complete" if all required `section_id`s for that `contract_id` have a `signed_at` value.

**Fetch health info:**
```ts
const { data: healthInfo } = await supabase
  .schema('parent_app')
  .from('student_health_info')
  .eq('student_id', studentId)
  .single()
  .select('*')
```

**Fetch health statement:**
```ts
const { data: healthStatement } = await supabase
  .schema('parent_app')
  .from('student_health_statement')
  .eq('student_id', studentId)
  .single()
  .select('*')
```

**Fetch medication plan + medications:**
```ts
const { data: medPlan } = await supabase
  .schema('parent_app')
  .from('student_medication_plan')
  .eq('student_id', studentId)
  .single()
  .select('*, student_medications(*)')
```

**Fetch photo release:**
```ts
const { data: photoRelease } = await supabase
  .schema('parent_app')
  .from('student_photo_release_consent')
  .eq('student_id', studentId)
  .single()
  .select('*')
```

**Fetch authorized pickup plan + persons:**
```ts
const { data: pickupPlan } = await supabase
  .schema('parent_app')
  .from('student_authorized_pickup_plan')
  .eq('student_id', studentId)
  .single()
  .select('*, student_authorized_pickup_persons(*)')
```

### Storage — Immunization Records

**Bucket:** `immunization-records` (private bucket)

**Path convention:** `{parentId}/{studentId}/`

**List files:**
```ts
// user-scoped client (if RLS allows) OR Edge Function
const { data: files } = await supabase.storage
  .from('immunization-records')
  .list(`${parentId}/${studentId}`)

// files is an array of: { name, id, updated_at, created_at, last_accessed_at, metadata }
```

**Get signed URL for each file (private bucket):**
```ts
const { data: { signedUrl } } = await supabase.storage
  .from('immunization-records')
  .createSignedUrl(`${parentId}/${studentId}/${file.name}`, 3600)  // 1 hour expiry
```

**Religious exemption affidavits (separate bucket):**
```ts
// Same pattern, different bucket:
const { data: files } = await supabase.storage
  .from('religious-exemption-affidavits')
  .list(`${parentId}/${studentId}`)
```

### Client Type Summary

| Operation | Client |
|---|---|
| All table reads | User-scoped Supabase client (RLS filters to own data) |
| Storage file list | User-scoped client (if bucket RLS is set up) OR Edge Function |
| Signed URL generation | User-scoped client OR Edge Function |

### No Realtime
- No realtime subscriptions on Forms page
- Forms are completed once during enrollment; content rarely changes
- Fetch on screen focus with `useFocusEffect` is sufficient

### Completeness Logic (per document)

| Document | Is Complete When |
|---|---|
| Contracts | All required sections in `enrollment_signatures` have `signed_at IS NOT NULL` |
| Health Info | `student_health_info` row exists for `student_id` |
| Health Statement | `student_health_statement` row exists for `student_id` |
| Medication Plan | `student_medication_plan` row exists for `student_id` |
| Photo Release | `student_photo_release_consent` row exists for `student_id` |
| Authorized Pickup | `student_authorized_pickup_plan` row exists for `student_id` |
| Immunization Records | `immunization-records` bucket has ≥1 file at `{parentId}/{studentId}/` |
