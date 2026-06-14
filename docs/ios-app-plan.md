# Splitwallet iOS — Native (SwiftUI) Build Plan

> **Status:** Planning. This document is the hand-off spec for building
> `finance-iOS`, a native SwiftUI port of the Splitwallet web app
> (`finance-web`). It targets **full feature parity** with the web client,
> talking to the **same `finance-gateway` backend** over the same REST
> contract. It was authored from the `finance-web` source so the API shapes,
> auth flow, and import pipeline below are exact mirrors of what ships today.
>
> Carry this file into a Claude Code session scoped to `finance-iOS` and
> execute it milestone by milestone.

---

## 1. Goal & principles

- **Parity, not reinvention.** Every web screen and flow has a native
  equivalent. Same endpoints, same envelope, same auth, same CSV import
  contract.
- **Native-first UX.** SwiftUI navigation, system gestures, Dynamic Type,
  dark/light following the same design tokens, haptics, pull-to-refresh.
- **Same backend, zero backend changes.** The gateway already serves a SPA;
  the iOS app is just another client. No new endpoints required for parity.
- **Phone + iPad.** Universal app. iPad uses a `NavigationSplitView`
  (sidebar ↔ detail) that mirrors the web's persistent sidebar; iPhone uses a
  `TabView` + stacked navigation.

### Target platform

- **iOS 17+ / iPadOS 17+** (lets us use `@Observable`, `NavigationStack`,
  `NavigationSplitView`, Swift Charts, `.scrollTargetBehavior`, etc.).
- Swift 5.9+, Xcode 15+.

---

## 2. Tech stack

| Concern            | Choice                                                            |
| ------------------ | ---------------------------------------------------------------- |
| UI                 | **SwiftUI** (+ a little UIKit interop only where unavoidable)     |
| State              | `@Observable` view-model stores (Observation framework)           |
| Networking         | `URLSession` + `async/await` + `Codable` (no Alamofire needed)    |
| Auth               | **Firebase Auth** (Google sign-in; Apple sign-in via native API)  |
| Charts             | **Swift Charts** (donut, monthly bars, breakdown)                 |
| CSV                | Lightweight hand-rolled parser (mirror of `papaparse` usage)      |
| Persistence        | `Keychain` (session tokens) + `UserDefaults` (prefs)             |
| Dependencies       | Swift Package Manager only                                        |
| Testing            | XCTest + a mock `URLProtocol` for the API layer                   |

### SPM dependencies

- `firebase-ios-sdk` → `FirebaseAuth` only (and `FirebaseCore`).
- `GoogleSignIn-iOS` (`GoogleSignIn` + `GoogleSignInSwift`) for the Google
  OAuth popup equivalent.
- (Apple Sign In uses `AuthenticationServices`, no package.)

Keep the dependency list this short — everything else is first-party.

---

## 3. Backend contract (exact mirror of finance-web)

Base URL is the gateway. In the web app it's `VITE_API_BASE_URL`; on iOS put
it in an `.xcconfig` (`API_BASE_URL`) so debug/release can differ. All paths
below are appended to that base.

### 3.1 Response envelope

Every successful response is wrapped in `finance-common`'s envelope and must
be unwrapped to the inner `data`:

```jsonc
// success
{ "success": true, "data": <T>, "timestamp": "...", "traceId": "..." }
// failure
{ "success": false, "error": { "code": "...", "message": "...", "fieldErrors": {...} }, "timestamp": "..." }
```

Some list endpoints may return a bare array or a `{content:[]}` / `{data:[]}`
wrapper — the web app defends with a `toArray` helper; replicate it as a
`decodeList` fallback so a skewed backend can't crash a screen.

### 3.2 Auth & headers

- `Content-Type: application/json`.
- Attach `Authorization: Bearer <accessToken>` to **every** request **except**
  paths starting with `/authentication/v1/login` (the pre-token OAuth
  exchange).
- **401 → one-shot silent refresh:** on a 401 for a non-login path, exchange
  the Firebase refresh token for a new ID token (see §6.3), update the stored
  session, and retry the original request **once**. If refresh fails, clear
  the session and route to sign-in.

