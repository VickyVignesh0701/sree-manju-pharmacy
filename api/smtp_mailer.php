<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$configFile = __DIR__ . '/smtp_config.json';

// Handle GET to load saved SMTP configuration
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($configFile)) {
        $data = json_decode(file_get_contents($configFile), true);
        echo json_encode(['success' => true, 'config' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No saved SMTP config found.']);
    }
    exit;
}

// Handle POST for test & send email operations
$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?? $_POST;

$action = $input['action'] ?? 'test';
$host = trim($input['host'] ?? 'smtp.gmail.com');
$port = intval($input['port'] ?? 587);
$encryption = strtolower(trim($input['encryption'] ?? 'tls'));
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');
$fromAddress = trim($input['fromAddress'] ?? $username);
$fromName = trim($input['fromName'] ?? 'Sree Manju Pharmacy Notifications');

if (empty($host) || empty($username) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'SMTP Host, Username, and Password are required.'
    ]);
    exit;
}

if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid SMTP Username! Must be a valid email address (e.g. user@gmail.com).'
    ]);
    exit;
}

// Save SMTP Config
$configToSave = [
    'driver' => 'smtp',
    'host' => $host,
    'port' => $port,
    'encryption' => $encryption,
    'username' => $username,
    'password' => $password,
    'fromAddress' => $fromAddress,
    'fromName' => $fromName,
    'updatedAt' => date('Y-m-d H:i:s')
];
file_put_contents($configFile, json_encode($configToSave, JSON_PRETTY_PRINT));

/**
 * Execute SMTP Handshake & Authentication over Socket
 */
function runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName, $toAddress = null, $subject = null, $body = null) {
    $timeout = 12;
    $errno = 0;
    $errstr = '';

    if ($encryption === 'ssl' || $port === 465) {
        $socketHost = 'ssl://' . $host;
    } else {
        $socketHost = 'tcp://' . $host;
    }

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client($socketHost . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);

    if (!$socket) {
        return ['success' => false, 'message' => "Could not connect to SMTP server {$host}:{$port} ({$errstr})"];
    }

    stream_set_timeout($socket, $timeout);
    $response = fgets($socket, 512);

    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return ['success' => false, 'message' => "SMTP Server error greeting response: {$response}"];
    }

    // Send EHLO
    fputs($socket, "EHLO " . gethostname() . "\r\n");
    $response = readSmtpResponse($socket);

    // If TLS mode (port 587), issue STARTTLS command
    if (($encryption === 'tls' || $port === 587) && strpos(strtolower($socketHost), 'ssl://') === false) {
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 512);

        if (substr($response, 0, 3) !== '220') {
            fclose($socket);
            return ['success' => false, 'message' => "STARTTLS failed: {$response}"];
        }

        $cryptoSuccess = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT);
        if (!$cryptoSuccess) {
            fclose($socket);
            return ['success' => false, 'message' => "Failed to enable TLS encryption with SMTP server."];
        }

        // Re-send EHLO after TLS handshake
        fputs($socket, "EHLO " . gethostname() . "\r\n");
        $response = readSmtpResponse($socket);
    }

    // Authenticate: AUTH LOGIN
    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'message' => "AUTH LOGIN command rejected: {$response}"];
    }

    // Send Base64 Username
    fputs($socket, base64_encode($username) . "\r\n");
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'message' => "Username rejected by SMTP server: {$response}"];
    }

    // Send Base64 Password / App Password
    fputs($socket, base64_encode($password) . "\r\n");
    $response = fgets($socket, 512);
    if (substr($response, 0, 3) !== '235') {
        fclose($socket);
        if (strpos($response, '535') !== false) {
            return ['success' => false, 'message' => "Gmail SMTP Authentication Failed! Incorrect Email or App Password. (Server output: " . trim($response) . ")"];
        }
        return ['success' => false, 'message' => "Password rejected: " . trim($response)];
    }

    // If Action is Test Only, return success!
    if (!$toAddress || !$body) {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return [
            'success' => true,
            'message' => "✅ SMTP Connection & Authentication Successful! Connected to {$host}:{$port} with email {$username}."
        ];
    }

    // Send Real Email Payload
    fputs($socket, "MAIL FROM: <{$fromAddress}>\r\n");
    $response = fgets($socket, 512);

    fputs($socket, "RCPT TO: <{$toAddress}>\r\n");
    $response = fgets($socket, 512);

    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 512);

    $headers  = "From: {$fromName} <{$fromAddress}>\r\n";
    $headers .= "To: <{$toAddress}>\r\n";
    $headers .= "Subject: {$subject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Date: " . date('r') . "\r\n\r\n";

    fputs($socket, $headers . $body . "\r\n.\r\n");
    $response = fgets($socket, 512);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr($response, 0, 3) === '250') {
        return [
            'success' => true,
            'message' => "✉️ Email successfully dispatched to {$toAddress} via {$host}!"
        ];
    } else {
        return [
            'success' => false,
            'message' => "Failed to deliver mail: " . trim($response)
        ];
    }
}

function readSmtpResponse($socket) {
    $res = '';
    while ($line = fgets($socket, 512)) {
        $res .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return $res;
}

// Process Action
if ($action === 'test') {
    $result = runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName);
    echo json_encode($result);
} else if ($action === 'send') {
    $toAddress = trim($input['toAddress'] ?? $username);
    $subject = trim($input['subject'] ?? 'Sree Manju Pharmacy Notification');
    $body = trim($input['body'] ?? 'Test message from Sree Manju Pharmacy System.');
    
    $result = runSmtpSocket($host, $port, $encryption, $username, $password, $fromAddress, $fromName, $toAddress, $subject, $body);
    echo json_encode($result);
}
