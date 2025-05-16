import * as State from './state.js';
import * as UI from './ui.js';
import * as API from './api.js';
import * as Editor from './editor.js';
import { extractTitleFromContent, debounce } from './utils.js';
import * as DOM from './dom.js'; // For editor value access

let debouncedSaveNoteChanges;

export function initializeNoteManager() {
    debouncedSaveNoteChanges = debounce(async () => {
        const { currentNoteId, creatorToken, content, lastSavedContent } = State.getState();
        if (!currentNoteId || !creatorToken || content === lastSavedContent) {
            if (content === lastSavedContent) UI.setSaveStatusDisplay('saved');
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
            updateRecentNote(currentNoteId, extractTitleFromContent(content));
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
        id, uniqueId, title: extractTitleFromContent(content),
        updatedAt: new Date().toISOString(), viewOnly: false
    });
    UI.setSaveStatusDisplay('saved');
    UI.displayShareLink();
    return result.data;
}

async function loadNoteForViewingFlow(uniqueId) {
    const result = await API.loadNoteForViewingAPI(uniqueId);
    if (result.error) {
        if (result.error === 'expired') UI.showExpiredModal();
        else UI.showNotification(`Failed to load note: ${result.error}`);
        return;
    }
    const { id: noteIdFromServer, content, updatedAt, expiresAt } = result.data;
    const storedToken = State.getNoteTokenFromStorage(noteIdFromServer);
    const isCreator = !!storedToken;

    State.updateState({
        content, uniqueId,
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
        id: isCreator ? noteIdFromServer : null, uniqueId,
        title: extractTitleFromContent(content), updatedAt, viewOnly: !isCreator
    });
}

async function loadNoteForEditingFlow(noteId, token) {
    const result = await API.loadNoteForEditingAPI(noteId, token);
    if (result.error) {
        if (result.error === 'expired') UI.showExpiredModal();
        else UI.showNotification(`Failed to load note for editing: ${result.error}`);
        createNewNoteFlow(); // Fallback
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
        id: noteId, uniqueId, title: extractTitleFromContent(content),
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
            createNewNoteFlow();
        }
    } else createNewNoteFlow();
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

function updateRecentNote(noteId, newTitle) {
    State.updateRecentNoteTitleInState(noteId, newTitle);
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
    UI.renderRecentNotesList(notes, handleRecentNoteItemClick, removeNoteFromRecentList);
}

function handleRecentNoteItemClick(note) {
    if (note.viewOnly || !note.id) window.location.href = `/?view=${note.uniqueId}`;
    else window.location.href = `/?edit=${note.id}`;
}

export async function triggerManualSave() {
    const { isNewNote, content, isCreator, currentNoteId, creatorToken, lastSavedContent } = State.getState();
    if (isNewNote && content.trim()) {
        await saveNewNote();
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
            updateRecentNote(currentNoteId, extractTitleFromContent(content));
        }
    }
}