### 3.3 Endpoint catalogue

| Domain        | Method & path                                          | Purpose / notes |
| ------------- | ------------------------------------------------------ | --------------- |
| **Auth**      | `POST /authentication/v1/login/oauth`                  | Body `{provider, idToken}` → `{accessToken, refreshToken, uid, displayName, isNewUser}`. **No Bearer.** |
| **Me**        | `GET /authentication/v1/me`                            | → `Me` (uid, email, emailVerified, displayName, createdAt, lastSignInAt) |
|               | `PATCH /authentication/v1/me`                          | Body `{displayName}` → updated `Me` |
| **Accounts**  | `GET /account/v1/accounts?status=&type=`               | → `[Account]` |
|               | `GET /account/v1/accounts/{id}`                        | → `Account` |
|               | `POST /account/v1/accounts`                            | `CreateAccountInput` → `Account` |
|               | `PUT /account/v1/accounts/{id}`                        | `UpdateAccountInput` → `Account` |
|               | `DELETE /account/v1/accounts/{id}`                     | Close account |
| **Txns**      | `GET /transaction/v1/transactions`                     | params: `accountId, categoryId, categoryIds(csv), uncategorized, from, to, q, page, size` → `TransactionPage` |
|               | `GET /transaction/v1/transactions/{id}`               | → `Transaction` |
|               | `POST /transaction/v1/transactions`                   | `CreateTransactionInput` → `Transaction` |
|               | `PATCH /transaction/v1/transactions/{id}`             | `{description?, reference?, transactionDate?}` → `Transaction` |
|               | `PATCH /transaction/v1/transactions/{id}/category`    | `{categoryId}` **or** `{categoryName}` → `{transaction, category}` |
|               | `DELETE /transaction/v1/transactions/{id}`            | Soft-delete |
|               | `PATCH /transaction/v1/transactions/bulk-category`    | `{transactionIds, categoryId|categoryName}` → `{updated, skipped, notFound, category}` |
|               | `DELETE /transaction/v1/transactions/bulk`           | Body `{transactionIds}` → `{deleted, notFound}` |
|               | `GET /transaction/v1/transactions/balances?asOf=&accountIds=` | → `{asOf, balances:[AccountBalance]}` |
|               | `GET /transaction/v1/transactions/counts`             | → `{total, uncategorized, byCategory}` |
| **Categories**| `GET /transaction/v1/categories`                      | → `[Category]` |
|               | `POST /transaction/v1/categories`                     | `{name, colourHex?}` → `Category` |
|               | `POST /transaction/v1/categories/bulk`                | **bare array** `[{name, colourHex?}]` → `{created, skipped, categories}` |
|               | `GET /transaction/v1/categories/{id}/summary`         | → `{categoryId, categoryName, transactionCount, totalAmount, currency}` |
|               | `PUT /transaction/v1/categories/{id}`                 | `{name?, colourHex?}` → `Category` |
|               | `DELETE /transaction/v1/categories/{id}`             | Delete |
| **Reports**   | `GET /transaction/v1/reports/summary?range=&asOf=&accountIds=` | `range` = `month`/`year` → `ReportsSummary` |
| **Import**    | `POST /ingestion/v1/bulk-upload`                       | `multipart/form-data` field `file` (CSV) → 202 `{jobId}` |
|               | `GET /ingestion/v1/bulk-upload/{jobId}`               | Poll → `{jobId, status, totalRows?, successCount?, errorCount?, errorRows?, ...}` |

**Param serialisation gotcha:** list params (`categoryIds`, `accountIds`) must
be **comma-joined** (`a,b,c`), not repeated keys — Spring's
`@RequestParam List<UUID>` binder expects that form.

---

## 4. Data models (Swift)

Mirror the TS types one-to-one as `Codable` structs. Key enums:

