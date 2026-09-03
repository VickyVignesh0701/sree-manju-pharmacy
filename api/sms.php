<?php
declare(strict_types=1);

// SMS / WhatsApp receipt sending via Twilio's REST API.
//
// UNVERIFIED: this was written without access to a Twilio account or
// outbound network access to test against Twilio's actual API. The request
// shape below matches Twilio's documented Messages API as of this writing,
// but it has not been executed against a real account. Test it with a real
// Twilio trial account before relying on it - see sendTestSms() and the
// Settings page "Send Test SMS" action.
//
// Unlike api/smtp_mailer.php (a UI-driven test/send tool with per-request
// credentials), this is a real reusable send function configured server-side
// via api/.env - because receipts need to go out automatically after every
// sale, and a cashier can't be expected to re-enter API credentials before
// each transaction. This is the same gap flagged in api/auth.php for
// password-reset emails; SMS gets the real version here.

function smsIsConfigured(): bool
{
    return envValue('TWILIO_ACCOUNT_SID', '') !== '' && envValue('TWILIO_AUTH_TOKEN', '') !== '';
}

/**
 * Sends a message via Twilio. Returns true on success, false on failure -
 * never throws, since a receipt notification should never be able to fail
 * a completed sale.
 *
 * @param string $toPhone E.164 format expected (e.g. +919876543210). A bare
 *                         10-digit Indian number is auto-prefixed with +91
 *                         as a convenience, since that's what this app
 *                         collects at checkout.
 * @param string $body     Message text.
 * @param bool   $whatsapp If true, sends via WhatsApp instead of SMS -
 *                         requires TWILIO_WHATSAPP_FROM to be configured
 *                         and the Twilio number to be WhatsApp-enabled.
 */
function sendSms(string $toPhone, string $body, bool $whatsapp = false): bool
{
    if (!smsIsConfigured()) {
        error_log('SMS not sent (Twilio not configured): would have sent to ' . $toPhone);
        return false;
    }

    $sid = envValue('TWILIO_ACCOUNT_SID', '');
    $token = envValue('TWILIO_AUTH_TOKEN', '');
    $from = $whatsapp ? envValue('TWILIO_WHATSAPP_FROM', '') : envValue('TWILIO_SMS_FROM', '');
    if ($from === '') {
        error_log('SMS not sent: ' . ($whatsapp ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_SMS_FROM') . ' is not set.');
        return false;
    }

    $to = normalizePhoneForSms($toPhone);
    if ($to === null) {
        error_log('SMS not sent: could not normalize phone number "' . $toPhone . '".');
        return false;
    }

    if ($whatsapp) {
        $to = 'whatsapp:' . $to;
        $from = str_starts_with($from, 'whatsapp:') ? $from : 'whatsapp:' . $from;
    }

    $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
    $payload = http_build_query(['To' => $to, 'From' => $from, 'Body' => $body]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_USERPWD => "{$sid}:{$token}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '') {
        error_log('SMS send failed (network error): ' . $curlError);
        return false;
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('SMS send failed (Twilio HTTP ' . $httpCode . '): ' . $response);
        return false;
    }
    return true;
}

/**
 * Bare 10-digit Indian numbers (what this app collects at checkout) get a
 * +91 prefix. Anything already starting with + is trusted as-is. Anything
 * else is rejected rather than guessed at.
 */
function normalizePhoneForSms(string $phone): ?string
{
    $phone = trim($phone);
    if ($phone === '') return null;
    if (str_starts_with($phone, '+')) return $phone;
    $digits = preg_replace('/\D/', '', $phone);
    if ($digits === null) return null;
    if (strlen($digits) === 10) return '+91' . $digits;
    if (strlen($digits) > 10) return '+' . $digits; // already has a country code, just missing the +
    return null;
}

function buildReceiptSmsText(string $invoiceNo, float $finalAmount, string $pharmacyName = 'Sree Manju Pharmacy'): string
{
    $amount = number_format($finalAmount, 2);
    return "{$pharmacyName}: Thank you for your purchase. Invoice {$invoiceNo}, Amount Rs.{$amount}. Get well soon!";
}

/** Owner-only manual test, called from a Settings action - see api/index.php routing. */
function handleSmsTest(array $segments, array $user): never
{
    requireRole(['Owner', 'Co-owner']);
    if (requestMethod() !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'POST is required.'], 405);
    }
    if (!smsIsConfigured()) {
        jsonResponse(['success' => false, 'message' => 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set in api/.env.'], 422);
    }
    $input = requestBody();
    $to = trim((string)($input['phone'] ?? ''));
    $whatsapp = !empty($input['whatsapp']);
    if ($to === '') {
        jsonResponse(['success' => false, 'message' => 'A phone number is required.'], 422);
    }
    $sent = sendSms($to, 'This is a test message from Sree Manju Pharmacy. If you received this, SMS/WhatsApp sending is configured correctly.', $whatsapp);
    if (!$sent) {
        jsonResponse(['success' => false, 'message' => 'Send failed - check the server error log for the Twilio response.'], 502);
    }
    jsonResponse(['success' => true, 'message' => 'Test message sent. Confirm it actually arrived before trusting this in production.']);
}
