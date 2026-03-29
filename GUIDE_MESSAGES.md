# GUIDE_MESSAGES.md — Parent Dashboard: Messages Page

## Section 1: Current Web UI/UX

### Screen Layout
The Messages page is a classic two-panel chat layout:
- **Left sidebar (~320px fixed width):** Search input at top, "New Message" button, then a scrollable list of conversation rows (avatar, other user's name, last message preview, timestamp, unread badge).
- **Right chat area (flex-fill):** When a conversation is selected — header with avatar + name, a scrollable message bubble list, and a text input bar at the bottom with an image attachment button.
- **Compose new message:** Clicking "New Message" transforms the sidebar or opens an overlay with a "To:" field that has a user search dropdown. Typing searches for staff/teachers by name.

### Key Components

| Component | Role |
|---|---|
| Conversation list | Sidebar rows; clicking sets `activeConversationId` |
| Search input | Filters conversation list by participant name |
| "New Message" button | Triggers compose mode; shows user search |
| Chat header | Avatar + name of the other participant |
| Message bubbles | Green = sent by current user; gray = received |
| Image attachments | Inline image previews in bubbles; clicking opens full-size |
| Text input bar | Controlled input; sends on Enter or button click |
| Image picker button | Opens file input for image attachment |
| Unread badge | Count of unread messages on conversation row |

### State Management
- `activeConversationId: string | null` — which conversation is open
- `composing: boolean` — whether compose-new UI is active
- `searchQuery: string` — filters conversation list
- `toUserSearch: string` — user search input in compose mode
- `messages: Message[]` — current conversation's messages (updated via realtime)
- `inputText: string` — current draft message

### User Interactions
- Click conversation row → sets `activeConversationId`, loads messages, marks as read
- Click "New Message" → enters compose mode with "To:" search
- Select user from search dropdown → starts or opens existing conversation with that user
- Type message + Enter/Send → inserts new message row
- Attach image → opens file picker; image uploaded to storage, URL inserted in message
- Realtime: new messages from other users appear in the bubble list automatically

---

## Section 2: Mobile Layout Adaptation

### Screen Hierarchy
```
ParentTabNavigator
  └── MessagesStack
        ├── ConversationListScreen    (sidebar becomes full screen)
        ├── ChatScreen                (chat area becomes full screen)
        └── ComposeScreen             (modal or stack screen)
```

### Navigation Patterns
- **ConversationListScreen:** Full-screen `FlatList` of conversation rows. Top bar has a search input and a compose button (pencil icon).
- **ChatScreen:** Navigate to on row tap, passing `conversationId` and `otherUserName`/`otherUserAvatar` as params. Header shows the other user's name + back arrow. Message `FlatList` is inverted (`inverted={true}`) so newest messages appear at the bottom without manual scrolling.
- **ComposeScreen:** Push as a modal (`presentation: 'modal'`) or a stack screen. Contains a "To:" `TextInput` with a user search results list below it.

### Mobile-Specific UX Considerations
- `KeyboardAvoidingView` wrapping the chat input is critical — use `behavior='padding'` on iOS and `behavior='height'` on Android.
- `FlatList inverted` for messages: render list upside-down so new messages naturally appear at the bottom; also simplifies "scroll to latest" logic.
- Image picker: use `expo-image-picker` with `mediaTypes: Images`. Supports HEIC on iOS — convert to JPEG before upload if the backend requires it.
- Mark messages as read when `ChatScreen` gains focus (`useFocusEffect`) — call the mark-read Edge Function.
- **Unread badge** on the Messages tab icon: compute from all conversations' unread counts; update in realtime.
- Realtime subscription: start when entering `ChatScreen`, stop on unmount. The subscription pattern is identical to web.
- Image attachments in bubbles: use `<Image>` with a fixed height and `resizeMode='cover'`; tapping opens a full-screen modal or `ImageViewer`.

### Component Mapping

| Web Component | React Native Equivalent |
|---|---|
| Sidebar conversation list | `ConversationListScreen` with `FlatList` |
| Search input (sidebar top) | `TextInput` in list header |
| "New Message" button | Header right icon → `ComposeScreen` |
| Chat area (right panel) | `ChatScreen` (full screen) |
| Message bubbles (div) | `View` + `Text` with conditional alignment |
| Image bubble | `Image` component inside bubble `View` |
| Text input bar | `TextInput` + `TouchableOpacity` Send button in `KeyboardAvoidingView` |
| Image picker button | `TouchableOpacity` → `expo-image-picker` |
| Unread badge (sidebar row) | Unread count `View` badge on `ConversationListItem` |
| Unread badge (tab icon) | Tab bar badge via `tabBarBadge` in navigator config |
| Compose "To:" dropdown | `TextInput` + `FlatList` below for search results |

---

## Section 3: Supabase Data

### Tables Read

| Table | Schema | Purpose |
|---|---|---|
| `conversation_participants` | `messaging` | Find which conversations this user belongs to |
| `conversations` | `messaging` | Fetch conversation metadata (updated_at, last message) |
| `messages` | `messaging` | Fetch messages for active conversation |
| `users` | `admin` | Look up other participant's name, avatar |

### Query Patterns

**Step 1 — Get conversation IDs for this user:**
```ts
// user-scoped client
const { data: participantRows } = await supabase
  .schema('messaging')
  .from('conversation_participants')
  .eq('user_id', userId)
  .select('conversation_id')

const conversationIds = participantRows.map(r => r.conversation_id)
```

**Step 2 — Fetch conversations (sorted by most recent):**
```ts
// user-scoped client
const { data: conversations } = await supabase
  .schema('messaging')
  .from('conversations')
  .in('id', conversationIds)
  .order('updated_at', { ascending: false })
  .select('*')
```

**Fetch messages for active conversation:**
```ts
// user-scoped client
const { data: messages } = await supabase
  .schema('messaging')
  .from('messages')
  .eq('conversation_id', activeConversationId)
  .order('created_at', { ascending: true })
  .select('*')
```

**Fetch unread count per conversation:**
```ts
// user-scoped client
const { count } = await supabase
  .schema('messaging')
  .from('messages')
  .eq('conversation_id', conversationId)
  .neq('sender_id', userId)
  .is('read_at', null)
  .select('id', { count: 'exact', head: true })
```

**Mark messages as read:**
```ts
// Requires admin client — use Edge Function on mobile
// Edge Function: POST /mark-messages-read { conversationId, userId }
// Updates: messaging.messages SET read_at = now() WHERE conversation_id = X AND sender_id != userId AND read_at IS NULL
```

**Look up other participant's profile:**
```ts
// Requires admin client — use Edge Function on mobile
// Edge Function: GET /user-profile?userId=X
// Reads: admin.users (id, full_name, avatar_url, email)
```

**User search for compose (new message):**
```ts
// Edge Function: GET /search-users?q=teacher+name
// Reads: admin.users WHERE role IN ('teacher', 'admin') AND full_name ILIKE '%query%'
```

### Realtime Subscription

```ts
// Start when ChatScreen mounts, clean up on unmount
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'messaging',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      setMessages(prev => [...prev, payload.new as Message])
    }
  )
  .subscribe()

// Cleanup:
return () => { supabase.removeChannel(channel) }
```

### Storage — Image Attachments

**Bucket:** `message-images` (private bucket)

**Upload path:** `{userId}/{conversationId}/{timestamp}-{filename}`

**Upload on mobile:**
```ts
// 1. Pick image via expo-image-picker
const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images' })

// 2. Convert to Blob/ArrayBuffer
const response = await fetch(result.assets[0].uri)
const blob = await response.blob()

// 3. Upload via user-scoped client (if bucket RLS allows) or Edge Function
const { data } = await supabase.storage
  .from('message-images')
  .upload(`${userId}/${conversationId}/${Date.now()}-${filename}`, blob)

// 4. Get public URL (if public bucket) or signed URL
const { data: { publicUrl } } = supabase.storage
  .from('message-images')
  .getPublicUrl(data.path)

// 5. Include URL in message insert
```

### Client Type Summary

| Operation | Client |
|---|---|
| List conversations / messages | User-scoped Supabase client |
| Send message | User-scoped Supabase client |
| Mark messages read | Edge Function (admin client) |
| Look up other user profile | Edge Function (admin client) |
| Search users for compose | Edge Function (admin client) |
| Realtime subscription | User-scoped Supabase client |
| Image upload | User-scoped client OR Edge Function |
