import { describe, it, expect } from 'vitest';
import { formatPrice, formatTime, formatPhone } from '../../src/utils/formatters';

describe('formatPrice', () => {
    it('formats 120000 with DA suffix', () => {
        const result = formatPrice(120000);
        expect(result).toContain('120');
        expect(result).toContain('000');
        expect(result).toContain('DA');
    });

    it('formats 0 as "0 DA"', () => {
        expect(formatPrice(0)).toBe('0 DA');
    });

    it('formats 500 as "500 DA"', () => {
        expect(formatPrice(500)).toBe('500 DA');
    });

    it('returns "0 DA" for invalid input', () => {
        expect(formatPrice(null)).toBe('0 DA');
        expect(formatPrice(undefined)).toBe('0 DA');
        expect(formatPrice('invalid')).toBe('0 DA');
        expect(formatPrice(NaN)).toBe('0 DA');
    });
});

describe('formatTime', () => {
    it('formats ISO string to HH:mm format', () => {
        const isoString = '2026-02-12T10:05:00Z';
        const result = formatTime(isoString);
        // Result depends on local timezone, but should be in HH:mm format
        expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns empty string for empty input', () => {
        expect(formatTime('')).toBe('');
        expect(formatTime(null)).toBe('');
        expect(formatTime(undefined)).toBe('');
    });
});

describe('formatPhone', () => {
    it('formats "0551234567" as "0551 23 45 67"', () => {
        expect(formatPhone('0551234567')).toBe('0551 23 45 67');
    });

    it('formats "0612345678" as "0612 34 56 78"', () => {
        expect(formatPhone('0612345678')).toBe('0612 34 56 78');
    });

    it('formats "0712345678" as "0712 34 56 78"', () => {
        expect(formatPhone('0712345678')).toBe('0712 34 56 78');
    });

    it('handles phone with existing spaces', () => {
        expect(formatPhone('0551 23 45 67')).toBe('0551 23 45 67');
    });

    it('returns empty string for invalid input', () => {
        expect(formatPhone('')).toBe('');
        expect(formatPhone(null)).toBe('');
        expect(formatPhone(undefined)).toBe('');
    });

    it('returns original digits for non-10-digit numbers', () => {
        expect(formatPhone('123')).toBe('123');
        expect(formatPhone('12345678901')).toBe('12345678901');
    });
});