```swift
enum EntryType: String, Codable { case debit = "DEBIT", credit = "CREDIT" }
enum TransactionSource: String, Codable { case manual = "MANUAL", bulk = "BULK", api = "API" }
enum AccountType: String, Codable { case asset = "ASSET", liability = "LIABILITY", equity = "EQUITY", expense = "EXPENSE", revenue = "REVENUE" }
enum AccountStatus: String, Codable { case active = "ACTIVE", closed = "CLOSED" }
enum JobStatus: String, Codable { case pending = "PENDING", processing = "PROCESSING", completed = "COMPLETED", failed = "FAILED" }
enum ReportsRange: String, Codable { case month, year }
```

Structs to port (fields exactly as in `src/api/*.ts`):
`Account`, `Transaction`, `CategoryRef`, `TransactionPage`, `AccountBalance`,
`BalancesResponse`, `CountsResponse`, `BulkCategoryResponse`,
`BulkDeleteResponse`, `Category`, `CategorySummary`, `CategoryBulkResponse`,
`Me`, `ReportsSummary` (+ `NetWorth`, `CategorySpend`, `MonthlyTotal`,
`MerchantSpend`), `JobStatusResponse`, `ErrorRow`.

Watch the **nullables** — several report fields are intentionally `null` to
signal "can't compute" (mixed currencies): `ReportsSummary.currency`,
`NetWorth.current/previous/delta`, `CategorySpend.categoryId/name`. Render an
em-dash / banner exactly like the web does.

---

## 5. App architecture

```
finance-iOS/
├─ App/
│  ├─ SplitwalletApp.swift          // @main, Firebase config, root routing
│  └─ AppEnvironment.swift          // DI container (apiClient, stores)
├─ Core/
│  ├─ Networking/
│  │  ├─ APIClient.swift            // URLSession, envelope unwrap, 401 refresh
│  │  ├─ Endpoint.swift             // typed request builder
│  │  ├─ APIError.swift             // mirrors ApiError {code,message,status,fieldErrors}
│  │  └─ ListDecoding.swift         // toArray fallback
│  ├─ Auth/
│  │  ├─ AuthService.swift          // Google/Apple sign-in → backend exchange
│  │  ├─ TokenStore.swift           // Keychain-backed session
│  │  └─ TokenRefresher.swift       // securetoken.googleapis.com swap
│  ├─ Persistence/
│  │  └─ PreferencesStore.swift     // UserDefaults (theme, chipStyle, currency, …)
│  └─ DesignSystem/
│     ├─ Theme.swift                // color tokens (dark+light), radii, shadows
│     ├─ Typography.swift           // Plus Jakarta Sans / Instrument Serif / JetBrains Mono
│     └─ Components/                // Chip, Card, StatCard, Avatar, MerchantIcon, …
├─ Features/
│  ├─ Auth/                         // SignIn, NewUserName
│  ├─ Transactions/                 // list, filters, detail, add, bulk, category picker
│  ├─ Import/                       // upload → preview → done wizard
│  ├─ Accounts/                     // bank cards grid, link/edit/close
│  ├─ Categories/                   // grid, create/edit/delete, chip-style toggle
│  ├─ Reports/                      // net worth, donut, monthly, top merchants
│  ├─ Settings/                     // profile + preferences tabs
│  └─ Shell/                        // RootView (TabView / NavigationSplitView), Sidebar
├─ Models/                          // Codable structs (§4)
├─ Resources/                       // Assets, fonts, GoogleService-Info.plist
└─ Tests/
```

### Networking layer

`APIClient` is an `actor` exposing typed async methods grouped to mirror the
web's `*Api` objects (`accountsApi`, `transactionsApi`, …). Responsibilities:

1. Build `URLRequest` from an `Endpoint` (path, method, query, body).
2. Attach `Authorization` unless the path is a public-login path.
3. Decode the envelope, throw `APIError` on `success:false`.
4. On 401 (non-login, not-yet-retried): call `TokenRefresher`, persist the new
   session, retry once.

### State / view-models

Use `@Observable` classes per feature (e.g. `TransactionsModel`,
`AccountsModel`). They own loading/error/data state and call `APIClient`.
Equivalent of the web's TanStack Query hooks — add a tiny in-memory cache +
`refresh()` per model. (No need for a full query library; a `Cache` actor with
TTL is enough for parity.)

