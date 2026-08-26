<?php
/**
 * SMTP test/send endpoint.
 *
 * SECURITY RULES:
 * - Never persist SMTP passwords in a JSON file or source control.
 * - Never expose saved SMTP credentials through GET.
 * - Production deployments should put this endpoint behind the authenticated
 *   owner-only API and/or a server-side queue worker.
 */

header('Content-Type: application/json; charset=UTF-8');
$allowedOrigin = getenv('APP_URL') ?: '';
if ($allowedOrigin !== '') {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST is required. SMTP credentials are never returned by this endpoint.']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = $input['action'] ?? 'test';
$host = trim((string)($input['host'] ?? ''));
$port = filter_var($input['port'] ?? 0, FILTER_VALIDATE_INT);
$encryption = strtolower(trim((string)($input['encryption'] ?? '')));
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');
$fromAddress = trim((string)($input['fromAddress'] ?? $username));
$fromName = trim((string)($input['fromName'] ?? 'Sree Manju Pharmacy Notifications'));

if ($host === '' || !$port || $username === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'SMTP Host, Port, Username, and Password are required.']);
    exit;
}

if (!filter_var($username, FILTER_VALIDATE_EMAIL) || !filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'SMTP username and From address must be valid email addresses.']);
    exit;
}

if (!in_array($encryption, ['tls', 'ssl', 'none'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Encryption must be tls, ssl, or none.']);
    exit;
}

function runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName, $toAddress = null, $subject = null, $body = null) {
    $timeout = 12;
    $errno = 0;
    $errstr = '';

    if ($encryption === 'ssl' || $port === 465) {
        $socketHost = 'ssl://' . $host;
    } else {
        $socketHost = 'tcp://' . $host;
    }

    // Certificate verification is deliberately enabled. Do not disable TLS
    // verification in production SMTP connections.
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
            'SNI_enabled' => true,
            'peer_name' => $host
        ]
    ]);

    $socket = @stream_socket_client($socketHost . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return ['success' => false, 'message' => "Could not connect to SMTP server {$host}:{$port} ({$errstr})"];
    }

    stream_set_timeout($socket, $timeout);
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '220') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP server rejected the initial connection.'];
    }

    fputs($socket, "EHLO " . gethostname() . "\r\n");
    readSmtpResponse($socket);

    if (($encryption === 'tls' || $port === 587) && strpos($socketHost, 'ssl://') === false) {
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 512);
        if (substr((string)$response, 0, 3) !== '220') {
            fclose($socket);
            return ['success' => false, 'message' => 'SMTP STARTTLS negotiation failed.'];
        }

        $cryptoSuccess = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT);
        if (!$cryptoSuccess) {
            fclose($socket);
            return ['success' => false, 'message' => 'TLS encryption could not be established.'];
        }

        fputs($socket, "EHLO " . gethostname() . "\r\n");
        readSmtpResponse($socket);
    }

    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP authentication is not accepted by this server.'];
    }

    fputs($socket, base64_encode($username) . "\r\n");
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP username was rejected.'];
    }

    fputs($socket, base64_encode($password) . "\r\n");
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '235') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP authentication failed. Check the account or app password.'];
    }

    if (!$toAddress || $body === null) {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return ['success' => true, 'message' => 'SMTP connection and authentication succeeded.'];
    }

    if (!filter_var($toAddress, FILTER_VALIDATE_EMAIL)) {
        fclose($socket);
        return ['success' => false, 'message' => 'Invalid recipient email address.'];
    }

    fputs($socket, "MAIL FROM: <{$fromAddress}>\r\n");
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP rejected the sender address.'];
    }

    fputs($socket, "RCPT TO: <{$toAddress}>\r\n");
    $response = fgets($socket, 512);
    if (!in_array(substr((string)$response, 0, 3), ['250', '251'], true)) {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP rejected the recipient address.'];
    }

    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 512);
    if (substr((string)$response, 0, 3) !== '354') {
        fclose($socket);
        return ['success' => false, 'message' => 'SMTP server did not accept the message body.'];
    }

    $safeFromName = str_replace(["\r", "\n"], '', $fromName);
    $safeSubject = str_replace(["\r", "\n"], '', (string)$subject);
    $headers  = "From: {$safeFromName} <{$fromAddress}>\r\n";
    $headers .= "To: <{$toAddress}>\r\n";
    $headers .= "Subject: {$safeSubject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Date: " . date('r') . "\r\n\r\n";

    fputs($socket, $headers . $body . "\r\n.\r\n");
    $response = fgets($socket, 512);
    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr((string)$response, 0, 3) === '250') {
        return ['success' => true, 'message' => "Email accepted by SMTP server for {$toAddress}."];
    }

    return ['success' => false, 'message' => 'SMTP server did not accept the message.'];
}

function readSmtpResponse($socket) {
    $res = '';
    while ($line = fgets($socket, 512)) {
        $res .= $line;
        if (isset($line[3]) && $line[3] === ' ') break;
    }
    return $res;
}

if ($action === 'test') {
    echo json_encode(runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName));
    exit;
}

if ($action === 'send') {
    $toAddress = trim((string)($input['toAddress'] ?? ''));
    $subject = trim((string)($input['subject'] ?? 'Sree Manju Pharmacy Notification'));
    $body = trim((string)($input['body'] ?? ''));
    if ($toAddress === '' || $body === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Recipient and email body are required.']);
        exit;
    }
    echo json_encode(runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName, $toAddress, $subject, $body));
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unsupported SMTP action.']);
