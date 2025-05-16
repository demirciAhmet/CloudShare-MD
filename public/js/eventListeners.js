import * as DOM from './dom.js';
import * as Handlers from './eventHandlers.js';
import { handleEditorContentChange } from './noteManager.js'; // Specific handler

export function attachAllEventListeners() {
    DOM.markdownEditor.addEventListener('input', handleEditorContentChange);
    DOM.newNoteBtn.addEventListener('click', Handlers.onNewNoteClick);
    DOM.shareBtn.addEventListener('click', Handlers.onShareClick);
    DOM.copyLinkBtn.addEventListener('click', Handlers.onCopyLinkClick);
    DOM.copyMarkdownBtn.addEventListener('click', Handlers.onCopyMarkdownClick);
    DOM.editPreviewToggle.addEventListener('click', Handlers.onEditPreviewToggle);
    DOM.closeSidebarBtn.addEventListener('click', Handlers.onCloseSidebar);
    DOM.toggleSidebarBtn.addEventListener('click', Handlers.onToggleSidebar);
    DOM.themeToggleBtn.addEventListener('click', Handlers.onThemeToggle);
    DOM.clearHistoryBtn.addEventListener('click', Handlers.onClearHistory);
    DOM.notificationCloseBtn.addEventListener('click', Handlers.onNotificationClose);
    DOM.expiredOkBtn.addEventListener('click', Handlers.onExpiredOk);
    DOM.closeShareBtn.addEventListener('click', Handlers.onCloseShare);
    DOM.expirationRadios().forEach(radio => radio.addEventListener('change', Handlers.onExpirationChange));
    window.addEventListener('click', Handlers.onWindowClick);
    document.addEventListener('keydown', Handlers.onDocumentKeydown);
}