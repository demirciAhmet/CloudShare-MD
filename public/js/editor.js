import * as DOM from './dom.js';
import { getState } from './state.js';
// marked and hljs are global

let markedInstance;

export function initializeMarkdown() {
    if (typeof marked === 'undefined' || typeof hljs === 'undefined') {
        console.error("Marked.js or Highlight.js is not loaded.");
        return false;
    }
    marked.setOptions({
        highlight: (code, language) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        breaks: true,
        gfm: true,
        langPrefix: 'hljs language-'
    });
    markedInstance = marked;
    // hljs.highlightAll(); // Call this after content is loaded or previewed
    return true;
}

export function updateMarkdownPreview() {
    const { content } = getState();
    if (!markedInstance) {
        DOM.markdownPreview.innerHTML = '<p class="error">Markdown renderer not initialized.</p>';
        return;
    }
    try {
        DOM.markdownPreview.innerHTML = markedInstance.parse(content);
        DOM.markdownPreview.querySelectorAll('pre code').forEach(hljs.highlightElement);

        // Sync scroll if preview is visible
        if (!DOM.markdownPreview.classList.contains('hidden')) {
            const editorScrollRatio = DOM.markdownEditor.scrollTop / (DOM.markdownEditor.scrollHeight - DOM.markdownEditor.clientHeight || 1);
            DOM.markdownPreview.scrollTop = editorScrollRatio * (DOM.markdownPreview.scrollHeight - DOM.markdownPreview.clientHeight || 1);
        }
    } catch (error) {
        console.error('Error rendering Markdown:', error);
        DOM.markdownPreview.innerHTML = '<p class="error">Error rendering Markdown.</p>';
    }
}