<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// Handles GET/POST /categories and GET/POST /formulations. Both tables
// already existed in the base schema (seeded with real data) but had no
// endpoint - this is that endpoint, following the same shape as dealers.php.

function handleCategories(array $segments, array $user): never
{
    $pdo = db();

    if (requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT id, name, description, created_at FROM categories ORDER BY name');
        jsonResponse(['success' => true, 'categories' => $stmt->fetchAll()]);
    }

    if (requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner', 'Staff']);
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        if ($name === '') {
            jsonResponse(['success' => false, 'message' => 'Category name is required.'], 422);
        }

        $dupCheck = $pdo->prepare('SELECT id FROM categories WHERE name = ? LIMIT 1');
        $dupCheck->execute([$name]);
        if ($dupCheck->fetch()) {
            jsonResponse(['success' => false, 'message' => "A category named \"{$name}\" already exists."], 409);
        }

        $stmt = $pdo->prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
        $stmt->execute([$name, trim((string)($input['description'] ?? '')) ?: null]);
        $id = (int)$pdo->lastInsertId();
        logActivity('category_created', 'category', $id, $user, ['name' => $name]);
        jsonResponse(['success' => true, 'category_id' => $id], 201);
    }

    if (requestMethod() === 'DELETE') {
        requireRole(['Owner', 'Co-owner']);
        $id = (int)($segments[1] ?? 0);
        if ($id <= 0) {
            jsonResponse(['success' => false, 'message' => 'A valid category id is required.'], 422);
        }
        $inUse = $pdo->prepare('SELECT COUNT(*) AS n FROM medicines m INNER JOIN categories c ON c.name = m.category WHERE c.id = ?');
        $inUse->execute([$id]);
        if ((int)$inUse->fetch()['n'] > 0) {
            jsonResponse(['success' => false, 'message' => 'This category is used by existing medicines and cannot be deleted.'], 409);
        }
        $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
        logActivity('category_deleted', 'category', $id, $user);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported category operation.'], 405);
}

function handleFormulations(array $segments, array $user): never
{
    $pdo = db();

    if (requestMethod() === 'GET') {
        $stmt = $pdo->query('SELECT id, name, description, default_unit_label, created_at FROM formulations ORDER BY name');
        jsonResponse(['success' => true, 'formulations' => $stmt->fetchAll()]);
    }

    if (requestMethod() === 'POST') {
        requireRole(['Owner', 'Co-owner', 'Staff']);
        $input = requestBody();
        $name = trim((string)($input['name'] ?? ''));
        if ($name === '') {
            jsonResponse(['success' => false, 'message' => 'Formulation name is required.'], 422);
        }

        $dupCheck = $pdo->prepare('SELECT id FROM formulations WHERE name = ? LIMIT 1');
        $dupCheck->execute([$name]);
        if ($dupCheck->fetch()) {
            jsonResponse(['success' => false, 'message' => "A formulation named \"{$name}\" already exists."], 409);
        }

        $allowedUnits = ['strip', 'bottle', 'vial', 'tube', 'inhaler', 'sachet', 'ampoule', 'piece', 'device', 'box'];
        $unitLabel = (string)($input['default_unit_label'] ?? 'strip');
        if (!in_array($unitLabel, $allowedUnits, true)) $unitLabel = 'strip';

        $stmt = $pdo->prepare('INSERT INTO formulations (name, description, default_unit_label) VALUES (?, ?, ?)');
        $stmt->execute([$name, trim((string)($input['description'] ?? '')) ?: null, $unitLabel]);
        $id = (int)$pdo->lastInsertId();
        logActivity('formulation_created', 'formulation', $id, $user, ['name' => $name]);
        jsonResponse(['success' => true, 'formulation_id' => $id], 201);
    }

    if (requestMethod() === 'DELETE') {
        requireRole(['Owner', 'Co-owner']);
        $id = (int)($segments[1] ?? 0);
        if ($id <= 0) {
            jsonResponse(['success' => false, 'message' => 'A valid formulation id is required.'], 422);
        }
        $inUse = $pdo->prepare('SELECT COUNT(*) AS n FROM medicines m INNER JOIN formulations f ON f.name = m.formulation WHERE f.id = ?');
        $inUse->execute([$id]);
        if ((int)$inUse->fetch()['n'] > 0) {
            jsonResponse(['success' => false, 'message' => 'This formulation is used by existing medicines and cannot be deleted.'], 409);
        }
        $pdo->prepare('DELETE FROM formulations WHERE id = ?')->execute([$id]);
        logActivity('formulation_deleted', 'formulation', $id, $user);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['success' => false, 'message' => 'Unsupported formulation operation.'], 405);
}
