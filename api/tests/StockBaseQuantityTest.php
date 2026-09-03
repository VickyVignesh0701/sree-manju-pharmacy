<?php
declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase;

// stock.php only defines functions at the top level (no code runs just from
// including it - confirmed by reading the file, not assumed), so this is
// safe to require directly without a live database connection.
require_once __DIR__ . '/../stock.php';

/**
 * NOTE ON WHAT THIS FILE DOES NOT COVER:
 * stockBaseQuantity()'s error path (quantity <= 0) calls jsonResponse(),
 * which has a `: never` return type - it emits an HTTP response and
 * terminates the PHP process. That's correct behavior for an API endpoint,
 * but it means the error branch can't be exercised in a normal PHPUnit test
 * without process isolation, which brings its own fragility. This suite
 * only covers the success path - the actual strip/tablet conversion math
 * that was the real bug fixed earlier (see AppContext.jsx history:
 * receiveMedicineOrder, undoReceivedOrder, undoStockReturn,
 * returnStockToDealer all had this exact bug on the frontend).
 *
 * Worth doing as a follow-up: refactor stockBaseQuantity's error path to
 * throw an InvalidArgumentException instead of calling jsonResponse()
 * directly, consistent with how api/dealers.php already handles validation
 * errors elsewhere. That would make the error path testable too, and is
 * also just better design - a calculation function performing an HTTP
 * response as a side effect is a code smell independent of testability.
 */
final class StockBaseQuantityTest extends TestCase
{
    public function testStripUnitMultipliesByTabletsPerStrip(): void
    {
        // This is the exact calculation that was missing on the frontend
        // for dealer order receiving/returns before it was fixed: strips
        // must be converted to tablets before touching stock totals.
        $this->assertSame(100, stockBaseQuantity(10, 'strip', 10));
        $this->assertSame(50, stockBaseQuantity(5, 'strip', 10));
    }

    public function testNonStripUnitsPassThroughUnchanged(): void
    {
        // Bottles, tubes, vials etc. are already 1-per-unit - the quantity
        // ordered/sold IS the base quantity, no multiplication.
        $this->assertSame(7, stockBaseQuantity(7, 'bottle', 1));
        $this->assertSame(3, stockBaseQuantity(3, 'tube', 1));
        $this->assertSame(12, stockBaseQuantity(12, 'vial', 1));
    }

    public function testTabletsPerStripOfOneIsANoOp(): void
    {
        $this->assertSame(20, stockBaseQuantity(20, 'strip', 1));
    }

    public function testTabletsPerStripIsFlooredAtOneEvenIfZeroIsPassed(): void
    {
        // max($tabletsPerStrip, 1) in the implementation - guards against a
        // medicine with a misconfigured tabletsPerStrip of 0, which would
        // otherwise zero out all received stock silently.
        $this->assertSame(15, stockBaseQuantity(15, 'strip', 0));
    }

    public function testUnitMatchIsCaseSensitiveOnPurpose(): void
    {
        // The real call sites always lowercase the unit before calling this
        // (see dealers.php: strtolower($item['unit_label'])) - documenting
        // that behavior here so a future refactor doesn't silently change
        // it without a test noticing.
        $this->assertSame(1, stockBaseQuantity(1, 'Strip', 10), 'Uppercase "Strip" is not treated as the strip unit - callers must lowercase first.');
    }
}