Two cross-cutting stores injected via `@Environment`:

- `AuthStore` ↔ web `authStore` (session in Keychain).
- `PreferencesStore` ↔ web `prefsStore`: `theme, layout, chipStyle, currency,
  weekStartsOn, roundToNearestDollar, autoCategorizeOnImport`.

---

## 6. Auth flow (parity with finance-web)

### 6.1 Sign-in
1. User taps **Continue with Google** → `GoogleSignIn` presents the native
   flow → returns a Google **ID token**.
2. `POST /authentication/v1/login/oauth {provider:"google", idToken}` →
   backend returns `{accessToken, refreshToken, uid, displayName, isNewUser}`.
3. Persist the session in Keychain; route into the app.
4. **New user:** the web reads `isNewUser` from the provider result (not the
   backend) and shows a "what should we call you?" step that `PATCH`es
   `/me {displayName}`. Replicate this one-time name step.

### 6.2 Apple Sign In — parity *plus* a freebie
The web has Apple wired in `lib/firebase.ts` but **not exposed in the UI**
(needs an Apple Services ID). On iOS, **Sign in with Apple is mandatory by
App Store review** when you offer Google sign-in, and it's a native
`ASAuthorizationController`. So: implement Apple sign-in too, exchanging its
identity token via the same endpoint with `provider:"apple"` (backend already
accepts it). This is parity-forward, not scope creep.

### 6.3 Silent refresh
Exact mirror of `src/api/refresh.ts`:
`POST https://securetoken.googleapis.com/v1/token?key=<FIREBASE_API_KEY>` with
form body `grant_type=refresh_token&refresh_token=<rt>` →
`{id_token, refresh_token, user_id}`. Store `FIREBASE_API_KEY` in `.xcconfig`.

---

## 7. CSV Import pipeline (parity with finance-web)

The backend ingests a **canonical CSV**. The web does all parsing/validation
client-side, then uploads the normalised file. Replicate exactly so behaviour
matches (`src/lib/csv.ts`):

**Canonical headers (in order):**
`accountId, entryType, amount, currency, transactionDate, reference, description, categoryName`

**Required headers in the user's file:** `entryType, amount, currency, transactionDate`
(`accountId` is injected from the upload-step account picker, never copied by hand).

**Per-row normalisation rules to port verbatim:**
- `entryType`: accept synonyms → `DEBIT`/`CREDIT` (debit/d/dr/-/out/withdrawal/…
  vs credit/c/cr/+/in/deposit/income/…).
- `amount`: strip spaces/commas/currency symbols, treat `(x)` as negative,
  reject `0`, upload **magnitude** with 2 decimals (sign lives in `entryType`).
- `currency`: 3-letter ISO, upper-cased.
- `transactionDate`: normalise ISO / `dd-mm-yyyy` / `mm/dd/yyyy` → `YYYY-MM-DD`.
- File-level errors (missing required header) surface as a single `row 0` error.

**Wizard (3 steps), mirroring web `import/`:**
1. **Upload** — pick account (sets `accountId` + default `currency`), download a
   pre-filled template, drop/pick a `.csv`, live-validate, show missing-column
   pills + per-row errors.
2. **Preview** — table of canonicalised rows + error summary; confirm.
3. **Done** — `POST` the canonical CSV as multipart, then **poll**
   `GET …/bulk-upload/{jobId}` until `COMPLETED`/`FAILED`; show counts +
   `errorRows`.

On iOS use `UIDocumentPickerViewController` (via `.fileImporter`) for file
selection and `ShareLink`/`UIActivityViewController` for the template download.

---

## 8. Feature parity matrix

