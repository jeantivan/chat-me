# Hybrid Client State Architecture: TanStack Query for Server Cache & Zustand for UI State

We decided to decouple server-synchronized entities from client-only UI state by adopting a **hybrid state model**: TanStack Query v5 manages asynchronous server data and WebSocket cache patching, while Zustand manages synchronous transient UI state.

## Considered Options

- **Hybrid Model (TanStack Query + Zustand) (Chosen)**:
  - TanStack Query manages `chats`, `messages` (cursor-paginated infinite queries), `contacts`, and `userProfile`. Incoming Socket.IO events directly mutate the query cache via `queryClient.setQueryData`.
  - Zustand manages transient client-only state: drawer visibility (`LeftDrawer`, `RightDrawer`), active modals, search filters, and active draft messages in the Lexical editor.
- **Monolithic Zustand Store (Previous / Rejected)**:
  - Storing all messages and chats in a single nested Zustand array (`state.chats[i].messages`) creates unbounded memory consumption, lacks built-in cursor pagination, complicates garbage collection, and requires hand-rolled cache invalidation.
- **Pure TanStack Query (No Zustand)**:
  - Rejected because transient UI state (e.g., drawer sliding animations, active modal toggles, local editor drafts) is awkward and verbose to manage via query client cache or URL params.

## Consequences

- Infinite scroll pagination (`useInfiniteQuery`) replaces loading entire chat histories into memory.
- Optimistic message sends render instantaneously with `status: 'idle'`, transitioning to `status: 'send'` upon Socket.IO acknowledgment.
- Unread counts and chat list ordering update reactively in client memory without network round-trips.
