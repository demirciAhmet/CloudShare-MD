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

export function onDocumentKeydown(event) {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (isCtrlOrMeta && event.key === 's') {
        event.preventDefault();
        console.log('Ctrl/Cmd + S pressed');
        NoteManager.triggerManualSave();
    } else if (isCtrlOrMeta && event.key === 'd') {
        event.preventDefault();
        console.log('Ctrl/Cmd + D pressed');
        UI.toggleThemeOnPage();
    } else if (event.key === 'Escape') {
        if (DOM.shareDropdown && !DOM.shareDropdown.classList.contains('hidden')) {
            UI.closeShareDropdown();
        }
        else if (DOM.notificationModal && !DOM.notificationModal.classList.contains('hidden')) {
            UI.closeNotification();
        }
        else if (DOM.sidebar && !DOM.sidebar.classList.contains('hidden')) {
            UI.closeSidebar();
        }
    }
}
// Note: Markdown editor input is handled by NoteManager.handleEditorContentChange