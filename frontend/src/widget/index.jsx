// Widget production entry point
// This is the IIFE build entry for embedding on seller websites
import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetApp from './WidgetApp';
import './widget.css';

(function () {
    // Find the script tag that loaded us
    const scripts = document.querySelectorAll('script[data-session-id]');
    const script = scripts[scripts.length - 1]; // Last one (in case of multiple)

    if (!script) {
        console.error('[Livey] Missing data-session-id attribute on script tag');
        return;
    }

    const sessionId = script.getAttribute('data-session-id');
    if (!sessionId) {
        console.error('[Livey] data-session-id is empty');
        return;
    }

    // Create container div
    const container = document.createElement('div');
    container.id = 'livey-widget';
    script.parentNode.insertBefore(container, script.nextSibling);

    // Render widget
    const root = ReactDOM.createRoot(container);
    root.render(<WidgetApp sessionId={sessionId} />);
})();
