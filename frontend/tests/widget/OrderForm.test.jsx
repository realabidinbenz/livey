import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderForm } from '../../src/widget/components/OrderForm';

// Mock the API module
vi.mock('../../src/widget/services/api', () => ({
    createOrder: vi.fn()
}));

import { createOrder } from '../../src/widget/services/api';

describe('OrderForm', () => {
    const mockProduct = {
        product_id: 'prod-123',
        products: {
            name: 'Test Product',
            price: 50000,
            image_url: 'https://example.com/image.jpg'
        }
    };

    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all 4 fields (name, phone, address, quantity)', () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    });

    it('shows error for empty required fields on submit', async () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
            expect(screen.getByText(/address is required/i)).toBeInTheDocument();
        });
    });

    it('validates phone format - accepts 05/06/07 numbers', async () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        const phoneInput = screen.getByLabelText(/phone number/i);

        // Valid phone numbers
        fireEvent.change(phoneInput, { target: { value: '0551234567' } });
        fireEvent.blur(phoneInput);
        expect(screen.queryByText(/invalid algerian phone number/i)).not.toBeInTheDocument();

        fireEvent.change(phoneInput, { target: { value: '0612345678' } });
        fireEvent.blur(phoneInput);
        expect(screen.queryByText(/invalid algerian phone number/i)).not.toBeInTheDocument();

        fireEvent.change(phoneInput, { target: { value: '0712345678' } });
        fireEvent.blur(phoneInput);
        expect(screen.queryByText(/invalid algerian phone number/i)).not.toBeInTheDocument();
    });

    it('accepts phone with spaces: 05 51 23 45 67', async () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '05 51 23 45 67' } });
        fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: 'Alger' } });

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.queryByText(/invalid algerian phone number/i)).not.toBeInTheDocument();
        });
    });

    it('accepts phone with +213 prefix', async () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+213 551234567' } });
        fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: 'Alger' } });

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.queryByText(/invalid algerian phone number/i)).not.toBeInTheDocument();
        });
    });

    it('rejects phone with invalid prefix (02)', async () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        const phoneInput = screen.getByLabelText(/phone number/i);

        // Invalid phone numbers
        fireEvent.change(phoneInput, { target: { value: '0212345678' } });
        fireEvent.blur(phoneInput);

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid algerian phone number/i)).toBeInTheDocument();
        });
    });

    it('calculates display total correctly (price * quantity)', () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        // Default quantity is 1, price is 50000
        // Price appears in both product summary and total — expect at least 2 occurrences
        const priceElements = screen.getAllByText('50 000 DA');
        expect(priceElements.length).toBeGreaterThanOrEqual(2);
    });

    it('submit button disabled while submitting', async () => {
        // Make createOrder hang to simulate loading state
        createOrder.mockImplementation(() => new Promise(() => { }));

        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        // Fill in required fields
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Ahmed Benali' }
        });
        fireEvent.change(screen.getByLabelText(/phone number/i), {
            target: { value: '0551234567' }
        });
        fireEvent.change(screen.getByLabelText(/delivery address/i), {
            target: { value: 'Alger Centre' }
        });

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/processing/i)).toBeInTheDocument();
        });
    });

    it('calls onSuccess with order data on successful submit', async () => {
        const mockOrder = { id: 'order-123', order_number: 'ORD-001' };
        createOrder.mockResolvedValue({ order: mockOrder });

        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        // Fill in required fields
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Ahmed Benali' }
        });
        fireEvent.change(screen.getByLabelText(/phone number/i), {
            target: { value: '0551234567' }
        });
        fireEvent.change(screen.getByLabelText(/delivery address/i), {
            target: { value: 'Alger Centre' }
        });

        const submitButton = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith({ order: mockOrder });
        });
    });

    it('displays product information correctly', () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        const priceElements = screen.getAllByText('50 000 DA');
        expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('closes form when close button is clicked', () => {
        render(
            <OrderForm
                product={mockProduct}
                sessionId="sess-123"
                onSuccess={mockOnSuccess}
                onClose={mockOnClose}
            />
        );

        const closeButton = screen.getByLabelText(/close/i);
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
