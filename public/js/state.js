import { THEME_STORAGE_KEY, DEFAULT_THEME, RECENT_NOTES_LIMIT, NOTE_TOKEN_STORAGE_PREFIX, SAVE_INTERVAL } from './config.js';

let appState = {
    currentNoteId: null,
    uniqueId: null,
    creatorToken: null,
    isCreator: false,
    isNewNote: true,
    content: '',
    lastSavedContent: '',
    saveTimeout: null,
    saveInterval: SAVE_INTERVAL,
    recentNotes: [],
    theme: DEFAULT_THEME
};

export function getState() {
    return { ...appState }; // Return a copy
}

export function updateState(newState) {
    appState = { ...appState, ...newState };
}

export function initializeThemeState() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
        appState.theme = storedTheme;
    }
    // No need to return, appState is updated directly
}

export function setThemeState(newTheme) {
    appState.theme = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
}

export function loadRecentNotesState() {
    const storedNotes = localStorage.getItem('recent_notes');
    if (storedNotes) {
        try {
            appState.recentNotes = JSON.parse(storedNotes);
        } catch (e) {
            console.error('Error parsing stored notes:', e);
            appState.recentNotes = [];
        }
    }
}

export function addOrUpdateRecentNoteInState(note) {
    let notes = appState.recentNotes.filter(item => {
        if (note.id && item.id === note.id) return false; // For editable notes
        if (note.uniqueId && item.uniqueId === note.uniqueId) return false; // For view-only or new notes
        return true;
    });
    notes.unshift(note);
    appState.recentNotes = notes.slice(0, RECENT_NOTES_LIMIT);
    localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
}

export function updateRecentNoteTitleInState(noteId, newTitle) {
    const noteIndex = appState.recentNotes.findIndex(note => note.id === noteId);
    if (noteIndex !== -1) {
        appState.recentNotes[noteIndex].title = newTitle;
        appState.recentNotes[noteIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
    }
}

export function removeNoteFromHistoryInState(noteId, uniqueId) {
    appState.recentNotes = appState.recentNotes.filter(note => {
        if (noteId && note.id === noteId) return false;
        if (uniqueId && note.uniqueId === uniqueId) return false;
        return true;
    });
    localStorage.setItem('recent_notes', JSON.stringify(appState.recentNotes));
}

export function clearHistoryInState() {
    appState.recentNotes = [];
    localStorage.removeItem('recent_notes');
}

export function getNoteTokenFromStorage(noteId) {
    return localStorage.getItem(`${NOTE_TOKEN_STORAGE_PREFIX}${noteId}`);
}

export function storeNoteTokenInStorage(noteId, token) {
    localStorage.setItem(`${NOTE_TOKEN_STORAGE_PREFIX}${noteId}`, token);
}