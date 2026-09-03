<?php
declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../auth.php';

/**
 * validatePasswordComplexityServer() is the real gate every password goes
 * through server-side (registration, staff creation, password reset) - the
 * frontend's validatePasswordComplexity in src/utils/validation.js enforces
 * the same rules for UX, but this is the one that actually matters, since
 * client-side validation can always be bypassed.
 */
final class PasswordComplexityTest extends TestCase
{
    public function testRejectsPasswordShorterThanEightCharacters(): void
    {
        $this->assertNotNull(validatePasswordComplexityServer('Ab1!'));
    }

    public function testRejectsPasswordLongerThanSixteenCharacters(): void
    {
        $this->assertNotNull(validatePasswordComplexityServer('Abcdefgh1!Abcdefgh1!'));
    }

    public function testRejectsPasswordMissingUppercase(): void
    {
        $error = validatePasswordComplexityServer('abcdefg1!');
        $this->assertNotNull($error);
        $this->assertStringContainsStringIgnoringCase('uppercase', $error);
    }

    public function testRejectsPasswordMissingLowercase(): void
    {
        $error = validatePasswordComplexityServer('ABCDEFG1!');
        $this->assertNotNull($error);
        $this->assertStringContainsStringIgnoringCase('lowercase', $error);
    }

    public function testRejectsPasswordMissingNumber(): void
    {
        $error = validatePasswordComplexityServer('Abcdefgh!');
        $this->assertNotNull($error);
        $this->assertStringContainsStringIgnoringCase('number', $error);
    }

    public function testRejectsPasswordMissingSpecialCharacter(): void
    {
        $error = validatePasswordComplexityServer('Abcdefgh1');
        $this->assertNotNull($error);
        $this->assertStringContainsStringIgnoringCase('special', $error);
    }

    public function testAcceptsAPasswordMeetingEveryRequirement(): void
    {
        $this->assertNull(validatePasswordComplexityServer('Secure1!'));
    }

    public function testAcceptsBoundaryLengthsEightAndSixteen(): void
    {
        $this->assertNull(validatePasswordComplexityServer('Abcdef1!'));
        $this->assertNull(validatePasswordComplexityServer('Abcdefgh1!234567'));
    }
}
