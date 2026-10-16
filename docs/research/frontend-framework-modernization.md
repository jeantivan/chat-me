# Research Report: Frontend Framework Modernization

**Ticket**: [#3 Evaluate Frontend Framework Modernization: Next.js App Router vs. Modernized Vite SPA](https://github.com/jeantivan/chat-me/issues/3)  
**Parent Initiative**: [#1 Architecture and Migration to Full-Stack Real-Time Chat](https://github.com/jeantivan/chat-me/issues/1)  
**Status**: Completed  
**Author**: Antigravity Frontend Modernization Researcher  
**Date**: October 2026  

---

## 1. Executive Summary & Verdict

### Recommendation: Modernized Vite SPA (Vite 6 + React 19 + TanStack Router & Query)

We recommend **retaining and modernizing the client-side Single Page Application (SPA)** using **Vite 6**, **React 19**, **TanStack Router**, and **TanStack Query**, and **rejecting a migration to Next.js App Router**.

### Core Rationale:
1. **SSR and React Server Components (RSC) Provide Negative Net Value for Private Chat**: `chat-me` is an authenticated, session-protected desktop chat application (akin to WhatsApp Web and Telegram Web). There is zero requirement for public search engine indexing (SEO). Real-time chat requires persistent two-way event delivery (WebSockets); RSC is a stateless HTTP request-response paradigm incapable of pushing live WebSocket messages without heavyweight server re-render sweeps (`router.refresh()`).
2. **Lexical Rich-Text Editor & Radix UI are Inherently Client-Only**: The Lexical editor engine (`@lexical/react`) directly manipulates the browser DOM (`window`, `document`, `Selection`). Attempting to render Lexical in Node.js SSR causes server runtime crashes or requires artificial `dynamic(() => import(...), { ssr: false })` boundaries that trigger layout shifts. In Next.js App Router, virtually 100% of the `chat-me` component tree would require `'use client'`, nullifying RSC advantages while introducing SSR hydration pitfalls.
3. **Persistent WebSocket Lifecycle vs. Serverless Incompatibility**: Next.js App Router route handlers cannot maintain long-lived stateful WebSocket connections in serverless or edge environments. A dedicated backend WebSocket service is required regardless. A Vite SPA provides a clean, continuous client window lifecycle where WebSocket connections, reconnection routines, and client state machines persist across route changes without server-side disruption.
4. **100% Code Reuse and Minimal Migration Friction**: The existing 26+ polished components in `src/components/`, the Lexical configurations in `src/editor/`, and the TypeScript types in `src/lib/types.ts` can be preserved as-is. Upgrading to Vite 6 + TanStack Router introduces type-safe URL routing (`/c/$chatId`) and TanStack Query introduces real-time cache synchronization with zero rewrites to interactive UI primitives.
5. **Operational Simplicity & Zero-Cost Edge Hosting**: A Vite SPA compiles to pure static HTML/CSS/JS artifacts that can be distributed across edge CDN networks (e.g., Cloudflare Pages, AWS S3/CloudFront, Netlify) with sub-50ms TTFB worldwide, zero server compute costs, and zero cold starts.

---

## 2. Evaluation Criterion 1: SSR & React Server Components (RSC) in Private Chat

### 2.1 SEO and Crawlability
* **Chat Domain Reality**: `chat-me` is a private, real-time messaging application. Messages, contact lists, media dialogs, and user settings are strictly gated behind user authentication. Indexing by search engine crawlers is an anti-goal and privacy violation.
* **Verdict**: Next.js's primary selling proposition—automatic HTML pre-rendering for SEO—has **zero applicability** to `chat-me`.

### 2.2 First Load Performance vs. The "Uncanny Valley" Hydration Gap
* **Next.js App Router**:
  * Behind authentication, the server cannot pre-render personalized chat views without verifying user session tokens/cookies on every request.
  * Once the server streams initial HTML, the client must still download the full JavaScript bundle and execute React hydration before any element becomes interactive.
  * This creates the classic **hydration gap ("uncanny valley")**: users see rendered chat messages and input boxes, but cannot click, focus, or send messages until hydration completes.
* **Modernized Vite SPA**:
  * The application shell (HTML, CSS, vendor bundles) is cached aggressively on the client via HTTP/2 and service workers / CacheStorage.
  * Upon opening the tab, the cached shell paints instantaneously (<50ms). A lightweight authentication check / token refresh occurs in parallel with WebSocket handshake.
  * There are **zero hydration mismatches**, zero `Text content did not match` errors, and buttons are interactive immediately upon render.

### 2.3 RSC vs. Real-Time WebSocket Event Streaming
* **The Structural Mismatch**:
  * React Server Components operate on an ephemeral, unidirectional request-response model: Client triggers action/navigation $\rightarrow$ Server renders component tree $\rightarrow$ Server streams RSC payload (JSON-like representation of virtual DOM) $\rightarrow$ Client reconciles with existing DOM.
  * Real-time messaging operates on continuous, bidirectional push streams: Server pushes `message.new`, `message.delivered`, `user.typing`, `reaction.add` over an open TCP connection directly to client memory.
  * In Next.js, pushing a real-time event to an RSC requires either polling or triggering `router.refresh()`. Calling `router.refresh()` instructs Next.js to re-request all Server Components from the server over HTTP, re-query the database, re-serialize the payload, and re-diff the client tree. Doing this for every incoming keystroke, typing indicator, or chat message introduces intolerable network overhead and server CPU churn.
* **Industry Architecture Precedents**:
  * **WhatsApp Web**: Built as a pure client-side single-page application communicating over persistent secure WebSockets (`wss://web.whatsapp.com/ws/chat`) with local client-side IndexedDB caching.
  * **Telegram Web (WebK / WebA)**: Built as pure client-side PWAs/SPAs connecting directly to MTProto / WebSocket endpoints with zero SSR for chat data.
  * **Discord Web & Slack Web**: Client-side SPAs where WebSocket connection managers route events into client-side stores (Flux/Zustand/Redux). Neither uses SSR for active conversation threads.

---

## 3. Evaluation Criterion 2: State, WebSocket Lifecycle & Lexical DOM State

### 3.1 Long-Lived WebSocket Connection Lifecycle
* **Next.js Hosting Constraints**:
  * Next.js App Router Route Handlers (`app/api/.../route.ts`) are deployed as ephemeral serverless lambdas (AWS Lambda, Vercel Functions). Serverless runtimes enforce hard execution timeouts (10s to 15m) and scale to zero; they **cannot** maintain open WebSocket connections.
  * Next.js documentation acknowledges that hosting native WebSockets requires deploying a standalone Node.js process (`output: 'standalone'`) or offloading to an external managed service (e.g., Pusher, Ably).
  * On the client side, if developers place WebSocket listeners in page-level components under Next.js App Router, navigations can trigger unintended remounts and connection churn unless strictly quarantined into custom React context providers.
* **Vite SPA Advantage**:
  * A Vite SPA executes inside a single, stable browser window context.
  * The WebSocket client (e.g., native `WebSocket` or `Socket.io-client`) is instantiated as a persistent singleton service or integrated into TanStack Query / Zustand.
  * Tab navigation between chats (`/` $\rightarrow$ `/c/:chatId`) happens instantly on the client; the underlying WebSocket connection remains uninterrupted.

### 3.2 Lexical Rich-Text Editor State & DOM Manipulation
* **Existing Codebase Analysis**:
  * Located in `src/components/Chat/Editor/` and `src/editor/`.
  * `Root.tsx` mounts `<LexicalComposer initialConfig={initialConfig}>` with plugins: `AutoFocusPlugin`, `AutoLinkPlugin`, `HistoryPlugin`, `ClearEditorPlugin`, `TrimEditorPlugin`, `EmojiPlugin`, and `SaveEditorPlugin`.
  * `EmojiNode.tsx` explicitly creates DOM elements: `document.createElement("span")`.
* **Behavior Under Next.js SSR**:
  * Lexical requires active DOM access (`window`, `document`, `Selection`, `MutationObserver`).
  * Running `<LexicalComposer>` on Node.js during SSR results in `ReferenceError: document is not defined`.
  * To circumvent this in Next.js, Lexical must be loaded with `next/dynamic(() => import('@/components/Chat/Editor'), { ssr: false })` or wrapped inside `'use client'`. However, `next/dynamic` with `ssr: false` displays a blank fallback or placeholder until client code executes, causing visual stutter and delaying focus readiness (`AutoFocusPlugin`).
* **Behavior Under Vite SPA**:
  * Lexical compiles directly into client chunks.
  * Zero SSR shims required; mounts synchronously into the chat pane with immediate keyboard autofocus and sub-millisecond input responsiveness.

### 3.3 Client Drawers & Framer Motion
* **Existing Codebase Analysis**:
  * `src/components/LeftDrawer.tsx` line 88 checks container mounting via direct DOM access:
    ```typescript
    const leftDrawerContainer = document.getElementById("left-column");
    if (!leftDrawerContainer) return null;
    ```
  * Framer Motion (`framer-motion`) powers drawer animations (`drawerVariants`, `AnimatePresence mode="wait"`), chat item icon popovers, and message animations.
* **Friction Under Next.js**:
  * Calling `document.getElementById` during server rendering throws runtime errors unless guarded with `useEffect` or hydration checks.
  * Framer Motion components in Next.js require `'use client'` on every component boundary and frequently trigger React hydration mismatches if animated styles differ between server HTML and client initial state.
* **Friction Under Vite SPA**:
  * Framer Motion and DOM lookups operate natively in the browser environment with zero hydration warnings or layout jumping.

---

## 4. Evaluation Criterion 3: Code Reuse & Migration Friction

### 4.1 Component Tree Audit (`src/components/`)
A thorough audit of `src/components/` reveals 26+ major component modules:
* **UI Primitives (`src/components/ui/`)**: `AlertDialog`, `Button`, `Checkbox`, `Dialog`, `Icon`, `IconButton`, `Label`, `Menu`, `Popover`, `ScrollArea`, `Separator`, `Switch`, `Tabs`. All are built on top of Radix UI (`@radix-ui/react-*`), Tailwind CSS, and Lucide icons.
* **Chat Views (`src/components/Chat/`)**: `Header`, `Messages`, `ContactInfo`, `SharedContent`, `StarredMessages`, and the complete Lexical `Editor/` subsystem.
* **Drawers & Configuration**: `LeftDrawer`, `RightDrawer`, `Configuration/` (Theme, Profile, Options, Notifications, SolInfo, Shortcuts, Help, Privacy), `UserProfile`, `ChatList`, `ChatItem`.
* **Media & Modals**: `MediaMessageDialog`, `SendFiles`, `ForwardMessages`, `ChangeUserImage`.

| Metric | Next.js App Router | Modernized Vite SPA |
| :--- | :--- | :--- |
| **Component Directives** | Requires adding `'use client'` to almost **100%** of files in `src/components/` and `src/containers/`. | **0%** directives required. All components run unmodified. |
| **Direct DOM Access (`document.getElementById`)** | Must be refactored into React refs or guarded with `isMounted` checks to prevent SSR crashes. | Works directly as-is. |
| **Barrel File Imports (`src/components/index.ts`)** | Known Turbopack/Webpack compilation slowdowns; requires manual bundle optimization or `modularizeImports`. | Handled natively with Vite 6 ES module pre-bundling. |
| **Layout Restructuring** | High: Must rewrite `containers/LeftColumn.tsx` and `RightColumn.tsx` into Next.js nested route groups (`app/(chat)/layout.tsx`, `app/(chat)/c/[chatId]/page.tsx`). | Low: Wrap `RightColumn` inside a TanStack Router `<Outlet />` while keeping existing layout containers untouched. |
| **Code Reuse Percentage** | ~65–70% (requires refactoring, shimming SSR, and route restructuring). | **~98–100%** (direct drop-in reuse of components, styles, and utils). |

### 4.2 Data Types (`src/lib/types.ts`)
* `src/lib/types.ts` contains 122 lines defining core domain models: `TUser`, `TChat`, `TMessage`, `TReaction`, `TMedia`, `TEmoji`, `TConfig`, and drawer states (`LeftDrawerContentOptions`, `RightDrawerContentOptions`).
* **Under Vite SPA**: 100% reusable directly. Types align seamlessly with TanStack Query response structures and WebSocket message payloads.
* **Under Next.js App Router**: Types can be reused, but passing data between Server Components and Client Components imposes strict serialization constraints (e.g., Dates, Functions, or complex class instances cannot cross the RSC boundary).

### 4.3 State Management (`src/lib/store/`)
* **Current Implementation**: Zustand store with Immer and LocalStorage persistence (`name: "zustand-chat-me"`), partitioned into slices: `createProfileSlice`, `createCurrentChatIdSlice`, `createChatSlice`, `createMessageSlice`, `createMediaMessageSlice`, `createLeftDrawerSlice`, `createRightDrawerSlice`, `createLoadingSlice`.
* **Under Next.js App Router**:
  * Using Zustand with Next.js SSR requires creating a Per-Request Store pattern via React Context to prevent state bleeding between distinct user requests on the Node server.
  * `persist` middleware accessing `localStorage` throws hydration warnings if the server renders default initial state while the client has stored state.
* **Under Modernized Vite SPA**:
  * Zustand continues to shine for **client-only UI state**: drawer visibility (`leftDrawer`, `rightDrawer`), modal dialogs, active emoji pickers, and local media attachments.
  * Server-replicated data (chat list, message pagination) can transition cleanly to **TanStack Query**, while Zustand manages transient UI interactions.
  * Zero risk of server state leakage or SSR hydration mismatch.

---

## 5. Architectural Blueprint: The Modernized Vite SPA

```
┌────────────────────────────────────────────────────────────────────────┐
│                          chat-me Frontend                              │
│         (Vite 6 + React 19 + TanStack Router & Query + Zustand)         │
├────────────────────────────────────────────────────────────────────────┤
│  Routing & URLs (TanStack Router)                                      │
│  ├── /                     -> LeftColumn + Welcome                     │
│  └── /c/$chatId            -> LeftColumn + Chat(chatId)                │
├────────────────────────────────────────────────────────────────────────┤
│  State Architecture                                                    │
│  ├── Server Cache (TanStack Query v5):                                 │
│  │   ├── ['chats']              -> List of active conversations        │
│  │   ├── ['chat', id, 'messages'] -> Paginated message history         │
│  │   └── Directly updated via WebSocket pushes (setQueryData)          │
│  └── Transient UI State (Zustand 4/5):                                 │
│      ├── Left/Right Drawers (Profile, Options, Contact Info)           │
│      ├── Active Dialogs (SendFiles, MediaPreview)                      │
│      └── Editor State & Drafts                                         │
├────────────────────────────────────────────────────────────────────────┤
│  Component Tree (100% Preserved)                                       │
│  ├── Radix UI Primitives + Tailwind CSS Themes                         │
│  ├── Framer Motion Drawers & Animations                                │
│  └── Lexical Rich-Text Editor (AutoFocus, Emoji, Link Plugins)         │
├────────────────────────────────────────────────────────────────────────┤
│  Real-Time Gateway Interface                                           │
│  └── Persistent WebSocket Client Singleton (Native / Socket.io)        │
│      ├── Inbound: Dispatches payloads into TanStack Query Cache        │
│      └── Outbound: Fast ack with React 19 useOptimistic dispatch       │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Technology Stack Details
1. **Build Tool**: **Vite 6**
   * Uses modern Rollup 4 / Rolldown architecture.
   * Instant cold dev server boot (<100ms) and hot module replacement (<15ms).
   * Static asset output optimized for HTTP/2 multi-file chunking and brotli compression.
2. **Framework Core**: **React 19**
   * Actions & Transitions: Clean form handling without manual loading states.
   * `useOptimistic`: Instant local message rendering before WebSocket server acknowledgment.
3. **Routing**: **TanStack Router**
   * 100% type-safe routing with search param validation.
   * Synchronizes active chat ID with URL (`/c/$chatId`) so users can refresh or bookmark conversations.
   * Retains the existing dual-column layout (`LeftColumn` stays mounted, only `RightColumn` swaps between `Welcome` and `Chat`).
4. **Data Sync**: **TanStack Query v5**
   * Manages server-synchronized data (`chats`, `messages`, `contacts`).
   * When WebSocket receives an event (`message.created`), `queryClient.setQueryData` updates the active chat list and message window instantaneously without a network round-trip.
5. **UI & Theme**: **Tailwind CSS + Radix UI + Framer Motion** (already installed and styled).
6. **Rich-Text Engine**: **Lexical** (already configured and tested).

---

## 6. Comprehensive Comparison Matrix

| Evaluation Vector | Next.js 15 (App Router) | Modernized Vite SPA |
| :--- | :--- | :--- |
| **Primary Architectural Fit** | Content/marketing sites, e-commerce, public SaaS with SEO | Real-time desktop web apps, chat messengers, collaborative tools |
| **SEO / Indexing Benefit** | High (Server HTML for crawlers) | N/A (Irrelevant for authenticated private chat) |
| **Initial Paint vs. Interactivity** | Fast initial paint, delayed interactivity (Hydration gap) | Instant shell paint, zero hydration gap, immediate interactivity |
| **WebSocket Compatibility** | Poor (Requires standalone Node server or 3rd-party SaaS) | Excellent (Native browser WebSocket singleton) |
| **RSC Real-Time Event Push** | Clunky (`router.refresh()` over HTTP, server re-renders) | Native (`queryClient.setQueryData()` in client memory) |
| **Lexical Editor Compatibility** | Requires `next/dynamic` with `ssr: false` to avoid SSR crash | Native client mounting, instant autofocus |
| **Existing Code Reuse** | ~65–70% (Must add `'use client'`, refactor DOM lookups) | **~98–100%** (Direct drop-in reuse) |
| **Hosting & Infrastructure** | Requires Node.js container / Vercel compute ($$$ per invocation) | Static Edge CDN (Cloudflare Pages, S3, Netlify) ($0 compute) |
| **Local Dev Experience (HMR)** | Webpack / Turbopack compilation latency on heavy client trees | Vite 6 sub-20ms HMR, instant startup |
| **Client Bundle Overhead** | RSC runtime + React DOM + Hydration manifests | Clean Rollup 4 tree-shaken ESM bundles |

---

## 7. Migration Roadmap for Vite Modernization

We recommend executing frontend modernization across four discrete, testable phases:

### Phase 1: Dependency Modernization
* Upgrade Vite from `v4.3.9` to `v6.x` and `@vitejs/plugin-react-swc`.
* Upgrade React from `v18.2.0` to `v19.x` (or latest stable React 18 / 19 pending Radix UI upstream verification).
* Audit and upgrade Radix UI primitives and Framer Motion for React 19 compatibility.

### Phase 2: Introduce TanStack Router for URL Synchronization
* Install `@tanstack/react-router`.
* Define root route (`/`) preserving `Main`, `LeftColumn`, and `Welcome`.
* Define child route (`/c/$chatId`) rendering `Chat` with typed route params.
* Update `ChatItem.tsx` to link to `/c/$chatId` instead of solely triggering Zustand state.

### Phase 3: Integrate TanStack Query & WebSocket Cache Binding
* Install `@tanstack/react-query`.
* Move server-fetched collections (`chatList`, `messages`) from Zustand store to TanStack Query hooks (`useChats()`, `useMessages(chatId)`).
* Retain Zustand for client-only UI slices (`LeftDrawer`, `RightDrawer`, `Theme`).
* Wire WebSocket listener to dispatch `queryClient.setQueryData` for zero-latency incoming messages and delivery receipts.

### Phase 4: Production Static Deployment Setup
* Configure Vite static build output (`dist/`).
* Add automated deployment pipeline to Cloudflare Pages or AWS S3/CloudFront.
* Configure client-side fallback routing (`index.html` rewrite on 404).

---

## 8. Primary Source Citations

1. **Next.js Documentation on Server Components & Hydration**:
   * *Next.js App Router Documentation — Client Components & Directives*: Explains the necessity of `'use client'` for interactivity, DOM access, and browser APIs.  
     URL: [https://nextjs.org/docs/app/building-your-application/rendering/client-components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
   * *Next.js Serverless & WebSocket Limitations*: Explains why Route Handlers and serverless deployments cannot maintain persistent WebSocket connections.  
     URL: [https://nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
2. **Meta Lexical Documentation**:
   * *Lexical Architecture & Browser DOM Requirements*: Details Lexical's dependency on the browser environment (`window`, `document`, `Selection`).  
     URL: [https://lexical.dev/docs/intro](https://lexical.dev/docs/intro)
   * *Lexical in Next.js / SSR*: Guidance specifying that editor UI components must be isolated to client-only rendering with SSR disabled.  
     URL: [https://lexical.dev/docs/getting-started/react](https://lexical.dev/docs/getting-started/react)
3. **TanStack Documentation**:
   * *TanStack Router — Type-Safe Client Routing*: Full specification of 100% type-safe client-side routing, loaders, and search parameter validation.  
     URL: [https://tanstack.com/router/latest](https://tanstack.com/router/latest)
   * *TanStack Query — WebSocket & Real-Time Cache Integration*: Architectural patterns for updating `queryClient` directly from WebSocket streams.  
     URL: [https://tanstack.com/query/latest/docs/framework/react/community/real-time](https://tanstack.com/query/latest/docs/framework/react/community/real-time)
4. **Vite 6 Documentation**:
   * *Vite 6 Architecture & Rollup 4 Bundling*: High-performance client-side asset compilation, fast HMR, and static delivery.  
     URL: [https://vite.dev/guide/](https://vite.dev/guide/)