| Web screen / component                | iOS equivalent | Notes |
| ------------------------------------- | -------------- | ----- |
| App shell (sidebar / topnav)          | `RootView`: `TabView` (iPhone) · `NavigationSplitView` (iPad) | Sidebar items: Transactions, Import, Accounts, Categories, Settings. (Dashboard & Reports routes exist but are hidden from nav in web — keep them reachable but un-tabbed, matching `navConfig.ts`.) |
| TopBar (title, search, actions)       | `.navigationTitle` + toolbar | Search is decorative in web; make it functional on the txn list (`q` param) or omit for v1 parity. |
| **Auth** — sign-in + new-user name    | `SignInView`, `NameStepView` | §6 |
| **Transactions** list (grouped by day)| `TransactionsView` | Section per day with header (date, item count, net total). |
| TransactionRow                        | `TransactionRow` | Merchant icon (initials + deterministic color), name, account dot + reference, category chip, signed amount. |
| Account / Category filter chip rows   | Horizontally scrolling chip rows | Counts from `/counts` + `/balances`. |
| Bulk select + BulkActionBar           | Edit-mode multi-select + bottom bar | Categorize / Delete / Clear. |
| AddTransactionModal                   | `AddTransactionSheet` | `CreateTransactionInput`. |
| TransactionDetailModal                | `TransactionDetailView` | Edit description/reference/date; change category. |
| CategoryPickerModal                   | `CategoryPickerSheet` | Pick existing or create-by-name inline. |
| **Accounts** bank-card grid           | `AccountsView` (grid) | Gradient `BankCard`, balances from `/balances`, link/edit/close. |
| LinkAccountModal                      | `LinkAccountSheet` | `CreateAccountInput`. |
| **Categories** grid + chip-style toggle| `CategoriesView` | Create/edit/delete; seed/bulk banner; chip style icon/emoji/dot pref. |
| **Reports**                           | `ReportsView` | Net-worth stat, spend donut, income/spend monthly bars, top merchants. Swift Charts. Honour mixed-currency `null` banners. |
| **Dashboard**                         | `DashboardView` | Stats row, donut, monthly trend, recent activity, uncategorised banner. (Hidden from nav like web.) |
| **Settings** (Profile + Preferences)  | `SettingsView` (2 sections) | Profile: name (PATCH /me), email read-only. Preferences: theme, layout(n/a on iOS → drop or repurpose), chip style, currency, week start, rounding, auto-categorize-on-import, sign out. |
| Money formatting (`formatHKD`)        | `Money` formatter | `Intl.NumberFormat('en-HK')` → `NumberFormatter` locale `en_HK`, 2 fraction digits, unicode minus `−`, `HK$` prefix, compact `k` form. Currency is configurable via prefs. |
| merchantColor / merchantInitials      | Port deterministic hash → palette + initials | Keep identical output so icons match across platforms. |
| categoryStyles (glyph/emoji/color)    | Port the mapping table | Drives chip rendering. |

---

## 9. Design system

Port `src/styles/tokens.css` into `Theme.swift` as two `ColorScheme` palettes
(dark is default in web via `data-theme="dark"`). Tokens to carry over:

- **Surfaces:** `bg, bgElev, surface, surface2, surface3, border, borderStrong`.
- **Text:** `text, text2, textDim, textFaint`.
- **Brand:** `primary, primaryBright, primaryDeep, primarySoft, primaryRing`.
- **Semantic:** `success(+soft), danger(+soft), warn`.
- **Category palette:** `c-groceries … c-other` (the 12 fixed hues).
- **Radii:** sm 8 / md 12 / lg 18 / xl 24. **Shadows:** 1 / 2 / lift.

**Fonts:** bundle the three Google fonts the web uses and register them:
- UI: **Plus Jakarta Sans** (400–800)
- Display (big numbers / headings): **Instrument Serif**
- Mono (amounts, account numbers): **JetBrains Mono** (tabular figures)

