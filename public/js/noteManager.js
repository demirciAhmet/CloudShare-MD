// public/js/noteManager.js
import * as self from './noteManager.js'; // Import self for spied internal calls
import * as State from './state.js';
import * as UI from './ui.js';
import * as API from './api.js';
import * as Editor from './editor.js';
import { getTitleFromContent, debounce } from './utils.js';
import * as DOM from './dom.js';

let debouncedSaveNoteChanges;

export function initializeNoteManager() {
    debouncedSaveNoteChanges = debounce(async () => {
        const { currentNoteId, creatorToken, content, lastSavedContent, uniqueId } = State.getState();
        if (!currentNoteId || !creatorToken) return; // No need to proceed if no active note/creator

        if (content === lastSavedContent) {
            UI.setSaveStatusDisplay('saved');
            return;
        }

        UI.setSaveStatusDisplay('saving');
        const result = await API.saveNoteChangesAPI(currentNoteId, content, creatorToken);
        if (result.error) {
            UI.setSaveStatusDisplay('error');
            UI.showNotification(`Save failed: ${result.error}`);
        } else {
            State.updateState({ lastSavedContent: content });
            UI.setSaveStatusDisplay('saved');
            if (uniqueId && currentNoteId) { // Ensure uniqueId and currentNoteId are present
                updateRecentNote(currentNoteId, getTitleFromContent(content), uniqueId);
            }
        }
    }, State.getState().saveInterval);
}

export function handleEditorContentChange() {
    const newContent = DOM.markdownEditor.value;
    State.updateState({ content: newContent });
    if (!DOM.markdownPreview.classList.contains('hidden')) {
        Editor.updateMarkdownPreview();
    }
    const { isCreator, isNewNote } = State.getState();
    if (isCreator && !isNewNote) {
        UI.setSaveStatusDisplay('saving'); // Immediate feedback
        debouncedSaveNoteChanges();
    }
}

export function createNewNoteFlow() {
    State.updateState({
        currentNoteId: null, uniqueId: null, creatorToken: null,
        isCreator: true, isNewNote: true, content: '', lastSavedContent: ''
    });
    UI.setEditorValue('');
    Editor.updateMarkdownPreview();
    UI.setSaveStatusDisplay('ready');
    UI.setEditorDisabledUI(false);
    UI.updateShareButtonVisibilityUI(true);
    UI.setEditorPreviewMode('edit', Editor.updateMarkdownPreview);
    history.pushState({}, '', '/');
    DOM.markdownEditor.focus();
}

export async function saveNewNote() {
    const { content } = State.getState();
    if (!content.trim()) {
        UI.showNotification('Cannot save an empty note.');
        return null;
    }
    UI.setSaveStatusDisplay('saving');
    const result = await API.saveInitialNoteAPI(content);
    if (result.error) {
        UI.setSaveStatusDisplay('error');
        UI.showNotification(`Failed to create note: ${result.error}`);
        return null;
    }
    const { id, uniqueId, creatorToken } = result.data;
    State.updateState({
        currentNoteId: id, uniqueId, creatorToken,
        isCreator: true, isNewNote: false, lastSavedContent: content
    });
    State.storeNoteTokenInStorage(id, creatorToken);
    history.pushState({}, '', `/?edit=${id}`);
    addNoteToRecentList({
        id, uniqueId, title: getTitleFromContent(content),
        updatedAt: new Date().toISOString(), viewOnly: false
    });
    UI.setSaveStatusDisplay('saved');
    UI.displayShareLink();
    return result.data;
}

async function loadNoteForViewingFlow(uniqueIdParam) { // Renamed param to avoid conflict
    const result = await API.loadNoteForViewingAPI(uniqueIdParam);
    if (result.error) {
        if (result.error === 'expired') UI.showExpiredModal();
        else UI.showNotification(`Failed to load note: ${result.error}`);
        return;
    }
    const { id: noteIdFromServer, content, updatedAt, expiresAt } = result.data;
    const storedToken = State.getNoteTokenFromStorage(noteIdFromServer);
    const isCreator = !!storedToken;

    State.updateState({
        content, uniqueId: uniqueIdParam, // Use the passed uniqueIdParam
        currentNoteId: isCreator ? noteIdFromServer : null,
        creatorToken: isCreator ? storedToken : null,
        isCreator, isNewNote: false, lastSavedContent: content
    });
    UI.setEditorValue(content);
    Editor.updateMarkdownPreview();
    UI.updateShareButtonVisibilityUI(isCreator);
    UI.setEditorDisabledUI(!isCreator);
    UI.setExpirationRadioUI(expiresAt);
    UI.setEditorPreviewMode(isCreator ? 'edit' : 'preview', Editor.updateMarkdownPreview);
    addNoteToRecentList({
        id: isCreator ? noteIdFromServer : null, uniqueId: uniqueIdParam,
        title: getTitleFromContent(content), updatedAt, viewOnly: !isCreator
    });
}

