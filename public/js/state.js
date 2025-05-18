import { THEME_STORAGE_KEY, DEFAULT_THEME, RECENT_NOTES_LIMIT, NOTE_TOKEN_STORAGE_PREFIX, SAVE_INTERVAL } from './config.js';

const getInitialAppState = () => ({
    currentNoteId: null,
    uniqueId: null,        // For view-only links
    creatorToken: null,    // For edit links
    isCreator: false,
    isNewNote: true,
    content: '',
    lastSavedContent: '',
    saveTimeout: null,
    saveInterval: SAVE_INTERVAL,
    recentNotes: [],       // Array of { id, uniqueId, title, updatedAt, viewOnly }
    theme: DEFAULT_THEME,
    isLoading: false,
    errorMessage: null,
    isDirty: false,        // To track unsaved changes
});

let appState = getInitialAppState();

// Function to get a copy of the current state
export function getState() {
    return { ...appState };
}

// Function to update parts of the state
export function updateState(newState) {
    appState = { ...appState, ...newState };
    // Potentially trigger UI updates or other side effects here if needed globally
    // For example, if isDirty changes, maybe update a save indicator.
}

// Function to reset the state to its initial values (primarily for testing)
export function resetStateForTesting() {
    appState = getInitialAppState();
}

export function initializeThemeState() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
        appState.theme = storedTheme;
    } else {
        appState.theme = DEFAULT_THEME;
    }
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
    } else {
        appState.recentNotes = [];
    }
}

export function addOrUpdateRecentNoteInState(note) {
    let notes = [...appState.recentNotes];
    const existingNoteIndex = note.id
        ? notes.findIndex(n => n.id === note.id)
        : notes.findIndex(n => n.uniqueId === note.uniqueId);

    if (existingNoteIndex > -1) {
        notes.splice(existingNoteIndex, 1);
    }
    notes.unshift(note); // Add to the beginning
    if (notes.length > RECENT_NOTES_LIMIT) {
        notes = notes.slice(0, RECENT_NOTES_LIMIT);
    }
    appState.recentNotes = notes;
    localStorage.setItem('recent_notes', JSON.stringify(notes));
}

export function updateRecentNoteTitleInState(noteId, newTitle, uniqueIdToMatch) {
    const noteIndex = appState.recentNotes.findIndex(note =>
        (note.id && note.id === noteId) || (note.uniqueId && note.uniqueId === uniqueIdToMatch)
    );
    if (noteIndex !== -1) {
        appState.recentNotes[noteIndex].title = newTitle;
        appState.recentNotes[noteIndex].updatedAt = new Date().toISOString();

        const [updatedNote] = appState.recentNotes.splice(noteIndex, 1);
        appState.recentNotes.unshift(updatedNote);
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