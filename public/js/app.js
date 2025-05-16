import { attachAllEventListeners } from './eventListeners.js';
import { initializeAppContent, initializeNoteManager } from './noteManager.js';
import { initializeMarkdown } from './editor.js';
import { initializeThemeState } from './state.js';
import { applyThemeToPage } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize core systems
    if (!initializeMarkdown()) {
        // Handle critical failure if markdown/highlight isn't loaded
        console.error("Failed to initialize Markdown services. App may not function correctly.");
        // Optionally display a message to the user
    }
    initializeNoteManager(); // Sets up debounced save, etc.

    // Load initial state and apply it
    initializeThemeState(); // Loads theme from localStorage into appState
    applyThemeToPage();   // Applies theme from appState to DOM

    // Attach all event listeners to DOM elements
    attachAllEventListeners();

    // Determine initial content (new note, view existing, edit existing)
    initializeAppContent();
});