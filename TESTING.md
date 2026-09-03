# Testing

Two separate test suites: frontend (JS) and backend (PHP). Read the verification note before
trusting either.

## Frontend tests

Pure logic only — no React rendering, no DOM, no network. Runs on Node's built-in test runner,
no extra install needed.

```bash
node --test src/tests/*.test.js
```

**Verification status: run and passing** as of this writing (22/22 tests,
`src/tests/validatePasswordComplexity.test.js` — covers password complexity, the barcode-scan
detection heuristic used in Billing, and phone number normalization for SMS receipts).

**One caveat on the phone-normalization tests specifically:** they test a JS re-implementation of
the rules in `normalizePhoneForSms()` (`api/sms.php`), not the real PHP function — there's no way
to import PHP into a Node test. If that PHP function changes without updating the JS copy, these
tests will pass while the real behavior has silently diverged. Treat them as documentation of the
intended rules, not proof the PHP matches them.

## Backend tests

```bash
composer install
vendor/bin/phpunit
```

Covers:
- `stockBaseQuantity()` (`api/stock.php`) — the strip-vs-tablet conversion math. This is the
  exact calculation that was missing from several frontend stock-mutation paths before it was
  fixed; these tests exist so a regression there gets caught automatically instead of silently
  corrupting stock counts again.
- `validatePasswordComplexityServer()` (`api/auth.php`) — the real password gate. Client-side
  validation is UX only; this is what actually enforces the rule.

**Verification status: written, but not executed.** There is no PHP interpreter available in the
environment these were written in, so unlike the frontend suite, these have only been checked by
careful manual reading — never actually run. **Run them yourself before trusting they even pass
syntactically.** If something's wrong, it's most likely a namespace or autoload path issue in
`composer.json` / `phpunit.xml`, not the logic itself.

### What isn't covered, and why

Most of the backend's real business logic — creating a sale, verifying a purchase receipt,
authenticating a login — lives in functions that call `db()` and need a real MySQL connection.
Testing those properly means either an in-memory/test database with fixtures, or refactoring the
handlers to accept an injected `PDO` (a real, worthwhile change, just a larger one than fits
here). What's covered now is deliberately limited to functions that are genuinely pure — no
database, no HTTP side effects — so they could be tested honestly without a database connection
this environment doesn't have.

One specific gap worth knowing about: `stockBaseQuantity()`'s error path (quantity ≤ 0) calls
`jsonResponse()`, which terminates the PHP process by design (it's an API endpoint helper). That
makes the error branch untestable in a normal PHPUnit run without process isolation. The tests
here only cover the success path. A worthwhile follow-up: change that function to throw an
`InvalidArgumentException` on invalid input instead, matching the pattern already used in
`api/dealers.php`'s purchase-receiving code — that would make the error path testable too, and is
better design regardless of testing.