Respect system **Dark/Light** by default, with a manual override stored in
prefs (matching web's `theme` toggle). Support **Dynamic Type** — prefer
relative font scaling over hard pixel sizes where practical.

---

## 10. Milestones

Each milestone is a reviewable PR. Build vertically (auth → one full feature →
next) so there's always a runnable app.

1. **M0 — Project scaffold.** Xcode project, SPM deps, `.xcconfig` for
   `API_BASE_URL` + `FIREBASE_API_KEY`, Firebase plist, app icon placeholder,
   fonts registered, CI (build + test).
2. **M1 — Core plumbing.** `APIClient` (envelope, error, 401 refresh),
   `Models`, `TokenStore` (Keychain), `PreferencesStore`, `DesignSystem`
   (Theme + Typography + base components). Unit tests with mock `URLProtocol`.
3. **M2 — Auth.** Google + Apple sign-in → backend exchange, session persist,
   new-user name step, auto-refresh, sign-out. Root routing (signed-in vs out).
4. **M3 — Transactions (the core).** List grouped by day, filter chip rows,
   detail, add, category change, bulk select + bulk categorize/delete, search.
5. **M4 — Accounts.** Bank-card grid with balances, link/edit/close.
6. **M5 — Categories.** Grid, create/edit/delete, chip-style toggle, seed/bulk.
7. **M6 — Import.** 3-step wizard, client-side canonicalisation, multipart
   upload, job polling, error rows. Port `csv` tests.
8. **M7 — Reports + Dashboard.** Swift Charts; mixed-currency handling.
9. **M8 — Settings.** Profile + preferences, theme override, sign out.
10. **M9 — Polish.** iPad split view, Dynamic Type pass, empty/loading/error
    states, haptics, pull-to-refresh, accessibility labels, App Store assets.

---

## 11. Testing strategy

- **API layer:** inject a mock `URLProtocol`; assert envelope unwrap, error
  mapping, 401-refresh-retry, comma-list param serialisation, `toArray`
  fallback. (Mirrors `toArray.test.ts`, `reports.test.ts`.)
- **Pure logic:** port the web unit tests for `csv`, `money`, `transactions`
  (grouping/formatting), `categoryStyles`, `accounts` (gradients/counts),
  `chunked`. These are behaviour contracts — keep outputs identical.
- **View-models:** test loading/error/success transitions with a stubbed
  client.
- **Snapshot / UI tests:** optional for v1; at least smoke-test sign-in and the
  transactions list render.

---

## 12. Config & secrets

- `Secrets.xcconfig` (gitignored): `API_BASE_URL`, `FIREBASE_API_KEY`.
- `Secrets.example.xcconfig` (committed): documented blanks.
- `GoogleService-Info.plist` from the **same Firebase project** the backend's
  Admin SDK validates against (gitignored; provide a README pointer).
- Add the Google reversed-client-id URL scheme for `GoogleSignIn`.
- Enable the **Sign in with Apple** capability + an Apple Services ID in
  Firebase for the Apple flow.

---

## 13. Open questions (resolve before/while building)

1. **Search:** the web's top-bar search is decorative. Make the transactions
   search functional on iOS (the `q` param exists) — confirm desired scope.
2. **Currency:** web hard-codes `HK$` formatting in `money.ts` but prefs carry
   a `currency` field. Confirm whether iOS should fully honour the prefs
   currency or match the web's HKD-centric formatting for v1.
3. **`layout` pref** (`sidebar`/`topnav`) is web-only and has no iOS meaning —
   drop it from the iOS preferences screen.
4. **Dashboard/Reports visibility:** keep hidden-from-nav (parity) or surface
   them on iOS since there's tab room? Recommend: keep hidden for v1 parity.
5. **Offline:** out of scope for parity (web is online-only). Note for later.

---

## 14. Quick reference — files in finance-web worth reading first

- `src/api/*.ts` — the entire contract (client, auth, transactions, accounts,
  categories, reports, me, bulkUpload, types).
- `src/lib/csv.ts` — the import canonicalisation rules (port verbatim).
- `src/lib/money.ts`, `merchantColor.ts`, `categoryStyles.ts`,
  `transactions.ts`, `accounts.ts` — pure logic to mirror + reuse tests.
- `src/styles/tokens.css` — design tokens for `Theme.swift`.
- `src/components/shell/navConfig.ts` — nav structure + which routes are hidden.
- `src/stores/authStore.ts`, `prefsStore.ts` — state shapes.