async function loadNoteForEditingFlow(noteId, token) { // This is an internal helper
    const result = await API.loadNoteForEditingAPI(noteId, token);
    if (result.error) {
        if (result.error === 'expired') UI.showExpiredModal();
        else UI.showNotification(`Failed to load note for editing: ${result.error}`);
        self.createNewNoteFlow(); // MODIFIED: Use self
        return;
    }
    const { uniqueId, content, updatedAt, expiresAt } = result.data;
    State.updateState({
        currentNoteId: noteId, uniqueId, creatorToken: token, content,
        lastSavedContent: content, isCreator: true, isNewNote: false
    });
    UI.setEditorValue(content);
    Editor.updateMarkdownPreview();
    UI.setEditorDisabledUI(false);
    UI.updateShareButtonVisibilityUI(true);
    UI.setEditorPreviewMode('edit', Editor.updateMarkdownPreview);
    UI.setExpirationRadioUI(expiresAt);
    addNoteToRecentList({
        id: noteId, uniqueId, title: getTitleFromContent(content),
        updatedAt, viewOnly: false
    });
}

export async function initializeAppContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    const editId = urlParams.get('edit');

    State.loadRecentNotesState();
    refreshRecentNotesDisplay();

    if (viewId) await loadNoteForViewingFlow(viewId);
    else if (editId) {
        const token = State.getNoteTokenFromStorage(editId);
        if (token) await loadNoteForEditingFlow(editId, token);
        else {
            UI.showNotification('Creator token not found. Opening as new note.');
            self.createNewNoteFlow(); // MODIFIED: Use self
        }
    } else self.createNewNoteFlow(); // MODIFIED: Use self
}

export async function updateNoteExpirationSetting(expirationOption) {
    const { currentNoteId, creatorToken } = State.getState();
    if (!currentNoteId || !creatorToken) return;
    const result = await API.updateNoteExpirationAPI(currentNoteId, creatorToken, expirationOption);
    if (result.error) UI.showNotification(`Failed to set expiration: ${result.error}`);
    else UI.showNotification(`Expiration set to: ${UI.getExpirationTextForDisplay(expirationOption)}`);
}

function addNoteToRecentList(note) {
    State.addOrUpdateRecentNoteInState(note);
    refreshRecentNotesDisplay();
}

// Modified updateRecentNote to accept uniqueId
function updateRecentNote(noteId, newTitle, uniqueId) {
    State.updateRecentNoteTitleInState(noteId, newTitle, uniqueId); // Pass uniqueId
    refreshRecentNotesDisplay();
}

export function removeNoteFromRecentList(noteId, uniqueId) {
    State.removeNoteFromHistoryInState(noteId, uniqueId);
    refreshRecentNotesDisplay();
    UI.showNotification('Note removed from history.');
}

export function clearAllRecentHistory() {
    if (confirm('Are you sure you want to clear all note history?')) {
        State.clearHistoryInState();
        refreshRecentNotesDisplay();
        UI.showNotification('History cleared.');
    }
}

function refreshRecentNotesDisplay() {
    const notes = State.getState().recentNotes;
    // If removeNoteFromRecentList is spied on, this call should also use self.
    // For now, assuming it's not the one causing spy issues.
    UI.renderRecentNotesList(notes, handleRecentNoteItemClick, removeNoteFromRecentList);
}

function handleRecentNoteItemClick(note) {
    if (note.viewOnly || !note.id) window.location.href = `/?view=${note.uniqueId}`;
    else window.location.href = `/?edit=${note.id}`;
}

export async function triggerManualSave() {
    const { isNewNote, content, isCreator, currentNoteId, creatorToken, lastSavedContent, uniqueId } = State.getState();
    if (isNewNote && content.trim()) {
        await self.saveNewNote(); // MODIFIED: Use self
    } else if (!isNewNote && isCreator) {
        if (content === lastSavedContent) {
            UI.setSaveStatusDisplay('saved');
            return;
        }
        UI.setSaveStatusDisplay('saving');
        const result = await API.saveNoteChangesAPI(currentNoteId, content, creatorToken);
        if (result.error) {
            UI.setSaveStatusDisplay('error');
            UI.showNotification(`Save failed: ${result.error}`);
        } else {
            State.updateState({ lastSavedContent: content });
            UI.setSaveStatusDisplay('saved');
            if (uniqueId && currentNoteId) { // Ensure uniqueId and currentNoteId are present
                updateRecentNote(currentNoteId, getTitleFromContent(content), uniqueId);
            }
        }
    }
}