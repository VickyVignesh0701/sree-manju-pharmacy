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
