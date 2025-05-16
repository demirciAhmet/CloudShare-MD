import * as DOM from './dom.js';
import * as UI from './ui.js';
import * as NoteManager from './noteManager.js';
import * as Editor from './editor.js';
import { getState } from './state.js';

export const onNewNoteClick = () => NoteManager.createNewNoteFlow();

export async function onShareClick() {
    const { isNewNote, content } = getState();
    if (isNewNote) {
        if (content.trim()) {
            const noteData = await NoteManager.saveNewNote();
            if (noteData) UI.displayShareLink(); // Relies on state being updated by saveNewNote
        } else UI.showNotification('Add content before sharing.');
    } else UI.displayShareLink();
}

export const onCopyLinkClick = () => UI.copyTextToClipboard(DOM.shareLinkInput.value, DOM.copyLinkBtn);
export const onCopyMarkdownClick = () => UI.copyTextToClipboard(getState().content, DOM.copyMarkdownBtn, 'Copied!', 'Copy Markdown');
export const onEditPreviewToggle = (e) => UI.setEditorPreviewMode(e.target.dataset.mode, Editor.updateMarkdownPreview);
export const onCloseSidebar = () => UI.closeSidebar();
export const onToggleSidebar = () => UI.toggleSidebar();
export const onThemeToggle = () => UI.toggleThemeOnPage();
export const onClearHistory = () => NoteManager.clearAllRecentHistory();
export const onNotificationClose = () => UI.closeNotification();
export const onExpiredOk = () => { UI.closeExpiredModal(); NoteManager.createNewNoteFlow(); };
export const onCloseShare = () => UI.closeShareDropdown();
export const onExpirationChange = (e) => NoteManager.updateNoteExpirationSetting(e.target.value);

export function onWindowClick(e) {
    if (e.target === DOM.shareDropdown) UI.closeShareDropdown();
    if (e.target === DOM.notificationModal) UI.closeNotification();
}

export function onDocumentKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); NoteManager.triggerManualSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); UI.toggleThemeOnPage(); }
    if (e.key === 'Escape') {
        if (!DOM.shareDropdown.classList.contains('hidden')) UI.closeShareDropdown();
        if (!DOM.notificationModal.classList.contains('hidden')) UI.closeNotification();
        if (!DOM.sidebar.classList.contains('collapsed')) UI.closeSidebar();
    }
}
// Note: Markdown editor input is handled by NoteManager.handleEditorContentChange