# Sree Manju Pharmacy — Security Audit

## Scope

This audit covers the current frontend architecture and the MySQL schema in this repository.

## Critical findings

### 1. Frontend login bypass
`src/pages/Login.jsx` contains a hard-coded password allow-list and accepts any password with 4 or more characters before calling the context login function. This must be removed.

Required behavior:
- Send username/email + password to a trusted backend.
- Verify the password server-side against a password hash.
- Never trust a role supplied by the browser.
- Return a server-created authenticated session/token.

### 2. Plaintext passwords in frontend state
`src/context/AppContext.jsx` contains demo staff objects with plaintext passwords and copies registration passwords into browser storage.

Required behavior:
- Remove password fields from frontend staff/user objects.
- Never persist passwords or password hashes in localStorage.
- Store only a server-issued session/token on the client, preferably in a secure HttpOnly cookie for a production deployment.

### 3. Plaintext password column in SQL schema
The `staff_members` table currently defines `password VARCHAR(255)`.

Required schema direction:
```sql
password_hash VARCHAR(255) NOT NULL
```

Existing plaintext passwords must be invalidated/rotated; they should not be migrated as hashes by a client-side script.

### 4. Password reset is not authenticated
The current reset flow accepts an email in the browser and then updates the stored password without demonstrating possession of an email reset token.

Required flow:
1. User requests reset.
2. Backend creates a short-lived, single-use reset token.
3. Token is delivered through the verified email channel.
4. Backend verifies token + expiry + single-use status.
5. Backend updates the password hash.

### 5. LocalStorage is being used as the system of record
Inventory, sales, staff, patients and audit logs are persisted directly in browser storage.

This is not suitable as the authoritative data store for a pharmacy system. Users can modify localStorage from DevTools and different devices do not share the same state.

Required architecture:
```text
React/Vite frontend
        |
        | HTTPS API
        v
Backend authentication + business API
        |
        v
MySQL transaction-safe database
```

## High-priority data integrity finding

Inventory uses both strips and tablets. Several receiving/return paths add or subtract `quantity` directly from `totalTablets` even when the quantity represents strips.

Canonical rule:
```text
strip quantity × tabletsPerStrip = tablet quantity
```

All stock mutations should happen in one backend service/transaction using a consistent unit model.

## Recommended implementation order

1. Add backend API and authentication.
2. Hash passwords with Argon2id or bcrypt.
3. Remove plaintext passwords from frontend state and seed data.
4. Implement secure session management.
5. Implement role/permission checks server-side.
6. Move inventory and sales mutations to backend transactions.
7. Add inventory movement/audit tables.
8. Implement secure password reset.
9. Add server-side validation and authorization tests.
10. Only then remove the legacy localStorage data paths.

## Important

This branch is intentionally separate from `main` and `development`. No production branch has been changed by this audit document.

## Resolution status (as of 2026-09-02)

Verified against the actual code, not assumed. Anything not explicitly marked closed should be treated as open.

| # | Finding | Status |
|---|---|---|
| 1 | Frontend login bypass | **Closed.** `Login.jsx` calls the real `POST /auth/login`, verified server-side with `password_verify()`. |
| 2 | Plaintext passwords in frontend state | **Closed.** Removed from `AppContext.jsx` seed data, `StaffManagement.jsx`'s password-reveal UI, and the Installer flow (which also stopped writing the DB password to `localStorage`). |
| 3 | Plaintext password column in SQL schema | **Was already correct** in this schema - `staff_members.password_hash` predates this audit round; not something fixed here. |
| 4 | Password reset not authenticated | **Closed.** Real single-use, 30-minute-expiry tokens (`password_reset_tokens` table), generic response to prevent email enumeration. Email *delivery* isn't wired yet - see the open item below. |
| 5 | LocalStorage as system of record | **Closed** for every system-of-record entity: inventory, dealers, categories, formulations, patients, sales, staff, activity log all read/write through the real API. `CartList.jsx` (draft bills before payment) is deliberately still local - that's a working-session concern, not stored business data, and was a conscious decision, not an oversight. |
| — | Strip-vs-tablet data integrity bug | **Closed.** Fixed in all four affected mutation paths. |

**Recommended implementation order, items 1-10:**

| # | Item | Status |
|---|---|---|
| 1 | Backend API and authentication | Done |
| 2 | Hash passwords (bcrypt) | Done |
| 3 | Remove plaintext passwords from frontend | Done |
| 4 | Secure session management | Done - HttpOnly cookie, `Authorization` header kept as a fallback |
| 5 | Role/permission checks server-side | Done - audited every endpoint; found and fixed a real gap in purchase-receipt verification, which had no role check at all |
| 6 | Inventory/sales mutations in backend transactions | Done |
| 7 | Inventory movement/audit tables | Already existed in the schema before this work |
| 8 | Secure password reset | Done (token flow); email delivery still open, see below |
| 9 | Server-side validation and authorization tests | **Partially done.** Server-side validation exists throughout (password complexity, required fields, role checks). No automated test suite exists to verify it stays correct over time - there's no PHPUnit setup or equivalent in this repo. |
| 10 | Remove legacy localStorage paths | Done, with the one deliberate exception noted above |

### Known open items, stated plainly

- **Password reset emails aren't actually sent.** The reset link is logged server-side (`error_log`) rather than emailed - this app's existing mailer is a UI-driven test/send tool, not a reusable "send this" function. Wiring real delivery is a small, separate task.
- **No automated tests.** Nothing in this repo verifies the security fixes stay correct as the code changes. Worth adding before this goes further.
- **No production `.env` values exist yet** - by design, since credentials should never be committed. These must be set on the server before deploy.

