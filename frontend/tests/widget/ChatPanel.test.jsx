import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPanel } from '../../src/widget/components/ChatPanel';

describe('ChatPanel', () => {
    const mockMessages = [
        {
            id: 'msg-1',
            sender_name: 'Ahmed',
            message: 'Hello!',
            is_seller: false,
            created_at: '2026-02-12T10:05:00Z'
        },
        {
            id: 'msg-2',
            sender_name: 'Seller',
            message: 'Welcome to the stream!',
            is_seller: true,
            created_at: '2026-02-12T10:06:00Z'
        }
    ];

    const mockOnSetName = vi.fn();
    const mockOnSendMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Simulate desktop viewport so ChatPanel auto-expands
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024
        });
        // jsdom doesn't implement scrollIntoView
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('renders messages list', () => {
        render(
            <ChatPanel
                messages={mockMessages}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText('Hello!')).toBeInTheDocument();
        expect(screen.getByText('Welcome to the stream!')).toBeInTheDocument();
        expect(screen.getByText('Ahmed')).toBeInTheDocument();
        expect(screen.getByText('Seller')).toBeInTheDocument();
    });

    it('shows seller badge for is_seller=true messages', () => {
        render(
            <ChatPanel
                messages={mockMessages}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText('SELLER')).toBeInTheDocument();
    });

    it('shows name prompt when showNamePrompt=true', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName=""
                showNamePrompt={true}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText(/enter your name to join the chat/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /join chat/i })).toBeInTheDocument();
    });

    it('calls onSetName when joining chat', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName=""
                showNamePrompt={true}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        const nameInput = screen.getByPlaceholderText('Your name');
        fireEvent.change(nameInput, { target: { value: 'NewUser' } });

        const joinButton = screen.getByRole('button', { name: /join chat/i });
        fireEvent.click(joinButton);

        expect(mockOnSetName).toHaveBeenCalledWith('NewUser');
    });

    it('shows "view-only" message when session is not live', () => {
        render(
            <ChatPanel
                messages={mockMessages}
                sessionStatus="ended"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText(/chat is view-only in replay mode/i)).toBeInTheDocument();
    });

    it('send button disabled when input is empty', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeDisabled();
    });

    it('send button enabled when input has text', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        const input = screen.getByPlaceholderText(/type a message/i);
        fireEvent.change(input, { target: { value: 'Hello world' } });

        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeEnabled();
    });

    it('calls onSendMessage when form is submitted', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        const input = screen.getByPlaceholderText(/type a message/i);
        fireEvent.change(input, { target: { value: 'Test message' } });

        const form = input.closest('form');
        fireEvent.submit(form);

        expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('shows empty state when no messages', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });

    it('starts collapsed on mobile viewport', () => {
        Object.defineProperty(window, 'innerWidth', {
            value: 320,
            writable: true,
            configurable: true
        });

        render(
            <ChatPanel
                messages={mockMessages}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        // On mobile (< 640px), chat input should not be visible (panel collapsed)
        expect(screen.queryByPlaceholderText(/type a message/i)).not.toBeInTheDocument();
    });

    it('displays live indicator when session is live', () => {
        render(
            <ChatPanel
                messages={[]}
                sessionStatus="live"
                senderName="TestUser"
                showNamePrompt={false}
                sending={false}
                onSetName={mockOnSetName}
                onSendMessage={mockOnSendMessage}
            />
        );

        expect(screen.getByText(/live chat/i)).toBeInTheDocument();
    });
});
