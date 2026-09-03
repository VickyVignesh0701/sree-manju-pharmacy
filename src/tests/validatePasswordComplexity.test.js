// Run with: node --test src/tests/validatePasswordComplexity.test.js
// No build step needed - this imports the real exported function directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePasswordComplexity } from '../utils/validation.js';

test('rejects an empty password', () => {
  const result = validatePasswordComplexity('');
  assert.equal(result.isValid, false);
  assert.match(result.error, /required/i);
});

test('rejects passwords shorter than 8 characters', () => {
  const result = validatePasswordComplexity('Ab1!');
  assert.equal(result.isValid, false);
  assert.match(result.error, /8 to 16/);
});

test('rejects passwords longer than 16 characters', () => {
  const result = validatePasswordComplexity('Abcdefgh1!Abcdefgh1!');
  assert.equal(result.isValid, false);
  assert.match(result.error, /8 to 16/);
});

test('rejects a password missing an uppercase letter', () => {
  const result = validatePasswordComplexity('abcdefg1!');
  assert.equal(result.isValid, false);
  assert.match(result.error, /Uppercase/);
});

test('rejects a password missing a lowercase letter', () => {
  const result = validatePasswordComplexity('ABCDEFG1!');
  assert.equal(result.isValid, false);
  assert.match(result.error, /Lowercase/);
});

test('rejects a password missing a number', () => {
  const result = validatePasswordComplexity('Abcdefgh!');
  assert.equal(result.isValid, false);
  assert.match(result.error, /Number/);
});

test('rejects a password missing a special character', () => {
  const result = validatePasswordComplexity('Abcdefgh1');
  assert.equal(result.isValid, false);
  assert.match(result.error, /Special character/);
});

test('reports every missing requirement at once, not just the first', () => {
  const result = validatePasswordComplexity('abcdefgh');
  assert.equal(result.isValid, false);
  assert.match(result.error, /Uppercase/);
  assert.match(result.error, /Number/);
  assert.match(result.error, /Special character/);
});

test('accepts a password meeting every requirement', () => {
  const result = validatePasswordComplexity('Secure1!');
  assert.equal(result.isValid, true);
  assert.equal(result.error, '');
});

test('accepts a password at exactly the 16-character boundary', () => {
  const result = validatePasswordComplexity('Abcdefgh1!234567');
  assert.equal(result.isValid, true);
});

test('accepts a password at exactly the 8-character boundary', () => {
  const result = validatePasswordComplexity('Abcdef1!');
  assert.equal(result.isValid, true);
});

// Covers the "does this look like a scanned barcode" heuristic used in
// Billing.jsx to decide whether to show a "barcode not found" warning on
// Enter, versus staying silent for ordinary text typed to filter the list.
const looksLikeBarcode = (text) => /^\d{6,}$/.test(text);

test('barcode heuristic: accepts a realistic 12-digit barcode', () => {
  assert.equal(looksLikeBarcode('123456789012'), true);
});

test('barcode heuristic: accepts the 6-digit minimum boundary', () => {
  assert.equal(looksLikeBarcode('123456'), true);
});

test('barcode heuristic: rejects short numeric strings (e.g. a quantity typed by mistake)', () => {
  assert.equal(looksLikeBarcode('12345'), false);
});

test('barcode heuristic: rejects ordinary medicine name text', () => {
  assert.equal(looksLikeBarcode('Paracetamol'), false);
});

test('barcode heuristic: rejects mixed alphanumeric text', () => {
  assert.equal(looksLikeBarcode('abc123456789'), false);
});

// Mirrors normalizePhoneForSms() in api/sms.php (PHP, can't be executed
// here directly - see TESTING.md). Re-implemented in JS purely so the
// normalization RULES have at least one place they're verified against
// concrete cases; the PHP function itself still needs manual verification.
const normalizePhoneForSmsJs = (phone) => {
  phone = phone.trim();
  if (!phone) return null;
  if (phone.startsWith('+')) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length > 10) return '+' + digits;
  return null;
};

test('phone normalization: bare 10-digit Indian number gets +91 prefix', () => {
  assert.equal(normalizePhoneForSmsJs('9876543210'), '+919876543210');
});

test('phone normalization: already-prefixed number passes through unchanged', () => {
  assert.equal(normalizePhoneForSmsJs('+919876543210'), '+919876543210');
});

test('phone normalization: number with a country code but no + gets one added', () => {
  assert.equal(normalizePhoneForSmsJs('919876543210'), '+919876543210');
});

test('phone normalization: strips formatting characters before counting digits', () => {
  assert.equal(normalizePhoneForSmsJs('98765-43210'), '+919876543210');
});

test('phone normalization: rejects a too-short number rather than guessing', () => {
  assert.equal(normalizePhoneForSmsJs('12345'), null);
});

test('phone normalization: rejects an empty string', () => {
  assert.equal(normalizePhoneForSmsJs(''), null);
});
