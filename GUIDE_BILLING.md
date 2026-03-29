# GUIDE_BILLING.md — Parent Dashboard: Billing Page

## Section 1: Current Web UI/UX

### Screen Layout
The Billing page has two primary vertical sections plus an optional summer enrollment section:

1. **Pending Payment Requests** — action cards at the top. Each card shows: student name, amount due, description, and a "Pay" button that opens a Stripe Checkout URL.
2. **Payment History** — a scrollable transaction list below. Each row shows: date, description, amount, status badge (succeeded/failed/pending).
3. **Summer Enrollment Grid** — conditionally shown if the parent has an approved summer application. Displays a 12-week grid where each week can be purchased individually.
4. **Detail Sidebar** — a slide-over panel (fixed right, ~400px wide) that appears when clicking a transaction row. Shows full transaction details: Stripe charge ID, amount, method, date, student, description.

### Key Components

| Component | Role |
|---|---|
| Pending request cards | One card per `pending_payment_requests` row; "Pay" button links to Stripe Checkout |
| Transaction list | Maps `stripe_transactions` array; each row is clickable |
| Detail sidebar | Slide-over showing selected transaction's full info |
| Summer weeks grid | 12-column grid; each cell = one week; purchased weeks styled differently |
| Amount formatting | All amounts stored in cents; display divides by 100 (`amount / 100`) |

### State Management
- `selectedTransaction` — the currently clicked transaction (drives sidebar open/close)
- `sidebarOpen: boolean` — controls slide-over visibility
- No tab state; all sections visible on one scroll

### User Interactions
- Click "Pay" on pending request → opens Stripe Checkout URL in same/new tab
- Click transaction row → opens detail sidebar with that transaction's data
- Click X or outside sidebar → closes it
- Click summer week cell → triggers week purchase flow (Stripe Checkout)
- Pull-to-refresh not present on web (static server-rendered page)

---

## Section 2: Mobile Layout Adaptation

### Screen Hierarchy
```
ParentTabNavigator
  └── BillingStack
        ├── BillingHomeScreen       (pending requests + transaction list + summer grid)
        └── TransactionDetailSheet  (bottom sheet, not a new screen)
```

### Navigation Patterns
- **Pending requests:** Rendered as prominent full-width action cards at the top of a `ScrollView`. Each card has a "Pay" button that opens Stripe Checkout via `WebBrowser.openBrowserAsync(stripeUrl)`.
- **Transaction history:** `FlatList` with `onRefresh` / `refreshing` for pull-to-refresh.
- **Transaction detail:** `BottomSheetModal` (from `@gorhom/bottom-sheet`) — slides up from bottom when a row is tapped. No separate screen needed.
- **Summer weeks grid:** Horizontal `ScrollView` containing a `FlatList` (numColumns or a manual row layout). Each week is a `TouchableOpacity` cell. Purchased weeks use a distinct background color.

### Mobile-Specific UX Considerations
- Stripe payment always opens in-app browser (`expo-web-browser`) — never `Linking.openURL` for payment flows, as the user needs to return to the app after payment.
- After payment completes, use `WebBrowser` result to detect completion and trigger a refresh.
- Pending requests should visually stand out — use a colored border or icon badge to indicate action required.
- Transaction status badges: use colored `View` + `Text` (green for succeeded, red for failed, yellow for pending).
- Amount display: always format as `(amount / 100).toFixed(2)` with a `$` prefix.
- Empty state for history: show a card with "No transactions yet."

### Component Mapping

| Web Component | React Native Equivalent |
|---|---|
| Pending request action cards | Full-width `View` cards in a `ScrollView` section |
| "Pay" button → Stripe URL | `TouchableOpacity` → `WebBrowser.openBrowserAsync(url)` |
| Transaction list (table/rows) | `FlatList` with `ListHeaderComponent` for pending section |
| Detail sidebar (slide-over) | `BottomSheetModal` with transaction details |
| Summer weeks grid (12-col) | `ScrollView horizontal` + custom grid layout |
| Status badge (div + class) | `View` + `Text` with inline styles |

---

## Section 3: Supabase Data

### Tables Read

| Table | Schema | Purpose |
|---|---|---|
| `stripe_transactions` | `billing` | Payment history for this parent |
| `pending_payment_requests` | `billing` | Outstanding payments requiring action |
| `applications` | `parent_app` | Detect summer enrollment to show week grid |
| `students` | `admin` | Map `student_id` → student name for display |

### Query Patterns

**Fetch payment history:**
```ts
// server-side (page.tsx), admin client
const { data: transactions } = await supabase
  .schema('billing')
  .from('stripe_transactions')
  .eq('parent_id', userId)
  .eq('is_deleted', false)
  .order('created_at', { ascending: false })
  .select('*')
```

**Fetch pending payment requests:**
```ts
// server-side (page.tsx), admin client
const { data: pendingRequests } = await supabase
  .schema('billing')
  .from('pending_payment_requests')
  .eq('parent_id', userId)
  .eq('status', 'pending')
  .select('*')
```

**Fetch summer applications (to show week grid):**
```ts
// server-side (page.tsx), admin client
const { data: summerApps } = await supabase
  .schema('parent_app')
  .from('applications')
  .eq('user_id', userId)
  .eq('approved', true)
  .in('program', ['summer_26', 'both'])
  .select('id, student_id, program')
```

**Fetch student names (for display):**
```ts
// server-side, admin client
const { data: students } = await supabase
  .schema('admin')
  .from('students')
  .in('id', studentIds)
  .select('id, first_name, last_name')
```

### Client Type
- All queries use the **admin Supabase client** (bypasses RLS)
- On mobile, expose data via **Edge Functions** since admin client is not safe on device
- Suggested Edge Function: `GET /billing-summary` → returns `{ transactions, pendingRequests, summerWeeks }`

### No Realtime
- No realtime subscriptions on billing page
- Use `useFocusEffect` on mobile to refetch when user returns to screen (e.g., after Stripe payment)
- Consider polling every 30s if pending requests exist (to detect payment completion)

### Storage
- No storage operations on billing page
- Stripe receipts/invoices are handled externally via Stripe dashboard URLs (if surfaced in transaction data)
