// Dev-only entry point — imports WidgetApp directly with HMR
// Reads sessionId from URL query param: ?sessionId=xxx
// Falls back to a placeholder message if no sessionId
// Renders WidgetApp into #widget-root
import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetApp from './WidgetApp';
import './widget.css';

const params = new URLSearchParams(window.location.search);
const sessionId = params.get('sessionId');

const root = ReactDOM.createRoot(document.getElementById('widget-root'));
root.render(
    sessionId
        ? <WidgetApp sessionId={sessionId} />
        : <p>Add ?sessionId=xxx to the URL to test the widget</p>
);
