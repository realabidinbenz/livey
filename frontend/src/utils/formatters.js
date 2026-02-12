import dayjs from 'dayjs';

/**
 * Format price in Algerian Dinars with space-separated thousands
 * @param {number} priceInDA - Price in Algerian Dinars (integer)
 * @returns {string} Formatted price (e.g., "120 000 DA")
 */
export function formatPrice(priceInDA) {
    if (typeof priceInDA !== 'number' || isNaN(priceInDA)) {
        return '0 DA';
    }

    const formatter = new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return `${formatter.format(priceInDA)} DA`;
}

/**
 * Format ISO timestamp to local time (HH:mm)
 * @param {string} isoString - ISO 8601 timestamp (e.g., "2026-02-12T10:05:00Z")
 * @returns {string} Local time in HH:mm format (e.g., "10:05")
 */
export function formatTime(isoString) {
    if (!isoString) {
        return '';
    }

    return dayjs(isoString).format('HH:mm');
}

/**
 * Format Algerian phone number with spaces for display
 * @param {string} phone - Phone number (e.g., "0551234567")
 * @returns {string} Formatted phone (e.g., "0551 23 45 67")
 */
export function formatPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return '';
    }

    // Remove any existing spaces or non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Format: 0551 23 45 67
    if (digits.length === 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }

    // Return as-is if not 10 digits
    return phone;
}
